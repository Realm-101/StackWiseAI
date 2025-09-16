import { users, tools, userTools, savedIdeas, type User, type InsertUser, type Tool, type InsertTool, type UserTool, type InsertUserTool, type SavedIdea, type InsertSavedIdea } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session, { type Store } from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tool operations
  getAllTools(): Promise<Tool[]>;
  getToolById(id: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  importTools(tools: InsertTool[]): Promise<void>;
  
  // User tool operations
  getUserTools(userId: string): Promise<(UserTool & { tool: Tool })[]>;
  addUserTool(userTool: InsertUserTool): Promise<UserTool>;
  updateUserTool(id: string, updates: Partial<InsertUserTool>): Promise<UserTool | undefined>;
  removeUserTool(id: string): Promise<void>;
  getUserToolByToolId(userId: string, toolId: string): Promise<UserTool | undefined>;
  
  // Saved ideas operations
  getSavedIdeas(userId: string): Promise<SavedIdea[]>;
  createSavedIdea(idea: InsertSavedIdea): Promise<SavedIdea>;
  deleteSavedIdea(id: string): Promise<void>;
  
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Tool operations
  async getAllTools(): Promise<Tool[]> {
    return await db.select().from(tools);
  }

  async getToolById(id: string): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool;
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const [createdTool] = await db.insert(tools).values(tool).returning();
    return createdTool;
  }

  async importTools(toolsData: InsertTool[]): Promise<void> {
    if (toolsData.length > 0) {
      await db.insert(tools).values(toolsData).onConflictDoNothing();
    }
  }

  // User tool operations
  async getUserTools(userId: string): Promise<(UserTool & { tool: Tool })[]> {
    const result = await db
      .select()
      .from(userTools)
      .innerJoin(tools, eq(userTools.toolId, tools.id))
      .where(eq(userTools.userId, userId));
    
    // Transform the result to match the expected structure
    return result.map((row: any) => ({
      ...row.user_tools,
      tool: row.tools
    }));
  }

  async addUserTool(userTool: InsertUserTool): Promise<UserTool> {
    const [created] = await db.insert(userTools).values(userTool).returning();
    return created;
  }

  async updateUserTool(id: string, updates: Partial<InsertUserTool>): Promise<UserTool | undefined> {
    const [updated] = await db
      .update(userTools)
      .set(updates)
      .where(eq(userTools.id, id))
      .returning();
    return updated;
  }

  async removeUserTool(id: string): Promise<void> {
    await db.delete(userTools).where(eq(userTools.id, id));
  }

  async getUserToolByToolId(userId: string, toolId: string): Promise<UserTool | undefined> {
    const [userTool] = await db
      .select()
      .from(userTools)
      .where(and(eq(userTools.userId, userId), eq(userTools.toolId, toolId)));
    return userTool;
  }

  // Saved ideas operations
  async getSavedIdeas(userId: string): Promise<SavedIdea[]> {
    return await db
      .select()
      .from(savedIdeas)
      .where(eq(savedIdeas.userId, userId))
      .orderBy(savedIdeas.createdAt);
  }

  async createSavedIdea(idea: InsertSavedIdea): Promise<SavedIdea> {
    const [created] = await db.insert(savedIdeas).values(idea).returning();
    return created;
  }

  async deleteSavedIdea(id: string): Promise<void> {
    await db.delete(savedIdeas).where(eq(savedIdeas.id, id));
  }
}

export const storage = new DatabaseStorage();
