import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Smart Cost Optimization
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }),
  
  // Enhanced AI Features  
  teamSize: integer("team_size"),
  industry: text("industry"),
  experienceLevel: text("experience_level"), // 'junior', 'mid', 'senior', 'expert'
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
  
  // Stack Intelligence
  essentialFor: text("essential_for").array().default(sql`ARRAY[]::text[]`), // Categories this tool is essential for
  
  // Smart Cost Optimization
  pricingTier: text("pricing_tier"), // 'free', 'freemium', 'paid', 'enterprise'
  averageMonthlyCost: decimal("average_monthly_cost", { precision: 10, scale: 2 }),
});

export const userTools = pgTable("user_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  monthlyCost: decimal("monthly_cost", { precision: 10, scale: 2 }).default('0'),
  quantity: integer("quantity").default(1),
  addedAt: timestamp("added_at").defaultNow(),
  
  // Smart Cost Optimization
  usageStatus: text("usage_status").default('active'), // 'active', 'dormant', 'testing'
  lastUsed: timestamp("last_used"),
  
  // Enhanced AI Features
  customNotes: text("custom_notes"),
  priority: integer("priority").default(3), // 1-5 scale for importance
}, (table) => ({
  userToolUnique: unique().on(table.userId, table.toolId),
}));

export const savedIdeas = pgTable("saved_ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  toolsUsed: text("tools_used").array().default(sql`ARRAY[]::text[]`),
  monetization: text("monetization"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Enhanced AI Features
  implementationPlan: jsonb("implementation_plan").default('{}'), // Structured roadmap data
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  estimatedTimeframe: text("estimated_timeframe"),
  difficultyLevel: integer("difficulty_level"), // 1-5 scale
  requiredSkills: text("required_skills").array().default(sql`ARRAY[]::text[]`),
});

// New tables for enhanced features

// Smart Cost Optimization - Cost history tracking
export const costHistory = pgTable("cost_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
  costByCategory: jsonb("cost_by_category").default('{}'), // Store category breakdown
});

// Data Portability - Stack templates
export const stackTemplates = pgTable("stack_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data Portability - Template tools relationship
export const templateTools = pgTable("template_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => stackTemplates.id, { onDelete: "cascade" }),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  recommended: boolean("recommended").default(true),
  customNotes: text("custom_notes"),
  priority: integer("priority").default(3),
}, (table) => ({
  templateToolUnique: unique().on(table.templateId, table.toolId),
}));

// Simple Notifications - User preferences
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  budgetAlerts: boolean("budget_alerts").default(true),
  priceChangeAlerts: boolean("price_change_alerts").default(true),
  newToolAlerts: boolean("new_tool_alerts").default(false),
  stackReviewReminders: boolean("stack_review_reminders").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  preferredCategories: text("preferred_categories").array().default(sql`ARRAY[]::text[]`),
});

// Simple Notifications - Notification storage
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'budget_alert', 'price_change', 'new_tool', 'stack_review'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedToolId: varchar("related_tool_id").references(() => tools.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").default('{}'), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
});

// Stack Intelligence - Tool relationships (normalized)
export const toolRelations = pgTable("tool_relations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  relatedToolId: varchar("related_tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  relationType: text("relation_type").notNull(), // 'alternative', 'compatible', 'conflicts'
}, (table) => ({
  toolRelationUnique: unique().on(table.toolId, table.relatedToolId, table.relationType),
}));

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  userTools: many(userTools),
  savedIdeas: many(savedIdeas),
  costHistory: many(costHistory),
  stackTemplates: many(stackTemplates),
  notifications: many(notifications),
  notificationPreferences: one(userNotificationPreferences),
}));

export const toolsRelations = relations(tools, ({ many }) => ({
  userTools: many(userTools),
  templateTools: many(templateTools),
  toolRelations: many(toolRelations, { relationName: "tool" }),
  relatedToolRelations: many(toolRelations, { relationName: "relatedTool" }),
}));

export const userToolsRelations = relations(userTools, ({ one }) => ({
  user: one(users, { fields: [userTools.userId], references: [users.id] }),
  tool: one(tools, { fields: [userTools.toolId], references: [tools.id] }),
}));

export const savedIdeasRelations = relations(savedIdeas, ({ one }) => ({
  user: one(users, { fields: [savedIdeas.userId], references: [users.id] }),
}));

export const costHistoryRelations = relations(costHistory, ({ one }) => ({
  user: one(users, { fields: [costHistory.userId], references: [users.id] }),
}));

export const stackTemplatesRelations = relations(stackTemplates, ({ one, many }) => ({
  createdBy: one(users, { fields: [stackTemplates.createdById], references: [users.id] }),
  templateTools: many(templateTools),
}));

export const templateToolsRelations = relations(templateTools, ({ one }) => ({
  template: one(stackTemplates, { fields: [templateTools.templateId], references: [stackTemplates.id] }),
  tool: one(tools, { fields: [templateTools.toolId], references: [tools.id] }),
}));

export const userNotificationPreferencesRelations = relations(userNotificationPreferences, ({ one }) => ({
  user: one(users, { fields: [userNotificationPreferences.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  relatedTool: one(tools, { fields: [notifications.relatedToolId], references: [tools.id] }),
}));

export const toolRelationsRelations = relations(toolRelations, ({ one }) => ({
  tool: one(tools, { fields: [toolRelations.toolId], references: [tools.id], relationName: "tool" }),
  relatedTool: one(tools, { fields: [toolRelations.relatedToolId], references: [tools.id], relationName: "relatedTool" }),
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

export const insertCostHistorySchema = createInsertSchema(costHistory).omit({
  id: true,
  recordedAt: true,
});

export const insertStackTemplateSchema = createInsertSchema(stackTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertTemplateToolSchema = createInsertSchema(templateTools).omit({
  id: true,
});

export const insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertToolRelationSchema = createInsertSchema(toolRelations).omit({
  id: true,
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
export type CostHistory = typeof costHistory.$inferSelect;
export type InsertCostHistory = z.infer<typeof insertCostHistorySchema>;
export type StackTemplate = typeof stackTemplates.$inferSelect;
export type InsertStackTemplate = z.infer<typeof insertStackTemplateSchema>;
export type TemplateTools = typeof templateTools.$inferSelect;
export type InsertTemplateTools = z.infer<typeof insertTemplateToolSchema>;
export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = z.infer<typeof insertUserNotificationPreferencesSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ToolRelation = typeof toolRelations.$inferSelect;
export type InsertToolRelation = z.infer<typeof insertToolRelationSchema>;
