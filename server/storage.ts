import { users, properties, coListings, coListingRequests, propertyRequirements, type User, type InsertUser, type Property, type InsertProperty, type CoListingRequest, type InsertCoListingRequest, type PropertyRequirement, type InsertPropertyRequirement } from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  updateUserProfile(id: number, updates: Partial<InsertUser>): Promise<User>;

  // Property methods
  getProperties(): Promise<(Property & { owner: User; coAgents?: User[] })[]>;
  getProperty(id: number): Promise<(Property & { owner: User; coAgents?: User[] }) | undefined>;
  getUserProperties(userId: number): Promise<Property[]>;
  createProperty(property: InsertProperty & { ownerId: number }): Promise<Property>;
  updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property>;

  // Co-listing methods
  getCoListingRequests(ownerId: number): Promise<(CoListingRequest & { requester: User; property: Property })[]>;
  createCoListingRequest(request: InsertCoListingRequest): Promise<CoListingRequest>;
  updateCoListingRequestStatus(id: number, status: string): Promise<CoListingRequest>;
  createCoListing(propertyId: number, agentId: number): Promise<void>;

  // Property requirements methods
  getPropertyRequirements(): Promise<(PropertyRequirement & { user: User })[]>;
  getUserRequirements(userId: number): Promise<PropertyRequirement[]>;
  createPropertyRequirement(requirement: InsertPropertyRequirement & { userId: number }): Promise<PropertyRequirement>;
  updatePropertyRequirement(id: number, updates: Partial<InsertPropertyRequirement>): Promise<PropertyRequirement>;
  deletePropertyRequirement(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        areaOfExpertise: updates.areaOfExpertise ? updates.areaOfExpertise.toString().split(',').map(s => s.trim()) : undefined,
        workingRegions: updates.workingRegions ? updates.workingRegions.toString().split(',').map(s => s.trim()) : undefined,
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getProperties(): Promise<(Property & { owner: User; coAgents?: User[] })[]> {
    const propertiesWithOwners = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.isActive, true));

    // Get co-agents for each property
    const result = [];
    for (const item of propertiesWithOwners) {
      const coAgents = await db
        .select({ agent: users })
        .from(coListings)
        .leftJoin(users, eq(coListings.agentId, users.id))
        .where(eq(coListings.propertyId, item.properties.id));

      result.push({
        ...item.properties,
        owner: item.users!,
        coAgents: coAgents.map(ca => ca.agent!),
      });
    }

    return result;
  }

  async getProperty(id: number): Promise<(Property & { owner: User; coAgents?: User[] }) | undefined> {
    const [propertyWithOwner] = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(and(eq(properties.id, id), eq(properties.isActive, true)));

    if (!propertyWithOwner) return undefined;

    const coAgents = await db
      .select({ agent: users })
      .from(coListings)
      .leftJoin(users, eq(coListings.agentId, users.id))
      .where(eq(coListings.propertyId, id));

    return {
      ...propertyWithOwner.properties,
      owner: propertyWithOwner.users!,
      coAgents: coAgents.map(ca => ca.agent!),
    };
  }

  async getUserProperties(userId: number): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(and(eq(properties.ownerId, userId), eq(properties.isActive, true)));
  }

  async createProperty(property: InsertProperty & { ownerId: number }): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async checkDuplicateProperty(propertyData: any): Promise<Property[]> {
    // Check for similar properties based on location, type, size, and price
    const similarProperties = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.propertyType, propertyData.propertyType),
        eq(properties.location, propertyData.location),
        eq(properties.isActive, true)
      ));

    return similarProperties.filter(prop => {
      // Check price similarity (within 10%)
      const propPrice = parseFloat(prop.price.replace(/[^\d.]/g, '')) || 0;
      const newPrice = parseFloat(propertyData.price.replace(/[^\d.]/g, '')) || 0;
      const priceDiff = Math.abs(propPrice - newPrice) / Math.max(propPrice, newPrice);
      
      // Check size similarity (within 10%)
      const propSize = parseFloat(prop.size.replace(/[^\d.]/g, '')) || 0;
      const newSize = parseFloat(propertyData.size.replace(/[^\d.]/g, '')) || 0;
      const sizeDiff = Math.abs(propSize - newSize) / Math.max(propSize, newSize);
      
      // Consider it a potential duplicate if price and size are within 10% and building matches
      return priceDiff <= 0.1 && sizeDiff <= 0.1 && 
             prop.buildingSociety === propertyData.buildingSociety;
    });
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property> {
    const [property] = await db
      .update(properties)
      .set(updates)
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async getCoListingRequests(ownerId: number): Promise<(CoListingRequest & { requester: User; property: Property })[]> {
    const requests = await db
      .select()
      .from(coListingRequests)
      .leftJoin(users, eq(coListingRequests.requesterId, users.id))
      .leftJoin(properties, eq(coListingRequests.propertyId, properties.id))
      .where(and(eq(coListingRequests.ownerId, ownerId), eq(coListingRequests.status, "pending")));

    return requests.map(r => ({
      ...r.co_listing_requests,
      requester: r.users!,
      property: r.properties!,
    }));
  }

  async createCoListingRequest(request: InsertCoListingRequest): Promise<CoListingRequest> {
    const [newRequest] = await db
      .insert(coListingRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateCoListingRequestStatus(id: number, status: string): Promise<CoListingRequest> {
    const [request] = await db
      .update(coListingRequests)
      .set({ status })
      .where(eq(coListingRequests.id, id))
      .returning();
    return request;
  }

  async createCoListing(propertyId: number, agentId: number): Promise<void> {
    await db
      .insert(coListings)
      .values({ propertyId, agentId });
  }

  async getPropertyRequirements(): Promise<(PropertyRequirement & { user: User })[]> {
    const requirements = await db
      .select()
      .from(propertyRequirements)
      .leftJoin(users, eq(propertyRequirements.userId, users.id))
      .where(eq(propertyRequirements.isActive, true));

    return requirements.map(r => ({
      ...r.property_requirements,
      user: r.users!,
    }));
  }

  async getUserRequirements(userId: number): Promise<PropertyRequirement[]> {
    return await db
      .select()
      .from(propertyRequirements)
      .where(and(eq(propertyRequirements.userId, userId), eq(propertyRequirements.isActive, true)));
  }

  async createPropertyRequirement(requirement: InsertPropertyRequirement & { userId: number }): Promise<PropertyRequirement> {
    const [newRequirement] = await db
      .insert(propertyRequirements)
      .values(requirement)
      .returning();
    return newRequirement;
  }

  async updatePropertyRequirement(id: number, updates: Partial<InsertPropertyRequirement>): Promise<PropertyRequirement> {
    const [requirement] = await db
      .update(propertyRequirements)
      .set(updates)
      .where(eq(propertyRequirements.id, id))
      .returning();
    return requirement;
  }

  async deletePropertyRequirement(id: number): Promise<void> {
    await db
      .update(propertyRequirements)
      .set({ isActive: false })
      .where(eq(propertyRequirements.id, id));
  }
}

export const storage = new DatabaseStorage();
