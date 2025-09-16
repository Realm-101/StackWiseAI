import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tools = pgTable("tools", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  url: text("url"),
  frameworks: text("frameworks"),
  languages: text("languages"),
  features: text("features"),
  integrations: text("integrations"),
  maturityScore: decimal("maturity_score", { precision: 3, scale: 1 }),
  popularityScore: decimal("popularity_score", { precision: 3, scale: 1 }),
  pricing: text("pricing"),
  notes: text("notes"),
});

export const userTools = pgTable("user_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  monthlyCost: decimal("monthly_cost", { precision: 10, scale: 2 }).default('0'),
  quantity: integer("quantity").default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

export const savedIdeas = pgTable("saved_ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  toolsUsed: text("tools_used").array(),
  monetization: text("monetization"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userTools: many(userTools),
  savedIdeas: many(savedIdeas),
}));

export const toolsRelations = relations(tools, ({ many }) => ({
  userTools: many(userTools),
}));

export const userToolsRelations = relations(userTools, ({ one }) => ({
  user: one(users, { fields: [userTools.userId], references: [users.id] }),
  tool: one(tools, { fields: [userTools.toolId], references: [tools.id] }),
}));

export const savedIdeasRelations = relations(savedIdeas, ({ one }) => ({
  user: one(users, { fields: [savedIdeas.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertToolSchema = createInsertSchema(tools);

export const insertUserToolSchema = createInsertSchema(userTools).omit({
  id: true,
  addedAt: true,
});

export const insertSavedIdeaSchema = createInsertSchema(savedIdeas).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type UserTool = typeof userTools.$inferSelect;
export type InsertUserTool = z.infer<typeof insertUserToolSchema>;
export type SavedIdea = typeof savedIdeas.$inferSelect;
export type InsertSavedIdea = z.infer<typeof insertSavedIdeaSchema>;
