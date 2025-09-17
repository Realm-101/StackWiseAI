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
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }),
  preferredCategories: text("preferred_categories").array(),
  nextReviewAt: timestamp("next_review_at"),
  // Onboarding fields
  onboardingStatus: text("onboarding_status").default("pending"), // "pending", "in_progress", "completed", "skipped"
  onboardingStep: integer("onboarding_step").default(0), // Current step in onboarding flow (0-4)
  profileCompleted: boolean("profile_completed").default(false),
  // AI Context fields
  teamSize: text("team_size"), // "solo", "small" (2-5), "medium" (6-20), "large" (21-100), "enterprise" (100+)
  industry: text("industry"), // "fintech", "healthcare", "ecommerce", "saas", "gaming", "education", etc.
  technicalLevel: text("technical_level"), // "beginner", "intermediate", "expert"
  primaryGoals: text("primary_goals").array(), // ["build_mvp", "scale_product", "reduce_costs", "improve_security", etc.]
  companyStage: text("company_stage"), // "idea", "startup", "growth", "mature"
  aiContext: jsonb("ai_context"), // Additional flexible context data
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
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
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
  // Enhanced context fields
  targetAudience: text("target_audience"),
  implementationComplexity: text("implementation_complexity"), // "low", "medium", "high"
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  timeToMarket: text("time_to_market"), // "1-3 months", "3-6 months", "6+ months"
  createdAt: timestamp("created_at").defaultNow(),
});

export const techRoadmaps = pgTable("tech_roadmaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  currentStack: text("current_stack").array().notNull(),
  targetStack: text("target_stack").array().notNull(),
  timeline: jsonb("timeline").notNull(), // Array of phases with tools, duration, cost estimates
  totalDuration: text("total_duration").notNull(), // "3 months", "6 months", etc.
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  complexity: text("complexity").notNull(), // "low", "medium", "high"
  priority: text("priority").notNull(), // "low", "medium", "high", "urgent"
  status: text("status").default("draft"), // "draft", "active", "completed", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const costSnapshots = pgTable("cost_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull().defaultNow(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
});

export const stackTemplates = pgTable("stack_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  toolIds: text("tool_ids").array().notNull(),
  isPublic: boolean("is_public").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Repository analysis tables
export const repositoryAnalyses = pgTable("repository_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repositoryUrl: text("repository_url").notNull(),
  repositoryName: text("repository_name").notNull(),
  repositoryOwner: text("repository_owner").notNull(),
  branch: text("branch").default("main"),
  status: text("status").notNull().default("pending"), // "pending", "analyzing", "completed", "failed"
  analysisResults: jsonb("analysis_results"), // Detected tools and analysis data
  totalDetectedTools: integer("total_detected_tools").default(0),
  estimatedMonthlyCost: decimal("estimated_monthly_cost", { precision: 10, scale: 2 }).default('0'),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).default('0'), // Overall analysis confidence 0-1
  analysisError: text("analysis_error"), // Error message if analysis failed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const repositoryImports = pgTable("repository_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  analysisId: varchar("analysis_id").notNull().references(() => repositoryAnalyses.id, { onDelete: "cascade" }),
  importedTools: jsonb("imported_tools").notNull(), // List of tool IDs and configurations imported
  totalImportedTools: integer("total_imported_tools").default(0),
  importedMonthlyCost: decimal("imported_monthly_cost", { precision: 10, scale: 2 }).default('0'),
  status: text("status").notNull().default("completed"), // "completed", "partial", "failed"
  notes: text("notes"), // Optional user notes about the import
  createdAt: timestamp("created_at").defaultNow(),
});

export const detectedTools = pgTable("detected_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => repositoryAnalyses.id, { onDelete: "cascade" }),
  toolId: varchar("tool_id").references(() => tools.id), // May be null for custom/unknown tools
  detectedName: text("detected_name").notNull(), // Name as detected in repository
  category: text("category").notNull(),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).notNull(), // 0-1 confidence
  detectionMethod: text("detection_method").notNull(), // "package.json", "dockerfile", "config", etc.
  detectionDetails: jsonb("detection_details"), // Additional context about detection
  suggestedTool: varchar("suggested_tool_id").references(() => tools.id), // Suggested replacement/match
  estimatedMonthlyCost: decimal("estimated_monthly_cost", { precision: 10, scale: 2 }).default('0'),
  isImported: boolean("is_imported").default(false), // Whether user imported this tool
  version: text("version"), // Detected version if available
  filePath: text("file_path"), // Where this tool was detected
  createdAt: timestamp("created_at").defaultNow(),
});

// Documentation system tables
export const docCategories = pgTable("doc_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: varchar("parent_id"), // Will be handled in relations section
  level: integer("level").notNull().default(0), // 0 = root level
  icon: text("icon"), // Lucide icon name
  color: text("color"), // Hex color for UI
  isVisible: boolean("is_visible").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const docTags = pgTable("doc_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"), // Hex color for tag display
  isVisible: boolean("is_visible").notNull().default(true),
  usageCount: integer("usage_count").default(0), // Track popularity
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentationArticles = pgTable("documentation_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"), // Short description/summary
  content: text("content").notNull(), // Markdown content
  contentType: text("content_type").notNull().default("guide"), // "guide", "tutorial", "reference", "example", "troubleshooting"
  difficulty: text("difficulty").notNull().default("beginner"), // "beginner", "intermediate", "expert"
  estimatedReadTime: integer("estimated_read_time"), // Minutes
  prerequisites: text("prerequisites").array(), // Required knowledge/tools
  frameworks: text("frameworks").array(), // Related frameworks/tools
  languages: text("languages").array(), // Programming languages covered
  toolCategories: text("tool_categories").array(), // Tool categories this doc relates to
  categoryId: varchar("category_id").notNull().references(() => docCategories.id),
  authorId: varchar("author_id").references(() => users.id), // For user-generated content
  isOfficial: boolean("is_official").notNull().default(true), // Official vs community content
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  viewCount: integer("view_count").default(0),
  searchVector: text("search_vector"), // PostgreSQL tsvector for full-text search
  version: text("version").default("1.0"), // Content versioning
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const docArticleTags = pgTable("doc_article_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => documentationArticles.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => docTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userDocBookmarks = pgTable("user_doc_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: varchar("article_id").notNull().references(() => documentationArticles.id, { onDelete: "cascade" }),
  notes: text("notes"), // Personal notes about this doc
  createdAt: timestamp("created_at").defaultNow(),
});

export const docSearchHistory = pgTable("doc_search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  filters: jsonb("filters"), // Applied filters during search
  resultsCount: integer("results_count").default(0),
  clickedResultId: varchar("clicked_result_id").references(() => documentationArticles.id),
  searchedAt: timestamp("searched_at").defaultNow(),
});

export const docRatings = pgTable("doc_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: varchar("article_id").notNull().references(() => documentationArticles.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 star rating
  review: text("review"), // Optional written review
  isHelpful: boolean("is_helpful"), // Was this doc helpful?
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const docViews = pgTable("doc_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  articleId: varchar("article_id").notNull().references(() => documentationArticles.id, { onDelete: "cascade" }),
  sessionId: text("session_id"), // For anonymous users
  viewedAt: timestamp("viewed_at").defaultNow(),
  readingTime: integer("reading_time"), // Seconds spent reading
  completedReading: boolean("completed_reading").default(false),
});

// Tool Discovery System Tables
export const discoveredTools = pgTable("discovered_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  subCategory: text("sub_category"),
  // External source data
  sourceType: text("source_type").notNull(), // "npm", "pypi", "github", "docker", "aws", etc.
  sourceId: text("source_id").notNull(), // Package name, repo path, service ID
  sourceUrl: text("source_url"),
  repositoryUrl: text("repository_url"),
  documentationUrl: text("documentation_url"),
  homepageUrl: text("homepage_url"),
  // Popularity metrics from various sources
  githubStars: integer("github_stars").default(0),
  githubForks: integer("github_forks").default(0),
  npmWeeklyDownloads: integer("npm_weekly_downloads").default(0),
  dockerPulls: integer("docker_pulls").default(0),
  packageDownloads: integer("package_downloads").default(0), // Generic download count
  // Metadata
  version: text("version"),
  license: text("license"),
  languages: text("languages").array(),
  frameworks: text("frameworks").array(),
  tags: text("tags").array(),
  keywords: text("keywords").array(),
  // Scoring and classification
  popularityScore: decimal("popularity_score", { precision: 5, scale: 2 }).default('0'),
  trendingScore: decimal("trending_score", { precision: 5, scale: 2 }).default('0'),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }).default('0'), // 0-1 quality assessment
  difficultyLevel: text("difficulty_level").default("intermediate"), // "beginner", "intermediate", "expert"
  // Cost and pricing
  pricingModel: text("pricing_model").default("free"), // "free", "freemium", "paid", "enterprise"
  estimatedMonthlyCost: decimal("estimated_monthly_cost", { precision: 10, scale: 2 }).default('0'),
  costCategory: text("cost_category").default("free"), // "free", "low", "medium", "high", "enterprise"
  // Discovery metadata
  discoveredAt: timestamp("discovered_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  lastScanned: timestamp("last_scanned").defaultNow(),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false), // Manual verification status
  verificationNotes: text("verification_notes"),
});

export const toolDiscoverySessions = pgTable("tool_discovery_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionType: text("session_type").notNull(), // "full_scan", "trending_update", "category_scan", "manual_discovery"
  status: text("status").notNull().default("running"), // "running", "completed", "failed", "cancelled"
  sourceTypes: text("source_types").array().notNull(), // APIs scanned in this session
  categories: text("categories").array(), // Categories targeted for discovery
  // Results
  totalToolsDiscovered: integer("total_tools_discovered").default(0),
  newToolsFound: integer("new_tools_found").default(0),
  toolsUpdated: integer("tools_updated").default(0),
  // Timing and performance
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // Milliseconds
  // Error handling
  errorCount: integer("error_count").default(0),
  errorDetails: jsonb("error_details"), // Detailed error information
  // Configuration
  scanConfig: jsonb("scan_config"), // Configuration used for this session
  apiCallsUsed: integer("api_calls_used").default(0), // Track API usage
  rateLimitHits: integer("rate_limit_hits").default(0),
});

export const externalToolData = pgTable("external_tool_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discoveredToolId: varchar("discovered_tool_id").notNull().references(() => discoveredTools.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(), // "npm", "github", "pypi", etc.
  rawData: jsonb("raw_data").notNull(), // Full API response data
  metadata: jsonb("metadata"), // Processed/normalized metadata
  // Caching and freshness
  fetchedAt: timestamp("fetched_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // When this data should be refreshed
  isFresh: boolean("is_fresh").default(true),
  fetchAttempts: integer("fetch_attempts").default(1),
  lastFetchError: text("last_fetch_error"),
});

export const toolPopularityMetrics = pgTable("tool_popularity_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discoveredToolId: varchar("discovered_tool_id").notNull().references(() => discoveredTools.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull().defaultNow(),
  // Aggregated metrics across platforms
  combinedPopularityScore: decimal("combined_popularity_score", { precision: 5, scale: 2 }).notNull(),
  trendingVelocity: decimal("trending_velocity", { precision: 5, scale: 2 }).default('0'), // Rate of popularity change
  // Platform-specific metrics
  githubMetrics: jsonb("github_metrics"), // Stars, forks, issues, PRs, etc.
  packageMetrics: jsonb("package_metrics"), // Downloads, dependents, etc.
  communityMetrics: jsonb("community_metrics"), // Forum mentions, blog posts, etc.
  // Computed scores
  stabilityScore: decimal("stability_score", { precision: 3, scale: 2 }).default('0'), // How stable/reliable
  adoptionScore: decimal("adoption_score", { precision: 3, scale: 2 }).default('0'), // How widely adopted
  innovationScore: decimal("innovation_score", { precision: 3, scale: 2 }).default('0'), // How innovative/cutting-edge
  // Rankings
  categoryRank: integer("category_rank"), // Rank within category
  overallRank: integer("overall_rank"), // Overall rank across all tools
  trendingRank: integer("trending_rank"), // Trending rank
});

export const discoveryCategories = pgTable("discovery_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: varchar("parent_id"), // For hierarchical categories
  level: integer("level").default(0), // Category depth
  // Display properties
  icon: text("icon"), // Lucide icon name
  color: text("color"), // Hex color
  sortOrder: integer("sort_order").default(0),
  isVisible: boolean("is_visible").default(true),
  // Discovery configuration
  sourceTypes: text("source_types").array(), // Which APIs to scan for this category
  keywords: text("keywords").array(), // Keywords for discovery
  excludeKeywords: text("exclude_keywords").array(), // Keywords to exclude
  // Statistics
  toolCount: integer("tool_count").default(0),
  lastScanned: timestamp("last_scanned"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userDiscoveryPreferences = pgTable("user_discovery_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Notification preferences
  enableTrendingAlerts: boolean("enable_trending_alerts").default(true),
  enableNewToolAlerts: boolean("enable_new_tool_alerts").default(false),
  enableWeeklyDigest: boolean("enable_weekly_digest").default(true),
  // Discovery preferences
  preferredCategories: text("preferred_categories").array(),
  excludedCategories: text("excluded_categories").array(),
  preferredLanguages: text("preferred_languages").array(),
  preferredLicenses: text("preferred_licenses").array(),
  maxCostThreshold: decimal("max_cost_threshold", { precision: 10, scale: 2 }),
  minPopularityThreshold: decimal("min_popularity_threshold", { precision: 3, scale: 2 }).default('0'),
  // AI recommendation settings
  enablePersonalizedRecommendations: boolean("enable_personalized_recommendations").default(true),
  recommendationFrequency: text("recommendation_frequency").default("weekly"), // "daily", "weekly", "monthly"
  lastRecommendationAt: timestamp("last_recommendation_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const discoveredToolEvaluations = pgTable("discovered_tool_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  discoveredToolId: varchar("discovered_tool_id").notNull().references(() => discoveredTools.id, { onDelete: "cascade" }),
  // Evaluation data
  rating: integer("rating"), // 1-5 stars
  notes: text("notes"),
  status: text("status").default("evaluating"), // "evaluating", "approved", "rejected", "added_to_stack"
  // Integration assessment
  integrationComplexity: text("integration_complexity"), // "low", "medium", "high"
  estimatedImplementationTime: text("estimated_implementation_time"),
  compatibilityNotes: text("compatibility_notes"),
  // Decision tracking
  decisionReason: text("decision_reason"),
  alternativeTools: text("alternative_tools").array(),
  evaluatedAt: timestamp("evaluated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userTools: many(userTools),
  savedIdeas: many(savedIdeas),
  costSnapshots: many(costSnapshots),
  stackTemplates: many(stackTemplates),
  notifications: many(notifications),
  techRoadmaps: many(techRoadmaps),
  repositoryAnalyses: many(repositoryAnalyses),
  repositoryImports: many(repositoryImports),
  // Documentation relations
  authoredArticles: many(documentationArticles),
  docBookmarks: many(userDocBookmarks),
  docSearchHistory: many(docSearchHistory),
  docRatings: many(docRatings),
  docViews: many(docViews),
  // Discovery relations
  discoveryPreferences: many(userDiscoveryPreferences),
  toolEvaluations: many(discoveredToolEvaluations),
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

export const costSnapshotsRelations = relations(costSnapshots, ({ one }) => ({
  user: one(users, { fields: [costSnapshots.userId], references: [users.id] }),
}));

export const stackTemplatesRelations = relations(stackTemplates, ({ one }) => ({
  user: one(users, { fields: [stackTemplates.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const techRoadmapsRelations = relations(techRoadmaps, ({ one }) => ({
  user: one(users, { fields: [techRoadmaps.userId], references: [users.id] }),
}));

export const repositoryAnalysesRelations = relations(repositoryAnalyses, ({ one, many }) => ({
  user: one(users, { fields: [repositoryAnalyses.userId], references: [users.id] }),
  detectedTools: many(detectedTools),
  imports: many(repositoryImports),
}));

export const repositoryImportsRelations = relations(repositoryImports, ({ one }) => ({
  user: one(users, { fields: [repositoryImports.userId], references: [users.id] }),
  analysis: one(repositoryAnalyses, { fields: [repositoryImports.analysisId], references: [repositoryAnalyses.id] }),
}));

export const detectedToolsRelations = relations(detectedTools, ({ one }) => ({
  analysis: one(repositoryAnalyses, { fields: [detectedTools.analysisId], references: [repositoryAnalyses.id] }),
  tool: one(tools, { fields: [detectedTools.toolId], references: [tools.id] }),
  suggestedToolRef: one(tools, { fields: [detectedTools.suggestedTool], references: [tools.id] }),
}));

// Discovery relations
export const discoveredToolsRelations = relations(discoveredTools, ({ many }) => ({
  externalData: many(externalToolData),
  popularityMetrics: many(toolPopularityMetrics),
  evaluations: many(discoveredToolEvaluations),
}));

export const toolDiscoverySessionsRelations = relations(toolDiscoverySessions, ({ many }) => ({
  // Add any necessary relations for discovery sessions
}));

export const externalToolDataRelations = relations(externalToolData, ({ one }) => ({
  discoveredTool: one(discoveredTools, { fields: [externalToolData.discoveredToolId], references: [discoveredTools.id] }),
}));

export const toolPopularityMetricsRelations = relations(toolPopularityMetrics, ({ one }) => ({
  discoveredTool: one(discoveredTools, { fields: [toolPopularityMetrics.discoveredToolId], references: [discoveredTools.id] }),
}));

export const discoveryCategoriesRelations = relations(discoveryCategories, ({ one, many }) => ({
  parent: one(discoveryCategories, { fields: [discoveryCategories.parentId], references: [discoveryCategories.id], relationName: "parent_discovery_category" }),
  children: many(discoveryCategories, { relationName: "parent_discovery_category" }),
}));

export const userDiscoveryPreferencesRelations = relations(userDiscoveryPreferences, ({ one }) => ({
  user: one(users, { fields: [userDiscoveryPreferences.userId], references: [users.id] }),
}));

export const discoveredToolEvaluationsRelations = relations(discoveredToolEvaluations, ({ one }) => ({
  user: one(users, { fields: [discoveredToolEvaluations.userId], references: [users.id] }),
  discoveredTool: one(discoveredTools, { fields: [discoveredToolEvaluations.discoveredToolId], references: [discoveredTools.id] }),
}));

// Documentation relations
export const docCategoriesRelations = relations(docCategories, ({ one, many }) => ({
  parent: one(docCategories, { fields: [docCategories.parentId], references: [docCategories.id], relationName: "parent_category" }),
  children: many(docCategories, { relationName: "parent_category" }),
  articles: many(documentationArticles),
}));

export const docTagsRelations = relations(docTags, ({ many }) => ({
  articleTags: many(docArticleTags),
}));

export const documentationArticlesRelations = relations(documentationArticles, ({ one, many }) => ({
  category: one(docCategories, { fields: [documentationArticles.categoryId], references: [docCategories.id] }),
  author: one(users, { fields: [documentationArticles.authorId], references: [users.id] }),
  tags: many(docArticleTags),
  bookmarks: many(userDocBookmarks),
  ratings: many(docRatings),
  views: many(docViews),
}));

export const docArticleTagsRelations = relations(docArticleTags, ({ one }) => ({
  article: one(documentationArticles, { fields: [docArticleTags.articleId], references: [documentationArticles.id] }),
  tag: one(docTags, { fields: [docArticleTags.tagId], references: [docTags.id] }),
}));

export const userDocBookmarksRelations = relations(userDocBookmarks, ({ one }) => ({
  user: one(users, { fields: [userDocBookmarks.userId], references: [users.id] }),
  article: one(documentationArticles, { fields: [userDocBookmarks.articleId], references: [documentationArticles.id] }),
}));

export const docSearchHistoryRelations = relations(docSearchHistory, ({ one }) => ({
  user: one(users, { fields: [docSearchHistory.userId], references: [users.id] }),
  clickedResult: one(documentationArticles, { fields: [docSearchHistory.clickedResultId], references: [documentationArticles.id] }),
}));

export const docRatingsRelations = relations(docRatings, ({ one }) => ({
  user: one(users, { fields: [docRatings.userId], references: [users.id] }),
  article: one(documentationArticles, { fields: [docRatings.articleId], references: [documentationArticles.id] }),
}));

export const docViewsRelations = relations(docViews, ({ one }) => ({
  user: one(users, { fields: [docViews.userId], references: [users.id] }),
  article: one(documentationArticles, { fields: [docViews.articleId], references: [documentationArticles.id] }),
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

// Restricted schema for user-tool updates - only allows safe fields
export const updateUserToolSchema = insertUserToolSchema.pick({
  monthlyCost: true,
  quantity: true,
  isActive: true,
});

export const insertSavedIdeaSchema = createInsertSchema(savedIdeas).omit({
  id: true,
  createdAt: true,
});

export const insertCostSnapshotSchema = createInsertSchema(costSnapshots).omit({
  id: true,
  date: true,
});

export const insertStackTemplateSchema = createInsertSchema(stackTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertTechRoadmapSchema = createInsertSchema(techRoadmaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Repository analysis insert schemas
export const insertRepositoryAnalysisSchema = createInsertSchema(repositoryAnalyses).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertRepositoryImportSchema = createInsertSchema(repositoryImports).omit({
  id: true,
  createdAt: true,
});

export const insertDetectedToolSchema = createInsertSchema(detectedTools).omit({
  id: true,
  createdAt: true,
});

// Documentation insert schemas
export const insertDocCategorySchema = createInsertSchema(docCategories).omit({
  id: true,
  createdAt: true,
});

export const insertDocTagSchema = createInsertSchema(docTags).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentationArticleSchema = createInsertSchema(documentationArticles).omit({
  id: true,
  viewCount: true,
  searchVector: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocArticleTagSchema = createInsertSchema(docArticleTags).omit({
  id: true,
  createdAt: true,
});

export const insertUserDocBookmarkSchema = createInsertSchema(userDocBookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertDocSearchHistorySchema = createInsertSchema(docSearchHistory).omit({
  id: true,
  searchedAt: true,
});

export const insertDocRatingSchema = createInsertSchema(docRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocViewSchema = createInsertSchema(docViews).omit({
  id: true,
  viewedAt: true,
});

// Enhanced schemas for user context
export const userContextUpdateSchema = z.object({
  teamSize: z.enum(["solo", "small", "medium", "large", "enterprise"]).optional(),
  industry: z.string().optional(),
  technicalLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
  primaryGoals: z.array(z.string()).optional(),
  companyStage: z.enum(["idea", "startup", "growth", "mature"]).optional(),
  aiContext: z.any().optional(),
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
export type CostSnapshot = typeof costSnapshots.$inferSelect;
export type InsertCostSnapshot = z.infer<typeof insertCostSnapshotSchema>;
export type StackTemplate = typeof stackTemplates.$inferSelect;
export type InsertStackTemplate = z.infer<typeof insertStackTemplateSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type TechRoadmap = typeof techRoadmaps.$inferSelect;
export type InsertTechRoadmap = z.infer<typeof insertTechRoadmapSchema>;
export type UserContextUpdate = z.infer<typeof userContextUpdateSchema>;

// Documentation types
export type DocCategory = typeof docCategories.$inferSelect;
export type InsertDocCategory = z.infer<typeof insertDocCategorySchema>;

export type DocTag = typeof docTags.$inferSelect;
export type InsertDocTag = z.infer<typeof insertDocTagSchema>;

export type DocumentationArticle = typeof documentationArticles.$inferSelect;
export type InsertDocumentationArticle = z.infer<typeof insertDocumentationArticleSchema>;

export type DocArticleTag = typeof docArticleTags.$inferSelect;
export type InsertDocArticleTag = z.infer<typeof insertDocArticleTagSchema>;

export type UserDocBookmark = typeof userDocBookmarks.$inferSelect;
export type InsertUserDocBookmark = z.infer<typeof insertUserDocBookmarkSchema>;

export type DocSearchHistory = typeof docSearchHistory.$inferSelect;
export type InsertDocSearchHistory = z.infer<typeof insertDocSearchHistorySchema>;

export type DocRating = typeof docRatings.$inferSelect;
export type InsertDocRating = z.infer<typeof insertDocRatingSchema>;

export type DocView = typeof docViews.$inferSelect;
export type InsertDocView = z.infer<typeof insertDocViewSchema>;

// Redesigned severity system - more conservative about what's "critical"
export type OptimizationSeverity = 'critical' | 'optimization' | 'suggestion' | 'note';
export type RecommendationImportance = 'essential' | 'beneficial' | 'optional';

// Extended types for API responses
export interface UserToolWithTool {
  id: string;
  userId: string;
  toolId: string;
  monthlyCost: string;
  quantity: number;
  addedAt: string;
  isActive: boolean;
  lastUsedAt: string | null;
  tool: {
    id: string;
    name: string;
    description?: string;
    category: string;
    popularityScore?: string;
    maturityScore?: string;
    pricing?: string;
  };
}

export interface UserBudgetResponse {
  monthlyBudget: string | null;
}

export interface BudgetStatusResponse {
  currentSpend: number;
  monthlyBudget: number | null;
  percentage: number;
  status: 'no_budget' | 'good' | 'warning' | 'exceeded';
  isOverBudget: boolean;
}

export interface CostTrendPoint {
  date: string;
  totalCost: number;
}

export interface CostTrendsResponse {
  data: CostTrendPoint[];
  summary: {
    currentCost: number;
    previousCost: number;
    changeAmount: number;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
    averageCost: number;
    highestCost: number;
    lowestCost: number;
    totalDays: number;
  };
}

// Stack Intelligence Analysis Types
export interface StackRedundancy {
  category: string;
  tools: UserToolWithTool[];
  severity: OptimizationSeverity;
  potentialSavings: number;
  recommendation: string;
  reason: string; // Explanation of why this is flagged
}

export interface StackRedundanciesResponse {
  redundancies: StackRedundancy[];
  totalPotentialSavings: number;
}

export interface MissingStackPiece {
  category: string;
  importance: RecommendationImportance;
  reason: string;
  suggestedTools: Tool[];
  benefits: string; // What user gains by adding this
}

export interface MissingStackPiecesResponse {
  missing: MissingStackPiece[];
  essentialCategories: string[];
  stackCompleteness: number;
}

export interface CompatibilityIssue {
  type: 'security_risk' | 'compatibility_conflict' | 'deprecation_notice' | 'integration_opportunity';
  toolIds: string[];
  toolNames: string[];
  severity: OptimizationSeverity;
  description: string;
  recommendation: string;
  impact: string; // What happens if not addressed
}

export interface CompatibilityIssuesResponse {
  issues: CompatibilityIssue[];
  riskScore: number;
}

export interface StackRecommendation {
  type: 'add_tool' | 'remove_tool' | 'replace_tool' | 'optimize_cost';
  priority: OptimizationSeverity;
  category: string;
  title: string; // User-friendly title
  description: string;
  suggestedTools?: Tool[];
  potentialSavings?: number;
  reasoning: string;
  benefits?: string; // What user gains
}

export interface StackAnalysisResponse {
  recommendations: StackRecommendation[];
  stackHealthScore: number;
  optimizationScore: number; // New metric focusing on efficiency
}

// AI Enhancement Types
export interface UserAIContext {
  teamSize?: "solo" | "small" | "medium" | "large" | "enterprise";
  industry?: string;
  technicalLevel?: "beginner" | "intermediate" | "expert";
  primaryGoals?: string[];
  companyStage?: "idea" | "startup" | "growth" | "mature";
  monthlyBudget?: number;
  aiContext?: any;
}

export interface EnhancedBusinessIdea {
  title: string;
  description: string;
  monetization: string;
  tags: string[];
  targetAudience?: string;
  implementationComplexity: "low" | "medium" | "high";
  estimatedCost?: number;
  timeToMarket: string;
  budgetFriendly: boolean;
  teamSuitability: string;
  industryFit: number; // 1-10 score
}

export interface TechRoadmapPhase {
  phase: number;
  title: string;
  description: string;
  tools: string[];
  duration: string;
  cost: number;
  prerequisites: string[];
  deliverables: string[];
  risks: string[];
  learningResources: string[];
}

export interface GeneratedTechRoadmap {
  title: string;
  description: string;
  currentStack: string[];
  targetStack: string[];
  timeline: TechRoadmapPhase[];
  totalDuration: string;
  estimatedCost: number;
  complexity: "low" | "medium" | "high";
  priority: "low" | "medium" | "high" | "urgent";
  budgetImpact: {
    immediate: number;
    monthly: number;
    savings: number;
  };
  prerequisites: string[];
  riskAssessment: {
    technical: string;
    budget: string;
    timeline: string;
    team: string;
  };
}

export interface ContextualRecommendation {
  type: "tool" | "process" | "architecture" | "security";
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  description: string;
  reasoning: string;
  suggestedTools?: Tool[];
  budgetImpact?: number;
  implementationEffort: "low" | "medium" | "high";
  teamSuitability: number; // 1-10 score
  industryRelevance: number; // 1-10 score
  timeToValue: string;
  dependencies: string[];
  alternatives: string[];
}

// AI Endpoint Validation Schemas
export const generateIdeasSchema = z.object({
  selectedTools: z.array(z.string()).min(1, "Please select at least one tool"),
  goals: z.string().optional(),
});

export const enhancedIdeasSchema = z.object({
  selectedTools: z.array(z.string()).min(1, "Please select at least one tool"),
  goals: z.string().optional(),
});

export const generateRoadmapSchema = z.object({
  currentStack: z.array(z.string()).min(1, "Please provide current stack information"),
  targetGoals: z.array(z.string()).min(1, "Please provide target goals"),
  timeframe: z.string().optional(),
});

export const budgetRecommendationsQuerySchema = z.object({
  maxBudget: z.string().optional().refine(
    val => val === undefined || (!isNaN(Number(val)) && Number(val) >= 0),
    "Invalid budget amount"
  ),
});

export const dormantToolsQuerySchema = z.object({
  days: z.string().optional().refine(
    val => val === undefined || (!isNaN(Number(val)) && Number(val) > 0),
    "Days must be a positive number"
  ),
});

export const costTrendsQuerySchema = z.object({
  days: z.string().optional().refine(
    val => val === undefined || (!isNaN(Number(val)) && Number(val) > 0),
    "Days must be a positive number"
  ),
  limit: z.string().optional().refine(
    val => val === undefined || (!isNaN(Number(val)) && Number(val) > 0),
    "Limit must be a positive number"
  ),
});

export const updateUserBudgetSchema = z.object({
  monthlyBudget: z.union([
    z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Invalid budget amount"),
    z.null()
  ]),
});

// Route parameter validation
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// Input sanitization schema for security
export const sanitizeStringSchema = z.string().max(10000, "Input too long").trim();

// Onboarding schemas
export const onboardingProfileSchema = z.object({
  teamSize: z.enum(["solo", "small", "medium", "large", "enterprise"]).optional(),
  industry: z.string().optional(),
  technicalLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
  primaryGoals: z.array(z.string()).optional(),
  companyStage: z.enum(["idea", "startup", "growth", "mature"]).optional(),
  monthlyBudget: z.union([
    z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Invalid budget amount"),
    z.null()
  ]).optional(),
  projectType: z.enum(["saas", "ecommerce", "api", "mobile_app", "website", "other"]).optional(),
  preferredApproach: z.enum(["cutting_edge", "proven_stable", "budget_conscious"]).optional(),
});

export const onboardingStatusUpdateSchema = z.object({
  onboardingStatus: z.enum(["pending", "in_progress", "completed", "skipped"]),
  onboardingStep: z.number().min(0).max(4),
  profileCompleted: z.boolean().optional(),
});

export const stackTemplateSelectionSchema = z.object({
  templateId: z.string().uuid("Invalid template ID"),
  toolIds: z.array(z.string()).optional(),
});

// Onboarding types
export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;
export type OnboardingStatusUpdate = z.infer<typeof onboardingStatusUpdateSchema>;
export type StackTemplateSelection = z.infer<typeof stackTemplateSelectionSchema>;

export interface OnboardingStackTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tools: Tool[];
  estimatedCost: number;
  complexity: "low" | "medium" | "high";
  bestFor: string[];
  tags: string[];
}

export interface OnboardingStatus {
  status: "pending" | "in_progress" | "completed" | "skipped";
  step: number;
  profileCompleted: boolean;
  completedSteps: string[];
}

export interface OnboardingData {
  user: User;
  status: OnboardingStatus;
  availableTemplates: OnboardingStackTemplate[];
  recommendedTools: Tool[];
}

// Project task tables
export const projectTasks = pgTable("project_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ideaId: varchar("idea_id").references(() => savedIdeas.id, { onDelete: "cascade" }),
  generationId: varchar("generation_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "setup", "frontend", "backend", "database", "auth", "testing", "docs", "devops", "integration"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "blocked", "cancelled"
  estimatedHours: decimal("estimated_hours", { precision: 6, scale: 2 }),
  estimatedDays: decimal("estimated_days", { precision: 4, scale: 1 }),
  actualHours: decimal("actual_hours", { precision: 6, scale: 2 }),
  complexity: text("complexity").notNull(), // "low", "medium", "high"
  technicalRequirements: text("technical_requirements").array(),
  acceptanceCriteria: text("acceptance_criteria").array(),
  suggestedTools: text("suggested_tools").array(), // Tool IDs from user's stack
  requiredTools: text("required_tools").array(), // Tool IDs that must be added
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 2 }),
  resourceRequirements: jsonb("resource_requirements"), // Team members, skills, etc.
  notes: text("notes"),
  assigneeId: varchar("assignee_id").references(() => users.id), // For team assignments
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskGenerations = pgTable("task_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ideaId: varchar("idea_id").notNull().references(() => savedIdeas.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // "pending", "generating", "completed", "failed"
  aiModel: text("ai_model").notNull().default("gemini-2.5-flash"),
  generationParameters: jsonb("generation_parameters"), // User context, preferences, constraints
  totalTasks: integer("total_tasks").default(0),
  estimatedProjectDuration: text("estimated_project_duration"),
  estimatedTotalCost: decimal("estimated_total_cost", { precision: 10, scale: 2 }),
  projectComplexity: text("project_complexity"), // "low", "medium", "high"
  keyMilestones: text("key_milestones").array(),
  criticalPath: text("critical_path").array(), // Task IDs forming critical path
  riskAssessment: jsonb("risk_assessment"),
  recommendedTimeline: jsonb("recommended_timeline"),
  stackAnalysis: jsonb("stack_analysis"), // How user's stack aligns with tasks
  generationMetadata: jsonb("generation_metadata"), // AI reasoning, confidence scores
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const taskDependencies = pgTable("task_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => projectTasks.id, { onDelete: "cascade" }),
  dependsOnTaskId: varchar("depends_on_task_id").notNull().references(() => projectTasks.id, { onDelete: "cascade" }),
  dependencyType: text("dependency_type").notNull().default("finish_to_start"), // "finish_to_start", "start_to_start", "finish_to_finish", "start_to_finish"
  isOptional: boolean("is_optional").default(false),
  lagTime: integer("lag_time").default(0), // Days lag between tasks
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskCategories = pgTable("task_categories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"), // Hex color for UI display
  icon: text("icon"), // Icon name for UI display
  defaultPriority: text("default_priority").default("medium"),
  averageComplexity: text("average_complexity").default("medium"),
  typicalDuration: text("typical_duration"), // "hours", "days", "weeks"
  skillsRequired: text("skills_required").array(),
  toolCategories: text("tool_categories").array(), // Categories of tools typically needed
});

// Enhanced Project Planning Tables
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ideaId: varchar("idea_id").references(() => savedIdeas.id, { onDelete: "set null" }),
  templateId: varchar("template_id").references(() => projectTemplates.id, { onDelete: "set null" }),
  generationId: varchar("generation_id").references(() => taskGenerations.id, { onDelete: "set null" }),
  // Basic project information
  name: text("name").notNull(),
  description: text("description").notNull(),
  projectType: text("project_type").notNull(), // "saas", "ecommerce", "mobile_app", "api", "website", "ai_ml", "other"
  status: text("status").notNull().default("planning"), // "planning", "in_progress", "on_hold", "completed", "cancelled"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
  // Timeline and scheduling
  startDate: timestamp("start_date"),
  targetEndDate: timestamp("target_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  lastActivityAt: timestamp("last_activity_at"),
  // Progress tracking
  overallProgress: decimal("overall_progress", { precision: 5, scale: 2 }).default('0'), // 0-100%
  tasksCompleted: integer("tasks_completed").default(0),
  totalTasks: integer("total_tasks").default(0),
  milestonesCompleted: integer("milestones_completed").default(0),
  totalMilestones: integer("total_milestones").default(0),
  // Budget and resources
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }),
  spentBudget: decimal("spent_budget", { precision: 12, scale: 2 }).default('0'),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).default('0'),
  currency: text("currency").default("USD"),
  // Team and collaboration
  teamSize: integer("team_size").default(1),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  collaboratorIds: text("collaborator_ids").array().default([]), // User IDs with project access
  // Project metadata
  tags: text("tags").array().default([]),
  category: text("category"), // "development", "marketing", "research", "operations"
  complexity: text("complexity").default("medium"), // "low", "medium", "high", "expert"
  riskLevel: text("risk_level").default("medium"), // "low", "medium", "high", "critical"
  // Technical specifications
  techStack: text("tech_stack").array().default([]), // Tool IDs from tools table
  requiredSkills: text("required_skills").array().default([]),
  platforms: text("platforms").array().default([]), // "web", "mobile", "desktop", "cloud"
  // Analytics and reporting
  lastMetricsUpdate: timestamp("last_metrics_update"),
  healthScore: decimal("health_score", { precision: 3, scale: 2 }).default('100'), // 0-100 project health
  scheduleVariance: decimal("schedule_variance", { precision: 5, scale: 2 }).default('0'), // Days ahead/behind
  costVariance: decimal("cost_variance", { precision: 5, scale: 2 }).default('0'), // % over/under budget
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }).default('0'), // Quality metrics
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectPhases = pgTable("project_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  phaseType: text("phase_type").notNull(), // "setup", "design", "development", "testing", "deployment", "maintenance"
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "blocked", "cancelled"
  orderIndex: integer("order_index").notNull(),
  // Timeline
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  plannedDuration: integer("planned_duration"), // Days
  actualDuration: integer("actual_duration"), // Days
  // Progress and completion
  progress: decimal("progress", { precision: 5, scale: 2 }).default('0'), // 0-100%
  completedTasks: integer("completed_tasks").default(0),
  totalTasks: integer("total_tasks").default(0),
  // Budget allocation
  budgetAllocated: decimal("budget_allocated", { precision: 10, scale: 2 }),
  budgetUsed: decimal("budget_used", { precision: 10, scale: 2 }).default('0'),
  // Dependencies and requirements
  dependencies: text("dependencies").array().default([]), // Phase IDs this depends on
  deliverables: text("deliverables").array().default([]),
  acceptanceCriteria: text("acceptance_criteria").array().default([]),
  // Team assignment
  leadId: varchar("lead_id").references(() => users.id),
  assignedTeamIds: text("assigned_team_ids").array().default([]), // User IDs
  // Metadata
  color: text("color"), // Phase color for visualization
  icon: text("icon"), // Icon for phase display
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectMilestones = pgTable("project_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  phaseId: varchar("phase_id").references(() => projectPhases.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  milestoneType: text("milestone_type").notNull(), // "major", "minor", "checkpoint", "deliverable", "review"
  status: text("status").notNull().default("pending"), // "pending", "achieved", "missed", "cancelled"
  importance: text("importance").notNull().default("medium"), // "low", "medium", "high", "critical"
  // Timeline
  targetDate: timestamp("target_date").notNull(),
  actualDate: timestamp("actual_date"),
  reminderDate: timestamp("reminder_date"),
  // Completion criteria
  completionCriteria: text("completion_criteria").array().default([]),
  acceptanceRequirements: text("acceptance_requirements").array().default([]),
  measurableOutcome: text("measurable_outcome"),
  // Dependencies
  dependentTaskIds: text("dependent_task_ids").array().default([]), // ProjectTask IDs
  blockerTaskIds: text("blocker_task_ids").array().default([]), // Tasks that must complete first
  // Stakeholders and communication
  stakeholderIds: text("stakeholder_ids").array().default([]), // User IDs to notify
  reviewerIds: text("reviewer_ids").array().default([]), // Users who must approve
  notificationSent: boolean("notification_sent").default(false),
  // Progress tracking
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default('0'),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
  effort: decimal("effort", { precision: 6, scale: 2 }), // Hours invested
  businessValue: decimal("business_value", { precision: 3, scale: 2 }), // 1-10 scale
  // Metadata
  tags: text("tags").array().default([]),
  attachments: jsonb("attachments"), // File references
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectResources = pgTable("project_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  resourceType: text("resource_type").notNull(), // "team_member", "contractor", "tool", "equipment", "budget"
  resourceId: varchar("resource_id"), // References users.id, tools.id, or external ID
  resourceName: text("resource_name").notNull(),
  // Allocation details
  roleInProject: text("role_in_project"), // "project_manager", "developer", "designer", "qa", "devops"
  allocationPercentage: decimal("allocation_percentage", { precision: 5, scale: 2 }).default('100'), // % of time
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  totalHoursAllocated: decimal("total_hours_allocated", { precision: 8, scale: 2 }),
  hoursUsed: decimal("hours_used", { precision: 8, scale: 2 }).default('0'),
  // Timeline
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  // Cost tracking
  budgetAllocated: decimal("budget_allocated", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }).default('0'),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  // Skills and requirements
  skillsProvided: text("skills_provided").array().default([]),
  experienceLevel: text("experience_level"), // "junior", "mid", "senior", "expert"
  certifications: text("certifications").array().default([]),
  // Performance tracking
  utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }).default('0'), // % of allocated time used
  productivityScore: decimal("productivity_score", { precision: 3, scale: 2 }), // 1-10 rating
  qualityRating: decimal("quality_rating", { precision: 3, scale: 2 }), // 1-10 rating
  // Status and availability
  status: text("status").notNull().default("allocated"), // "allocated", "active", "completed", "released", "unavailable"
  isActive: boolean("is_active").default(true),
  isExternal: boolean("is_external").default(false),
  // Notes and metadata
  notes: text("notes"),
  contactInfo: jsonb("contact_info"), // External contractor contact details
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectBudgets = pgTable("project_budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  budgetCategory: text("budget_category").notNull(), // "development", "infrastructure", "marketing", "tools", "personnel", "operations", "contingency"
  budgetName: text("budget_name").notNull(),
  description: text("description"),
  // Budget allocation
  allocatedAmount: decimal("allocated_amount", { precision: 12, scale: 2 }).notNull(),
  spentAmount: decimal("spent_amount", { precision: 12, scale: 2 }).default('0'),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  reservedAmount: decimal("reserved_amount", { precision: 12, scale: 2 }).default('0'),
  // Cost breakdown
  costType: text("cost_type").notNull(), // "fixed", "variable", "one_time", "recurring"
  recurringFrequency: text("recurring_frequency"), // "monthly", "quarterly", "yearly" - for recurring costs
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  estimatedUnits: integer("estimated_units"),
  actualUnits: integer("actual_units").default(0),
  // Timeline
  budgetPeriodStart: timestamp("budget_period_start"),
  budgetPeriodEnd: timestamp("budget_period_end"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  // Tracking and alerts
  spendingRate: decimal("spending_rate", { precision: 10, scale: 2 }).default('0'), // Amount per day/week
  burnRate: decimal("burn_rate", { precision: 5, scale: 2 }).default('0'), // % burned per time period
  forecastedCompletion: timestamp("forecasted_completion"),
  variancePercentage: decimal("variance_percentage", { precision: 5, scale: 2 }).default('0'), // % over/under budget
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }).default('80'), // % spent before alert
  alertsSent: integer("alerts_sent").default(0),
  // Approval and governance
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  requiresApproval: boolean("requires_approval").default(false),
  isApproved: boolean("is_approved").default(true),
  // Metadata
  currency: text("currency").default("USD"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default('1'),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectTimelines = pgTable("project_timelines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => projectTasks.id, { onDelete: "cascade" }),
  phaseId: varchar("phase_id").references(() => projectPhases.id, { onDelete: "cascade" }),
  milestoneId: varchar("milestone_id").references(() => projectMilestones.id, { onDelete: "cascade" }),
  timelineType: text("timeline_type").notNull(), // "task", "phase", "milestone", "project"
  // Schedule information
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  baselineDuration: integer("baseline_duration"), // Original planned duration in days
  currentDuration: integer("current_duration"), // Current planned duration in days
  actualDuration: integer("actual_duration"), // Actual time taken in days
  // Progress and completion
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default('0'),
  isCompleted: boolean("is_completed").default(false),
  isCriticalPath: boolean("is_critical_path").default(false),
  hasBufferTime: boolean("has_buffer_time").default(false),
  bufferDays: integer("buffer_days").default(0),
  // Schedule variance
  scheduleVarianceDays: integer("schedule_variance_days").default(0), // Positive = ahead, negative = behind
  schedulePerformanceIndex: decimal("schedule_performance_index", { precision: 5, scale: 2 }).default('1'), // SPI
  earnedValueDays: decimal("earned_value_days", { precision: 8, scale: 2 }).default('0'),
  // Dependencies and constraints
  predecessorIds: text("predecessor_ids").array().default([]), // Timeline IDs this depends on
  successorIds: text("successor_ids").array().default([]), // Timeline IDs that depend on this
  constraintType: text("constraint_type"), // "start_no_earlier_than", "finish_no_later_than", "must_start_on", "must_finish_on"
  constraintDate: timestamp("constraint_date"),
  lagTime: integer("lag_time").default(0), // Days of lag from predecessors
  leadTime: integer("lead_time").default(0), // Days of lead before successors can start
  // Resource scheduling
  resourceIds: text("resource_ids").array().default([]), // ProjectResource IDs
  workingDays: text("working_days").array().default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
  hoursPerDay: decimal("hours_per_day", { precision: 4, scale: 2 }).default('8'),
  totalPlannedHours: decimal("total_planned_hours", { precision: 8, scale: 2 }).default('0'),
  totalActualHours: decimal("total_actual_hours", { precision: 8, scale: 2 }).default('0'),
  // Timeline metadata
  priority: text("priority").default("medium"), // "low", "medium", "high", "critical"
  riskLevel: text("risk_level").default("medium"), // "low", "medium", "high", "critical"
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }).default('80'), // % confidence in timeline
  lastRecalculated: timestamp("last_recalculated").defaultNow(),
  // Gantt chart visualization
  ganttPosition: integer("gantt_position"), // Y-axis position in Gantt chart
  ganttLevel: integer("gantt_level").default(0), // Indentation level for hierarchy
  ganttColor: text("gantt_color"), // Color for Gantt bar visualization
  isExpanded: boolean("is_expanded").default(true), // For collapsible groups
  // Notes and tracking
  notes: text("notes"),
  baselineNotes: text("baseline_notes"), // Notes about original planning
  changeLog: jsonb("change_log"), // History of timeline changes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectTemplates = pgTable("project_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "saas", "ecommerce", "mobile_app", "api", "website", "ai_ml"
  templateType: text("template_type").notNull(), // "official", "community", "custom"
  // Template metadata
  version: text("version").default("1.0"),
  isPublic: boolean("is_public").default(false),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default('0'),
  totalRatings: integer("total_ratings").default(0),
  // Project characteristics
  targetAudience: text("target_audience").array().default([]), // "startup", "enterprise", "individual", "team"
  complexity: text("complexity").default("medium"), // "beginner", "intermediate", "expert"
  estimatedDuration: text("estimated_duration"), // "1-3 months", "3-6 months", etc.
  teamSizeRange: text("team_size_range"), // "1-2", "3-5", "6-10", "10+"
  budgetRange: text("budget_range"), // "< $1K", "$1K-$10K", "$10K-$100K", "$100K+"
  // Technical requirements
  techStack: text("tech_stack").array().default([]), // Recommended tool IDs
  requiredSkills: text("required_skills").array().default([]),
  optionalSkills: text("optional_skills").array().default([]),
  platforms: text("platforms").array().default([]), // "web", "mobile", "desktop", "cloud"
  // Template structure
  phases: jsonb("phases").notNull(), // Array of phase definitions
  milestones: jsonb("milestones").notNull(), // Array of milestone definitions  
  defaultTasks: jsonb("default_tasks").notNull(), // Array of task templates
  dependencies: jsonb("dependencies").notNull(), // Task dependency definitions
  // Resource templates
  roleTemplates: jsonb("role_templates").default([]), // Default team roles and responsibilities
  budgetTemplates: jsonb("budget_templates").default([]), // Budget category templates
  timelineTemplate: jsonb("timeline_template"), // Default timeline structure
  // Customization options
  customizableFields: text("customizable_fields").array().default([]),
  variationOptions: jsonb("variation_options"), // Different template variations
  industryAdaptations: jsonb("industry_adaptations"), // Industry-specific modifications
  // Documentation and guidance
  documentation: text("documentation"), // Markdown documentation
  gettingStartedGuide: text("getting_started_guide"),
  bestPractices: text("best_practices").array().default([]),
  commonPitfalls: text("common_pitfalls").array().default([]),
  successCriteria: text("success_criteria").array().default([]),
  // SEO and discoverability
  tags: text("tags").array().default([]),
  keywords: text("keywords").array().default([]),
  icon: text("icon"), // Icon for template display
  color: text("color"), // Color theme for template
  thumbnailUrl: text("thumbnail_url"), // Preview image
  // Analytics and feedback
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default('0'), // % of successful projects
  averageCompletionTime: integer("average_completion_time"), // Days
  userFeedback: jsonb("user_feedback"), // Aggregated user feedback
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const projectAnalytics = pgTable("project_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recordDate: timestamp("record_date").notNull().defaultNow(),
  // Schedule performance metrics
  scheduledTasksCompleted: integer("scheduled_tasks_completed").default(0),
  tasksCompletedOnTime: integer("tasks_completed_on_time").default(0),
  tasksCompletedLate: integer("tasks_completed_late").default(0),
  averageTaskCompletionTime: decimal("average_task_completion_time", { precision: 8, scale: 2 }).default('0'), // Hours
  schedulePerformanceIndex: decimal("schedule_performance_index", { precision: 5, scale: 2 }).default('1'),
  // Cost performance metrics  
  budgetUtilizationRate: decimal("budget_utilization_rate", { precision: 5, scale: 2 }).default('0'), // %
  costPerformanceIndex: decimal("cost_performance_index", { precision: 5, scale: 2 }).default('1'),
  earnedValue: decimal("earned_value", { precision: 12, scale: 2 }).default('0'),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).default('0'),
  costVariance: decimal("cost_variance", { precision: 12, scale: 2 }).default('0'),
  // Resource utilization metrics
  teamProductivity: decimal("team_productivity", { precision: 5, scale: 2 }).default('0'), // Tasks per person per day
  resourceUtilizationRate: decimal("resource_utilization_rate", { precision: 5, scale: 2 }).default('0'), // %
  averageTeamEfficiency: decimal("average_team_efficiency", { precision: 5, scale: 2 }).default('0'), // %
  // Quality metrics
  defectRate: decimal("defect_rate", { precision: 5, scale: 2 }).default('0'), // Defects per deliverable
  reworkPercentage: decimal("rework_percentage", { precision: 5, scale: 2 }).default('0'), // % of work redone
  customerSatisfactionScore: decimal("customer_satisfaction_score", { precision: 3, scale: 2 }).default('0'), // 1-10
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }).default('0'), // Calculated quality metric
  // Risk and communication metrics
  riskEventsOccurred: integer("risk_events_occurred").default(0),
  mitigatedRisks: integer("mitigated_risks").default(0),
  communicationEffectiveness: decimal("communication_effectiveness", { precision: 3, scale: 2 }).default('0'), // 1-10
  stakeholderEngagement: decimal("stakeholder_engagement", { precision: 3, scale: 2 }).default('0'), // 1-10
  // Velocity and throughput metrics
  storyPointsCompleted: integer("story_points_completed").default(0),
  velocityTrend: decimal("velocity_trend", { precision: 5, scale: 2 }).default('0'), // Change in velocity
  throughputRate: decimal("throughput_rate", { precision: 5, scale: 2 }).default('0'), // Items per time period
  cycleTime: decimal("cycle_time", { precision: 8, scale: 2 }).default('0'), // Average time from start to completion
  // Technology and innovation metrics
  techStackUtilization: decimal("tech_stack_utilization", { precision: 5, scale: 2 }).default('0'), // % of planned tools used
  innovationScore: decimal("innovation_score", { precision: 3, scale: 2 }).default('0'), // Novel approaches used
  technicalDebtAccrued: decimal("technical_debt_accrued", { precision: 8, scale: 2 }).default('0'), // Hours of debt
  automationCoverage: decimal("automation_coverage", { precision: 5, scale: 2 }).default('0'), // % automated
  // Performance trends (calculated fields)
  trendDirection: text("trend_direction").default("stable"), // "improving", "declining", "stable"
  forecastAccuracy: decimal("forecast_accuracy", { precision: 5, scale: 2 }).default('0'), // % accuracy of predictions
  predictedCompletionDate: timestamp("predicted_completion_date"),
  confidenceInterval: decimal("confidence_interval", { precision: 5, scale: 2 }).default('80'), // % confidence
  // Metadata and notes
  dataSource: text("data_source").default("manual"), // "manual", "automated", "integrated"
  dataQuality: decimal("data_quality", { precision: 3, scale: 2 }).default('100'), // % data quality score
  notes: text("notes"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// Relations for enhanced project planning tables
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  idea: one(savedIdeas, { fields: [projects.ideaId], references: [savedIdeas.id] }),
  template: one(projectTemplates, { fields: [projects.templateId], references: [projectTemplates.id] }),
  generation: one(taskGenerations, { fields: [projects.generationId], references: [taskGenerations.id] }),
  phases: many(projectPhases),
  milestones: many(projectMilestones),
  resources: many(projectResources),
  budgets: many(projectBudgets),
  timelines: many(projectTimelines),
  analytics: many(projectAnalytics),
  tasks: many(projectTasks),
}));

export const projectPhasesRelations = relations(projectPhases, ({ one, many }) => ({
  project: one(projects, { fields: [projectPhases.projectId], references: [projects.id] }),
  lead: one(users, { fields: [projectPhases.leadId], references: [users.id] }),
  milestones: many(projectMilestones),
  timelines: many(projectTimelines),
  tasks: many(projectTasks),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({ one, many }) => ({
  project: one(projects, { fields: [projectMilestones.projectId], references: [projects.id] }),
  phase: one(projectPhases, { fields: [projectMilestones.phaseId], references: [projectPhases.id] }),
  timelines: many(projectTimelines),
}));

export const projectResourcesRelations = relations(projectResources, ({ one }) => ({
  project: one(projects, { fields: [projectResources.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectResources.resourceId], references: [users.id] }),
  tool: one(tools, { fields: [projectResources.resourceId], references: [tools.id] }),
}));

export const projectBudgetsRelations = relations(projectBudgets, ({ one }) => ({
  project: one(projects, { fields: [projectBudgets.projectId], references: [projects.id] }),
  approver: one(users, { fields: [projectBudgets.approvedBy], references: [users.id] }),
}));

export const projectTimelinesRelations = relations(projectTimelines, ({ one }) => ({
  project: one(projects, { fields: [projectTimelines.projectId], references: [projects.id] }),
  task: one(projectTasks, { fields: [projectTimelines.taskId], references: [projectTasks.id] }),
  phase: one(projectPhases, { fields: [projectTimelines.phaseId], references: [projectPhases.id] }),
  milestone: one(projectMilestones, { fields: [projectTimelines.milestoneId], references: [projectMilestones.id] }),
}));

export const projectTemplatesRelations = relations(projectTemplates, ({ one, many }) => ({
  creator: one(users, { fields: [projectTemplates.createdBy], references: [users.id] }),
  projects: many(projects),
}));

export const projectAnalyticsRelations = relations(projectAnalytics, ({ one }) => ({
  project: one(projects, { fields: [projectAnalytics.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectAnalytics.userId], references: [users.id] }),
}));

// Enhanced project planning types
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export type ProjectPhase = typeof projectPhases.$inferSelect;
export type InsertProjectPhase = typeof projectPhases.$inferInsert;

export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type InsertProjectMilestone = typeof projectMilestones.$inferInsert;

export type ProjectResource = typeof projectResources.$inferSelect;
export type InsertProjectResource = typeof projectResources.$inferInsert;

export type ProjectBudget = typeof projectBudgets.$inferSelect;
export type InsertProjectBudget = typeof projectBudgets.$inferInsert;

export type ProjectTimeline = typeof projectTimelines.$inferSelect;
export type InsertProjectTimeline = typeof projectTimelines.$inferInsert;

export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = typeof projectTemplates.$inferInsert;

export type ProjectAnalytics = typeof projectAnalytics.$inferSelect;
export type InsertProjectAnalytics = typeof projectAnalytics.$inferInsert;

// Enhanced project planning insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = insertProjectSchema.partial();

export const insertProjectPhaseSchema = createInsertSchema(projectPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectPhaseSchema = insertProjectPhaseSchema.partial();

export const insertProjectMilestoneSchema = createInsertSchema(projectMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectMilestoneSchema = insertProjectMilestoneSchema.partial();

export const insertProjectResourceSchema = createInsertSchema(projectResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectResourceSchema = insertProjectResourceSchema.partial();

export const insertProjectBudgetSchema = createInsertSchema(projectBudgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectBudgetSchema = insertProjectBudgetSchema.partial();

export const insertProjectTimelineSchema = createInsertSchema(projectTimelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectTimelineSchema = insertProjectTimelineSchema.partial();

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const updateProjectTemplateSchema = insertProjectTemplateSchema.partial();

export const insertProjectAnalyticsSchema = createInsertSchema(projectAnalytics).omit({
  id: true,
  recordDate: true,
  calculatedAt: true,
});

// Repository analysis types
export type RepositoryAnalysis = typeof repositoryAnalyses.$inferSelect;
export type InsertRepositoryAnalysis = z.infer<typeof insertRepositoryAnalysisSchema>;
export type RepositoryImport = typeof repositoryImports.$inferSelect;
export type InsertRepositoryImport = z.infer<typeof insertRepositoryImportSchema>;
export type DetectedTool = typeof detectedTools.$inferSelect;
export type InsertDetectedTool = z.infer<typeof insertDetectedToolSchema>;

// GitHub URL validation pattern for security (SSRF protection)
const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\.git)?\/?$/;

// Repository analysis request schemas with strict GitHub URL validation
export const repositoryAnalysisRequestSchema = z.object({
  repositoryUrl: z.string()
    .url("Invalid URL format")
    .refine(
      (url) => GITHUB_URL_PATTERN.test(url), 
      "Only GitHub repository URLs are allowed for security reasons"
    ),
  branch: z.string().optional().default("main"),
});

export const repositoryImportRequestSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis ID"),
  selectedTools: z.array(z.object({
    detectedToolId: z.string().uuid("Invalid detected tool ID"),
    monthlyCost: z.string().optional(),
    quantity: z.number().min(1).optional(),
    isActive: z.boolean().optional().default(true),
  })),
  notes: z.string().optional(),
});

// Repository analysis response interfaces  
export interface RepositoryAnalysisResponse {
  analysis: RepositoryAnalysis;
  detectedTools: (DetectedTool & { 
    tool?: Tool; 
    suggestedToolRef?: Tool; 
  })[];
  summary: {
    totalTools: number;
    totalEstimatedCost: number;
    confidenceScore: number;
    categories: string[];
  };
}

export interface DetectionPattern {
  name: string;
  category: string;
  files: string[];
  patterns: RegExp[];
  dependencies?: string[];
  confidence: number;
  costEstimate?: number;
  alternatives?: string[];
}

export type RepositoryAnalysisRequest = z.infer<typeof repositoryAnalysisRequestSchema>;
export type RepositoryImportRequest = z.infer<typeof repositoryImportRequestSchema>;

// Task generation schemas
export const insertProjectTaskSchema = createInsertSchema(projectTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectTaskSchema = createInsertSchema(projectTasks).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertTaskGenerationSchema = createInsertSchema(taskGenerations).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTaskDependencySchema = createInsertSchema(taskDependencies).omit({
  id: true,
  createdAt: true,
});

export const insertTaskCategorySchema = createInsertSchema(taskCategories);

// Task generation request schemas
export const generateTasksSchema = z.object({
  ideaId: z.string().uuid("Invalid idea ID"),
  generationParameters: z.object({
    targetTimeframe: z.enum(["1-3 months", "3-6 months", "6-12 months", "12+ months"]).optional(),
    focusAreas: z.array(z.enum(["mvp", "full_featured", "scalable", "cost_optimized"])).optional(),
    includeDevOps: z.boolean().optional().default(true),
    includeTesting: z.boolean().optional().default(true),
    includeDocumentation: z.boolean().optional().default(true),
    complexityLevel: z.enum(["simple", "moderate", "comprehensive"]).optional().default("moderate"),
    teamSize: z.enum(["solo", "small", "medium", "large"]).optional(),
    budgetConstraints: z.string().optional(),
  }).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]),
  actualHours: z.string().optional(),
  notes: z.string().optional(),
  completedAt: z.string().optional(),
});

export const bulkUpdateTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()),
  updates: updateProjectTaskSchema,
});

export const createTaskDependencySchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  dependsOnTaskId: z.string().uuid("Invalid dependency task ID"),
  dependencyType: z.enum(["finish_to_start", "start_to_start", "finish_to_finish", "start_to_finish"]).optional().default("finish_to_start"),
  isOptional: z.boolean().optional().default(false),
  lagTime: z.number().optional().default(0),
  notes: z.string().optional(),
});

// Task generation types
export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;
export type UpdateProjectTask = z.infer<typeof updateProjectTaskSchema>;

export type TaskGeneration = typeof taskGenerations.$inferSelect;
export type InsertTaskGeneration = z.infer<typeof insertTaskGenerationSchema>;

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = z.infer<typeof insertTaskDependencySchema>;

export type TaskCategory = typeof taskCategories.$inferSelect;
export type InsertTaskCategory = z.infer<typeof insertTaskCategorySchema>;

// Task generation interfaces
export interface GeneratedTasksResponse {
  generation: TaskGeneration;
  tasks: ProjectTask[];
  dependencies: TaskDependency[];
  summary: {
    totalTasks: number;
    estimatedDuration: string;
    estimatedCost: number;
    complexity: "low" | "medium" | "high";
    keyMilestones: string[];
    criticalPath: string[];
  };
  stackAnalysis: {
    toolsInStack: number;
    toolsNeeded: number;
    missingTools: string[];
    additionalCosts: number;
  };
}

export interface TaskGenerationParameters {
  targetTimeframe?: "1-3 months" | "3-6 months" | "6-12 months" | "12+ months";
  focusAreas?: ("mvp" | "full_featured" | "scalable" | "cost_optimized")[];
  includeDevOps?: boolean;
  includeTesting?: boolean;
  includeDocumentation?: boolean;
  complexityLevel?: "simple" | "moderate" | "comprehensive";
  teamSize?: "solo" | "small" | "medium" | "large";
  budgetConstraints?: string;
  userStack?: string[];
  userContext?: UserAIContext;
}

export interface ProjectTaskWithDependencies extends ProjectTask {
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
}

export interface TaskTimeline {
  phases: Array<{
    name: string;
    duration: string;
    tasks: ProjectTask[];
    startDate?: Date;
    endDate?: Date;
  }>;
  criticalPath: string[];
  totalDuration: string;
  milestones: Array<{
    name: string;
    date?: Date;
    tasks: string[];
  }>;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  averageTaskComplexity: "low" | "medium" | "high";
  projectCompletionPercentage: number;
  estimatedRemainingTime: string;
}

// Task generation request types
export type GenerateTasksRequest = z.infer<typeof generateTasksSchema>;
export type UpdateTaskStatusRequest = z.infer<typeof updateTaskStatusSchema>;
export type BulkUpdateTasksRequest = z.infer<typeof bulkUpdateTasksSchema>;
export type CreateTaskDependencyRequest = z.infer<typeof createTaskDependencySchema>;

// Documentation API validation schemas
export const docSearchSchema = z.object({
  q: z.string().min(1, "Search query is required").max(200, "Query too long"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  contentType: z.enum(["guide", "tutorial", "reference", "example", "troubleshooting"]).optional(),
  difficulty: z.enum(["beginner", "intermediate", "expert"]).optional(),
  frameworks: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  limit: z.string().optional().refine(
    val => val === undefined || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100),
    "Limit must be between 1 and 100"
  ),
  offset: z.string().optional().refine(
    val => val === undefined || (!isNaN(Number(val)) && Number(val) >= 0),
    "Offset must be non-negative"
  ),
});

export const updateDocumentationArticleSchema = insertDocumentationArticleSchema.partial();

export const createDocRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000, "Review too long").optional(),
  isHelpful: z.boolean(),
});

export const createDocBookmarkSchema = z.object({
  notes: z.string().max(500, "Notes too long").optional(),
});

// Documentation API response interfaces
export interface DocumentationArticleWithDetails extends DocumentationArticle {
  category: DocCategory;
  author?: User;
  tags: (DocArticleTag & { tag: DocTag })[];
  averageRating?: number;
  totalRatings?: number;
  isBookmarked?: boolean;
  userRating?: DocRating;
}

export interface DocSearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentType: string;
  difficulty: string;
  estimatedReadTime?: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: DocTag[];
  averageRating?: number;
  viewCount: number;
  relevanceScore: number; // Search relevance score
  lastUpdated: string;
}

export interface DocSearchResponse {
  results: DocSearchResult[];
  totalCount: number;
  searchTime: number; // Milliseconds
  suggestedQueries?: string[];
  facets: {
    categories: Array<{ id: string; name: string; count: number }>;
    tags: Array<{ id: string; name: string; count: number }>;
    contentTypes: Array<{ type: string; count: number }>;
    difficulties: Array<{ level: string; count: number }>;
  };
}

export interface DocCategoryWithStats extends DocCategory {
  children?: DocCategoryWithStats[];
  articleCount: number;
  lastUpdated?: string;
}

export interface PopularDocumentation {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  category: string;
  difficulty: string;
  averageRating?: number;
}

export interface RecentlyViewedDoc {
  id: string;
  title: string;
  slug: string;
  category: string;
  viewedAt: string;
  readingProgress?: number;
}

export interface DocAnalytics {
  totalArticles: number;
  totalViews: number;
  totalBookmarks: number;
  averageRating: number;
  popularCategories: Array<{ category: string; count: number }>;
  topSearchQueries: Array<{ query: string; count: number }>;
  contentByDifficulty: Array<{ difficulty: string; count: number }>;
}

// Documentation request types
export type DocSearchRequest = z.infer<typeof docSearchSchema>;
export type UpdateDocumentationArticleRequest = z.infer<typeof updateDocumentationArticleSchema>;
export type CreateDocRatingRequest = z.infer<typeof createDocRatingSchema>;
export type CreateDocBookmarkRequest = z.infer<typeof createDocBookmarkSchema>;

// Discovery system types
export type DiscoveredTool = typeof discoveredTools.$inferSelect;
export type InsertDiscoveredTool = typeof discoveredTools.$inferInsert;
export type ToolDiscoverySession = typeof toolDiscoverySessions.$inferSelect;
export type InsertToolDiscoverySession = typeof toolDiscoverySessions.$inferInsert;
export type ExternalToolData = typeof externalToolData.$inferSelect;
export type InsertExternalToolData = typeof externalToolData.$inferInsert;
export type ToolPopularityMetric = typeof toolPopularityMetrics.$inferSelect;
export type InsertToolPopularityMetric = typeof toolPopularityMetrics.$inferInsert;
export type DiscoveryCategory = typeof discoveryCategories.$inferSelect;
export type InsertDiscoveryCategory = typeof discoveryCategories.$inferInsert;
export type UserDiscoveryPreference = typeof userDiscoveryPreferences.$inferSelect;
export type InsertUserDiscoveryPreference = typeof userDiscoveryPreferences.$inferInsert;
export type DiscoveredToolEvaluation = typeof discoveredToolEvaluations.$inferSelect;
export type InsertDiscoveredToolEvaluation = typeof discoveredToolEvaluations.$inferInsert;

// Discovery Zod schemas
export const insertDiscoveredToolSchema = createInsertSchema(discoveredTools);
export const insertToolDiscoverySessionSchema = createInsertSchema(toolDiscoverySessions);
export const insertExternalToolDataSchema = createInsertSchema(externalToolData);
export const insertToolPopularityMetricSchema = createInsertSchema(toolPopularityMetrics);
export const insertDiscoveryCategorySchema = createInsertSchema(discoveryCategories);
export const insertUserDiscoveryPreferenceSchema = createInsertSchema(userDiscoveryPreferences).omit({ id: true });
export const insertDiscoveredToolEvaluationSchema = createInsertSchema(discoveredToolEvaluations).omit({ id: true });

// Discovery API request schemas
export const discoverySearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  sourceType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  pricingModel: z.enum(["free", "freemium", "paid", "enterprise"]).optional(),
  difficultyLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
  sortBy: z.enum(["popularity", "trending", "recent", "name"]).default("popularity"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const discoveryTrendingSchema = z.object({
  timeframe: z.enum(["day", "week", "month"]).default("week"),
  category: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

export const startDiscoverySessionSchema = z.object({
  sessionType: z.enum(["full_scan", "trending_update", "category_scan", "manual_discovery"]),
  sourceTypes: z.array(z.string()).min(1),
  categories: z.array(z.string()).optional(),
  scanConfig: z.object({
    includePrerelease: z.boolean().default(false),
    minPopularityThreshold: z.number().min(0).default(0),
    maxToolsPerSource: z.number().min(1).max(1000).default(100),
  }).optional(),
});

export const toolEvaluationSchema = z.object({
  discoveredToolId: z.string(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  status: z.enum(["evaluating", "approved", "rejected", "added_to_stack"]).default("evaluating"),
  integrationComplexity: z.enum(["low", "medium", "high"]).optional(),
  estimatedImplementationTime: z.string().optional(),
  compatibilityNotes: z.string().optional(),
  decisionReason: z.string().optional(),
  alternativeTools: z.array(z.string()).optional(),
});

export const updateDiscoveryPreferencesSchema = z.object({
  enableTrendingAlerts: z.boolean().optional(),
  enableNewToolAlerts: z.boolean().optional(),
  enableWeeklyDigest: z.boolean().optional(),
  preferredCategories: z.array(z.string()).optional(),
  excludedCategories: z.array(z.string()).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  preferredLicenses: z.array(z.string()).optional(),
  maxCostThreshold: z.number().min(0).optional(),
  minPopularityThreshold: z.number().min(0).max(1).optional(),
  enablePersonalizedRecommendations: z.boolean().optional(),
  recommendationFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
});

// Discovery response interfaces
export interface DiscoveredToolWithMetrics extends DiscoveredTool {
  metrics?: ToolPopularityMetric;
  evaluation?: DiscoveredToolEvaluation;
}

export interface TrendingToolsResponse {
  tools: DiscoveredToolWithMetrics[];
  totalCount: number;
  timeframe: string;
  lastUpdated: string;
  categories: Array<{ category: string; count: number }>;
}

export interface DiscoverySearchResponse {
  tools: DiscoveredToolWithMetrics[];
  totalCount: number;
  facets: {
    categories: Array<{ category: string; count: number }>;
    sourceTypes: Array<{ type: string; count: number }>;
    languages: Array<{ language: string; count: number }>;
    pricingModels: Array<{ model: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
  searchTime: number;
}

export interface ToolRecommendationsResponse {
  recommendations: DiscoveredToolWithMetrics[];
  reasoning: string[];
  basedOnStack: string[];
  confidenceScore: number;
  categories: string[];
}

export interface DiscoverySessionStatus {
  id: string;
  status: string;
  progress: {
    current: number;
    total: number;
    phase: string;
  };
  results: {
    totalDiscovered: number;
    newTools: number;
    updated: number;
    errors: number;
  };
  startedAt: string;
  estimatedCompletion?: string;
}

// Discovery API types
export type DiscoverySearchRequest = z.infer<typeof discoverySearchSchema>;
export type DiscoveryTrendingRequest = z.infer<typeof discoveryTrendingSchema>;
export type StartDiscoverySessionRequest = z.infer<typeof startDiscoverySessionSchema>;
export type ToolEvaluationRequest = z.infer<typeof toolEvaluationSchema>;
export type UpdateDiscoveryPreferencesRequest = z.infer<typeof updateDiscoveryPreferencesSchema>;
