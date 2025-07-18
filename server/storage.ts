import { 
  users, 
  profiles,
  conversations,
  conversationParticipants,
  messages,
  contacts,
  messageStatus,
  type User, 
  type InsertUser,
  type Profile,
  type InsertProfile,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Contact,
  type InsertContact
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or, desc, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { 
  schema: { 
    users, 
    profiles, 
    conversations, 
    conversationParticipants, 
    messages, 
    contacts, 
    messageStatus 
  } 
});

export interface IStorage {
  // Auth methods
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // Profile methods
  getProfileByUserId(userId: number): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: number, updates: Partial<InsertProfile>): Promise<Profile | undefined>;

  // Conversation methods
  getConversationsByUserId(userId: number): Promise<any[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  addUserToConversation(conversationId: string, userId: number): Promise<void>;

  // Message methods
  getMessagesByConversationId(conversationId: string): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Contact methods
  getContactsByUserId(userId: number): Promise<any[]>;
  createContact(contact: InsertContact): Promise<Contact>;
}

export class DatabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(user.password);
    const result = await db.insert(users).values({
      ...user,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getProfileByUserId(userId: number): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return result[0];
  }

  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.username, username));
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async updateProfile(userId: number, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const result = await db.update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return result[0];
  }

  async getConversationsByUserId(userId: number): Promise<any[]> {
    // Get conversations where user is a participant
    const result = await db
      .select({
        conversation: conversations,
        participant: conversationParticipants,
      })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .where(eq(conversationParticipants.userId, userId))
      .orderBy(desc(conversations.updatedAt));

    // Get additional details for each conversation
    const conversationsWithDetails = await Promise.all(
      result.map(async (row) => {
        // Get all participants
        const participants = await db
          .select({
            profile: profiles,
            participant: conversationParticipants,
          })
          .from(conversationParticipants)
          .innerJoin(profiles, eq(conversationParticipants.userId, profiles.userId))
          .where(eq(conversationParticipants.conversationId, row.conversation.id));

        // Get last message
        const lastMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, row.conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          ...row.conversation,
          participants: participants.map(p => p.profile),
          lastMessage: lastMessage[0],
        };
      })
    );

    return conversationsWithDetails;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(conversation).returning();
    return result[0];
  }

  async addUserToConversation(conversationId: string, userId: number): Promise<void> {
    await db.insert(conversationParticipants).values({
      conversationId,
      userId,
    });
  }

  async getMessagesByConversationId(conversationId: string): Promise<any[]> {
    const result = await db
      .select({
        message: messages,
        sender: profiles,
      })
      .from(messages)
      .innerJoin(profiles, eq(messages.senderId, profiles.userId))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return result.map(row => ({
      ...row.message,
      sender: row.sender,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getContactsByUserId(userId: number): Promise<any[]> {
    const result = await db
      .select({
        contact: contacts,
        contactProfile: profiles,
      })
      .from(contacts)
      .innerJoin(profiles, eq(contacts.contactId, profiles.userId))
      .where(eq(contacts.userId, userId));

    return result.map(row => ({
      ...row.contact,
      contactProfile: row.contactProfile,
    }));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(contact).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
