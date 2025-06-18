import { users, properties, coListings, coListingRequests, propertyRequirements, conversations, messages, betaSignups, suggestions, clients, deals, tasks, type User, type InsertUser, type Property, type InsertProperty, type CoListingRequest, type InsertCoListingRequest, type PropertyRequirement, type InsertPropertyRequirement, type Conversation, type InsertConversation, type Message, type InsertMessage, type BetaSignup, type InsertBetaSignup, type Suggestion, type InsertSuggestion, type Client, type InsertClient, type Deal, type InsertDeal, type Task, type InsertTask } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, not, desc } from "drizzle-orm";
import { withCache, cache } from "./cache";

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
  deleteProperty(id: number): Promise<void>;

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

  // Messaging methods
  getNetworkUsers(currentUserId: number): Promise<User[]>;
  getUserConversations(userId: number): Promise<(Conversation & { otherParticipant: User; property?: Property; lastMessage?: Message; unreadCount: number })[]>;
  getConversation(participant1Id: number, participant2Id: number, propertyId?: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationMessages(conversationId: number): Promise<(Message & { sender: User })[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;

  // Beta signup and login methods
  createBetaSignup(signup: InsertBetaSignup): Promise<BetaSignup>;
  getBetaSignupByPhone(phone: string): Promise<BetaSignup | undefined>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  authenticateUser(phone: string): Promise<User | undefined>;
  
  // Profile completion methods
  completeUserProfile(userId: number, profileData: Partial<InsertUser>): Promise<User>;
  
  // Admin methods
  getAllBetaSignups(): Promise<BetaSignup[]>;
  updateBetaSignupStatus(id: number, status: string, notes?: string): Promise<BetaSignup>;

  // Client management methods
  getClients(userId: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient & { userId: number }): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Deal management methods
  getDeals(userId: number): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  getClientDeals(clientId: number): Promise<Deal[]>;
  createDeal(deal: InsertDeal & { userId: number }): Promise<Deal>;
  updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: number): Promise<void>;

  // Task management methods
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask & { userId: number }): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
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

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
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

  // Messaging methods implementation
  async getNetworkUsers(currentUserId: number): Promise<User[]> {
    const networkUsers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.isVerified, true),
        eq(users.isKycComplete, true)
      ));
    
    return networkUsers.filter(user => user.id !== currentUserId);
  }

  async getUserConversations(userId: number): Promise<(Conversation & { otherParticipant: User; property?: Property; lastMessage?: Message; unreadCount: number })[]> {
    // Get all conversations for this user
    const userConversations = await db
      .select()
      .from(conversations)
      .where(or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      ))
      .orderBy(desc(conversations.lastMessageAt));

    const conversationsWithDetails = [];
    
    for (const conv of userConversations) {
      const otherParticipantId = conv.participant1Id === userId 
        ? conv.participant2Id 
        : conv.participant1Id;
      
      // Get other participant details
      const [otherParticipant] = await db
        .select()
        .from(users)
        .where(eq(users.id, otherParticipantId));

      // Get property details if exists
      let property = undefined;
      if (conv.propertyId) {
        const [propertyData] = await db
          .select()
          .from(properties)
          .where(eq(properties.id, conv.propertyId));
        property = propertyData;
      }

      // Get last message (most recent)
      const lastMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      const lastMessage = lastMessages.length > 0 ? lastMessages[0] : undefined;

      // Count unread messages from other participant
      const unreadMessages = await db
        .select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, conv.id),
          eq(messages.isRead, false),
          eq(messages.senderId, otherParticipantId)
        ));

      conversationsWithDetails.push({
        ...conv,
        otherParticipant,
        property,
        lastMessage,
        unreadCount: unreadMessages.length
      });
    }
    
    return conversationsWithDetails;
  }

  async getConversation(participant1Id: number, participant2Id: number, propertyId?: number): Promise<Conversation | undefined> {
    const query = propertyId 
      ? and(
          or(
            and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
            and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
          ),
          eq(conversations.propertyId, propertyId)
        )
      : or(
          and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
          and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
        );

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(query);
    
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversationMessages(conversationId: number): Promise<(Message & { sender: User })[]> {
    const messagesWithSender = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return messagesWithSender.map(row => ({
      ...row.message,
      sender: row.sender!
    }));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();

    // Update conversation's last message timestamp
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    // Mark messages as read where the current user is NOT the sender
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        not(eq(messages.senderId, userId)), // Mark messages from others as read
        eq(messages.isRead, false)
      ));
  }

  // Beta signup and login methods
  async createBetaSignup(signup: InsertBetaSignup): Promise<BetaSignup> {
    const [created] = await db.insert(betaSignups).values(signup).returning();
    return created;
  }

  async getBetaSignupByPhone(phone: string): Promise<BetaSignup | undefined> {
    const [signup] = await db.select().from(betaSignups).where(eq(betaSignups.phone, phone));
    return signup;
  }

  async createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion> {
    const [created] = await db.insert(suggestions).values(suggestion).returning();
    return created;
  }

  async authenticateUser(phone: string): Promise<User | undefined> {
    // Check if user has an approved beta signup
    const [betaSignup] = await db.select().from(betaSignups).where(
      and(
        eq(betaSignups.phone, phone),
        eq(betaSignups.status, "approved")
      )
    );
    
    if (!betaSignup) {
      return undefined;
    }

    // Get or create user account
    let [user] = await db.select().from(users).where(eq(users.phone, phone));
    if (!user) {
      [user] = await db.insert(users).values({
        phone,
        name: betaSignup.name,
        isVerified: true
      }).returning();
    }
    
    return user;
  }

  // Admin methods
  async getAllBetaSignups(): Promise<BetaSignup[]> {
    const signups = await db.select().from(betaSignups).orderBy(desc(betaSignups.createdAt));
    return signups;
  }

  async updateBetaSignupStatus(id: number, status: string, notes?: string): Promise<BetaSignup> {
    const updateData: any = { 
      status,
      notes 
    };
    
    if (status === "approved") {
      updateData.approvedAt = new Date();
    }

    const [updated] = await db
      .update(betaSignups)
      .set(updateData)
      .where(eq(betaSignups.id, id))
      .returning();
    
    return updated;
  }

  async completeUserProfile(userId: number, profileData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        isProfileComplete: true,
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  // Client management methods
  async getClients(userId: number): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.userId, userId));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: InsertClient & { userId: number }): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Deal management methods
  async getDeals(userId: number): Promise<Deal[]> {
    return db.select().from(deals).where(eq(deals.userId, userId));
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal || undefined;
  }

  async createDeal(deal: InsertDeal & { userId: number }): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal> {
    const [updatedDeal] = await db
      .update(deals)
      .set(updates)
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  // Task management methods
  async getTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask & { userId: number }): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}

export const storage = new DatabaseStorage();
