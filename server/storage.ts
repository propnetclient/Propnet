import { users, properties, coListings, coListingRequests, propertyRequirements, chats, chatParticipants, chatMessages, connections, forumChannels, forumPosts, referralRequests, events, type User, type InsertUser, type Property, type InsertProperty, type CoListingRequest, type InsertCoListingRequest, type PropertyRequirement, type InsertPropertyRequirement, type Chat, type InsertChat, type ChatMessage, type InsertChatMessage, type Connection, type InsertConnection } from "@shared/schema";
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

  // Consent and approval methods
  getConsentData(consentId: string): Promise<any>;
  updatePropertyApproval(consentId: string, status: string): Promise<Property>;
  checkDuplicateProperty(propertyData: any): Promise<Property[]>;

  // Chat methods
  getUserChats(userId: number): Promise<(Chat & { participants: (typeof chatParticipants.$inferSelect & { user: User })[], messages: ChatMessage[], property?: Property })[]>;
  getOrCreateChat(participantIds: number[], propertyId?: number): Promise<Chat>;
  getChatMessages(chatId: number, userId: number): Promise<(ChatMessage & { sender: User })[]>;
  sendMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(chatId: number, userId: number): Promise<void>;

  // Connection methods
  getUserConnections(userId: number): Promise<(Connection & { requester: User; receiver: User })[]>;
  createConnectionRequest(request: InsertConnection): Promise<Connection>;
  updateConnectionStatus(connectionId: number, status: string): Promise<Connection>;

  // Community methods
  getBrokerDirectory(filters?: { city?: string; specialty?: string }): Promise<User[]>;
  getReferralRequests(): Promise<any[]>;
  getEvents(): Promise<any[]>;
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

  async getConsentData(consentId: string): Promise<any> {
    const [propertyWithDetails] = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.consentId, consentId));

    if (!propertyWithDetails) return null;

    return {
      property: propertyWithDetails.properties,
      agent: propertyWithDetails.users,
      status: propertyWithDetails.properties.ownerApprovalStatus
    };
  }

  async updatePropertyApproval(consentId: string, status: string): Promise<Property> {
    const [property] = await db
      .update(properties)
      .set({ 
        ownerApprovalStatus: status,
        approvalTimestamp: status === 'approved' ? new Date() : null
      })
      .where(eq(properties.consentId, consentId))
      .returning();
    return property;
  }

  // Chat methods implementation
  async getUserChats(userId: number): Promise<(Chat & { participants: (typeof chatParticipants.$inferSelect & { user: User })[], messages: ChatMessage[], property?: Property })[]> {
    const userChats = await db
      .select()
      .from(chats)
      .leftJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .leftJoin(users, eq(chatParticipants.userId, users.id))
      .leftJoin(properties, eq(chats.propertyId, properties.id))
      .where(eq(chatParticipants.userId, userId));

    // Group and format the results
    const chatMap = new Map();
    for (const row of userChats) {
      const chatId = row.chats.id;
      if (!chatMap.has(chatId)) {
        chatMap.set(chatId, {
          ...row.chats,
          participants: [],
          messages: [],
          property: row.properties
        });
      }
      
      if (row.users && row.chat_participants) {
        chatMap.get(chatId).participants.push({
          ...row.chat_participants,
          user: row.users
        });
      }
    }

    // Get recent messages for each chat
    for (const [chatId, chat] of chatMap) {
      const messages = await this.getChatMessages(chatId, userId);
      chat.messages = messages.slice(-1); // Just the latest message for preview
    }

    return Array.from(chatMap.values());
  }

  async getOrCreateChat(participantIds: number[], propertyId?: number): Promise<Chat> {
    // Check if chat already exists between these participants
    const existingChat = await db
      .select({ chatId: chatParticipants.chatId })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, participantIds[0]))
      .groupBy(chatParticipants.chatId)
      .having(eq(db.raw('COUNT(*)'), participantIds.length));

    if (existingChat.length > 0) {
      const [chat] = await db.select().from(chats).where(eq(chats.id, existingChat[0].chatId));
      return chat;
    }

    // Create new chat
    const [newChat] = await db.insert(chats).values({
      propertyId: propertyId || null
    }).returning();

    // Add participants
    for (const userId of participantIds) {
      await db.insert(chatParticipants).values({
        chatId: newChat.id,
        userId
      });
    }

    return newChat;
  }

  async getChatMessages(chatId: number, userId: number): Promise<(ChatMessage & { sender: User })[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(chatMessages.createdAt);

    return messages.map(row => ({
      ...row.chat_messages,
      sender: row.users!
    }));
  }

  async sendMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(and(
        eq(chatMessages.chatId, chatId),
        eq(chatMessages.senderId, userId)
      ));
  }

  // Connection methods implementation
  async getUserConnections(userId: number): Promise<(Connection & { requester: User; receiver: User })[]> {
    const connections = await db
      .select()
      .from(connections)
      .leftJoin(users, or(
        eq(connections.requesterId, users.id),
        eq(connections.receiverId, users.id)
      ))
      .where(or(
        eq(connections.requesterId, userId),
        eq(connections.receiverId, userId)
      ));

    // This is a simplified implementation - in practice you'd need to properly join both users
    return connections as any;
  }

  async createConnectionRequest(request: InsertConnection): Promise<Connection> {
    const [newConnection] = await db.insert(connections).values(request).returning();
    return newConnection;
  }

  async updateConnectionStatus(connectionId: number, status: string): Promise<Connection> {
    const [connection] = await db
      .update(connections)
      .set({ status, updatedAt: new Date() })
      .where(eq(connections.id, connectionId))
      .returning();
    return connection;
  }

  // Community methods implementation
  async getBrokerDirectory(filters?: { city?: string; specialty?: string }): Promise<User[]> {
    let query = db.select().from(users).where(eq(users.isVerified, true));
    
    if (filters?.city) {
      query = query.where(eq(users.city, filters.city));
    }

    const brokers = await query;
    return brokers;
  }

  async getReferralRequests(): Promise<any[]> {
    const requests = await db
      .select()
      .from(referralRequests)
      .leftJoin(users, eq(referralRequests.authorId, users.id))
      .where(eq(referralRequests.status, 'active'));

    return requests.map(row => ({
      ...row.referral_requests,
      author: row.users
    }));
  }

  async getEvents(): Promise<any[]> {
    const events = await db
      .select()
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(properties, eq(events.propertyId, properties.id))
      .where(eq(events.isPublic, true));

    return events.map(row => ({
      ...row.events,
      organizer: row.users,
      property: row.properties
    }));
  }
}

export const storage = new DatabaseStorage();
