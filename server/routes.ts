import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateBusinessIdeas, generateEnhancedBusinessIdeas, generateTechRoadmap, getContextualRecommendations, generateProjectTasks, optimizeTaskSequencing, generateTaskRefinements } from "./gemini";
import { GitHubRepositoryAnalyzer } from "./github-analyzer";
import { seedDocumentationContent } from "./doc-seeder";
import { DiscoveryEngine, mapToDiscoveryToolSummary, type DiscoveryToolSource } from "./discovery/discovery-engine";
import { projectPlanner } from "./project-planning/project-planner";
import { timelineEngine } from "./project-planning/timeline-engine";
import { resourceOptimizer } from "./project-planning/resource-optimizer";
import { budgetCalculator } from "./project-planning/budget-calculator";
import { riskAnalyzer } from "./project-planning/risk-analyzer";
import { 
  insertUserToolSchema, 
  updateUserToolSchema, 
  insertSavedIdeaSchema, 
  insertCostSnapshotSchema, 
  insertTechRoadmapSchema, 
  userContextUpdateSchema,
  generateIdeasSchema,
  enhancedIdeasSchema,
  generateRoadmapSchema,
  budgetRecommendationsQuerySchema,
  dormantToolsQuerySchema,
  costTrendsQuerySchema,
  updateUserBudgetSchema,
  uuidParamSchema,
  sanitizeStringSchema,
  onboardingProfileSchema,
  onboardingStatusUpdateSchema,
  stackTemplateSelectionSchema,
  repositoryAnalysisRequestSchema,
  repositoryImportRequestSchema,
  generateTasksSchema,
  updateTaskStatusSchema,
  bulkUpdateTasksSchema,
  createTaskDependencySchema,
  insertProjectTaskSchema,
  updateProjectTaskSchema,
  insertTaskGenerationSchema,
  insertTaskDependencySchema,
  insertProjectSchema,
  // Documentation schemas
  insertDocCategorySchema,
  insertDocTagSchema,
  insertDocumentationArticleSchema,
  insertUserDocBookmarkSchema,
  insertDocRatingSchema,
  docSearchSchema,
  // Discovery schemas
  discoverySearchSchema,
  discoveryTrendingSchema,
  discoveryTrendingResponseSchema,
  discoverySearchResponseSchema,
  discoveryRecommendationsResponseSchema,
  startDiscoverySessionSchema,
  toolEvaluationSchema,
  updateDiscoveryPreferencesSchema,
  insertDiscoveredToolSchema,
  insertUserDiscoveryPreferenceSchema,
  insertDiscoveredToolEvaluationSchema,
  type RepositoryAnalysisResponse,
  type GeneratedTasksResponse,
  type TaskGenerationParameters,
  type DocSearchRequest,
  type DocSearchResponse,
  type DiscoveryToolSummary,
  type DiscoveredTool,
  type ToolPopularityMetric,
  type DiscoverySearchRequest,
  type DiscoveryTrendingRequest,
  type StartDiscoverySessionRequest,
  type ToolEvaluationRequest,
  type UpdateDiscoveryPreferencesRequest,
  type DiscoverySessionStatus
} from "@shared/schema";
import fs from "fs";
import path from "path";

// Type guard helper for ZodError
function isZodError(error: unknown): error is { name: string; errors: Array<{ message: string }> } {
  if (!error || typeof error !== 'object' || error === null) {
    return false;
  }
  
  const errorObj = error as Record<string, any>;
  return (
    typeof errorObj.name === 'string' &&
    errorObj.name === 'ZodError' &&
    Array.isArray(errorObj.errors)
  );
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  const getDiscoveryPopularityScore = (tool: any): number => {
    const value =
      tool?.metrics?.popularity ??
      tool?.popularityScore ??
      tool?.popularity?.score ??
      0;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const getDiscoveryLastUpdatedDate = (tool: any): Date | null => {
    const value =
      tool?.timestamps?.lastUpdated ??
      tool?.lastUpdated ??
      tool?.updatedAt ??
      null;
    if (!value) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getDiscoveryPricingModel = (tool: any): string => {
    const pricing = tool?.badges?.pricing ?? tool?.pricingModel ?? tool?.costCategory ?? 'unknown';
    return typeof pricing === 'string' && pricing.length > 0 ? pricing : 'unknown';
  };

  const randomFrom = <T>(values: T[]): T => values[Math.floor(Math.random() * values.length)];

  const mapStoredDiscoveredTool = async (tool: DiscoveredTool): Promise<DiscoveryToolSummary> => {
    const metrics: ToolPopularityMetric | null = (await storage.getLatestToolPopularityMetric(tool.id).catch(() => null)) ?? null;

    const toNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined) return undefined;
      const numeric = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(numeric) ? numeric : undefined;
    };

    const source: DiscoveryToolSource = {
      name: tool.name,
      description: tool.description ?? null,
      category: tool.category,
      subCategory: tool.subCategory ?? null,
      sourceType: tool.sourceType,
      sourceId: tool.sourceId,
      sourceUrl: tool.sourceUrl ?? null,
      repositoryUrl: tool.repositoryUrl ?? null,
      documentationUrl: tool.documentationUrl ?? null,
      homepageUrl: tool.homepageUrl ?? null,
      languages: tool.languages ?? [],
      frameworks: tool.frameworks ?? [],
      tags: tool.tags ?? [],
      keywords: tool.keywords ?? [],
      pricingModel: tool.pricingModel ?? undefined,
      costCategory: tool.costCategory ?? undefined,
      estimatedMonthlyCost: toNumber(tool.estimatedMonthlyCost) ?? null,
      difficultyLevel: tool.difficultyLevel ?? undefined,
      popularityScore: toNumber(tool.popularityScore) ?? 0,
      trendingScore: toNumber(tool.trendingScore) ?? 0,
      qualityScore: toNumber(tool.qualityScore) ?? 0,
      githubStars: tool.githubStars ?? null,
      githubForks: tool.githubForks ?? null,
      npmWeeklyDownloads: tool.npmWeeklyDownloads ?? null,
      dockerPulls: tool.dockerPulls ?? null,
      packageDownloads: tool.packageDownloads ?? null,
      version: tool.version ?? undefined,
      license: tool.license ?? undefined,
      discoveredAt: tool.discoveredAt ?? undefined,
      lastUpdated: tool.lastUpdated ?? undefined,
      lastScanned: tool.lastScanned ?? undefined,
      metrics: metrics ?? null,
      evaluation: null,
    };

    return mapToDiscoveryToolSummary(source);
  };

  const getDiscoveryMonthlyCost = (tool: any): number => {
    const value =
      tool?.metrics?.estimatedMonthlyCost ??
      tool?.estimatedMonthlyCost ??
      null;
    if (value !== null && value !== undefined) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }

    switch (getDiscoveryPricingModel(tool)) {
      case 'free':
        return 0;
      case 'freemium':
        return 25;
      case 'paid':
        return 75;
      case 'enterprise':
        return 150;
      default:
        return 100;
    }
  };

  // Security middleware for AI endpoints to prevent abuse
  const aiEndpointSecurity = (req: any, res: any, next: any) => {
    // Add basic security headers for AI endpoints
    if (req.path.startsWith('/api/ai/') || req.path.startsWith('/api/generate-') || req.path.startsWith('/api/roadmaps')) {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });
    }
    next();
  };
  
  app.use(aiEndpointSecurity);

  // Import tools from CSV on startup
  await importToolsFromCSV();
  
  // Seed initial documentation content
  try {
    await seedDocumentationContent();
    console.log("✅ Documentation content seeded successfully");
  } catch (error) {
    console.log("ℹ️ Documentation content already exists or seeding skipped:", error);
  }

  // Tools routes
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  // User tools routes
  app.get("/api/user-tools", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userTools = await storage.getUserTools(req.user!.id);
      res.json(userTools);
    } catch (error) {
      console.error("Error fetching user tools:", error);
      res.status(500).json({ message: "Failed to fetch user tools" });
    }
  });

  app.post("/api/user-tools", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userToolData = insertUserToolSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Check if user already has this tool
      const existingUserTool = await storage.getUserToolByToolId(req.user!.id, userToolData.toolId);
      if (existingUserTool) {
        return res.status(400).json({ message: "Tool already added to your stack" });
      }

      const userTool = await storage.addUserTool(userToolData);
      
      // Create cost snapshot after adding tool
      await createCostSnapshot(req.user!.id);
      
      res.status(201).json(userTool);
    } catch (error) {
      console.error("Error adding user tool:", error);
      res.status(500).json({ message: "Failed to add tool to stack" });
    }
  });

  app.put("/api/user-tools/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify ownership before allowing update
      const isOwner = await storage.verifyUserToolOwnership(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this tool" });
      }

      // Security check: reject attempts to set restricted fields
      const restrictedFields = ['userId', 'toolId', 'lastUsedAt', 'addedAt', 'id'];
      const attemptedRestrictedFields = restrictedFields.filter(field => req.body.hasOwnProperty(field));
      if (attemptedRestrictedFields.length > 0) {
        return res.status(400).json({ 
          message: `Cannot modify restricted fields: ${attemptedRestrictedFields.join(', ')}` 
        });
      }

      // Only allow safe fields to be updated
      const updates = updateUserToolSchema.partial().parse(req.body);
      const userTool = await storage.updateUserTool(req.params.id, updates);
      
      if (!userTool) {
        return res.status(404).json({ message: "User tool not found" });
      }

      // Create cost snapshot after updating tool
      await createCostSnapshot(req.user!.id);
      
      res.json(userTool);
    } catch (error) {
      console.error("Error updating user tool:", error);
      res.status(500).json({ message: "Failed to update tool" });
    }
  });

  app.delete("/api/user-tools/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify ownership before allowing deletion
      const isOwner = await storage.verifyUserToolOwnership(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this tool" });
      }

      await storage.removeUserTool(req.params.id);
      
      // Create cost snapshot after removing tool
      await createCostSnapshot(req.user!.id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user tool:", error);
      res.status(500).json({ message: "Failed to remove tool" });
    }
  });

  // Usage tracking routes
  app.put("/api/user-tools/:id/usage", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify ownership before allowing usage toggle
      const isOwner = await storage.verifyUserToolOwnership(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this tool" });
      }

      const { isActive } = req.body;
      
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }

      const userTool = await storage.toggleToolActiveStatus(req.params.id, isActive);
      
      if (!userTool) {
        return res.status(404).json({ message: "User tool not found" });
      }

      // Create cost snapshot after toggling status
      await createCostSnapshot(req.user!.id);
      
      res.json(userTool);
    } catch (error) {
      console.error("Error toggling tool status:", error);
      res.status(500).json({ message: "Failed to update tool status" });
    }
  });

  app.post("/api/user-tools/:id/mark-used", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify ownership before allowing mark as used
      const isOwner = await storage.verifyUserToolOwnership(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this tool" });
      }

      const userTool = await storage.markToolAsUsed(req.params.id);
      
      if (!userTool) {
        return res.status(404).json({ message: "User tool not found" });
      }

      res.json(userTool);
    } catch (error) {
      console.error("Error marking tool as used:", error);
      res.status(500).json({ message: "Failed to mark tool as used" });
    }
  });

  app.get("/api/user-tools/dormant", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate query parameters
      const { days } = dormantToolsQuerySchema.parse(req.query);
      const parsedDays = days ? parseInt(days) : 30;
      
      // Ensure user can only access their own tools
      const dormantTools = await storage.getDormantTools(req.user!.id, parsedDays);
      res.json(dormantTools);
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid query parameters" });
      }
      console.error("Error fetching dormant tools:", error);
      res.status(500).json({ message: "Failed to fetch dormant tools" });
    }
  });

  // AI Ideas routes
  app.post("/api/generate-ideas", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate and sanitize input
      const validatedInput = generateIdeasSchema.parse(req.body);
      const { selectedTools, goals } = validatedInput;
      
      // Note: Users can generate ideas with any available tools, not just their current stack
      // This allows exploration of new tools and business possibilities

      const ideas = await generateBusinessIdeas(selectedTools, goals);
      res.json(ideas);
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error generating ideas:", error);
      res.status(500).json({ message: "Failed to generate business ideas" });
    }
  });

  // Enhanced AI Ideas routes
  app.post("/api/ai/enhanced-ideas", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate and sanitize input
      const validatedInput = enhancedIdeasSchema.parse(req.body);
      const { selectedTools, goals } = validatedInput;
      
      // Note: Users can generate ideas with any available tools, not just their current stack
      // This allows exploration of new tools and business possibilities

      const userContext = await storage.getUserAIContext(req.user!.id);
      const ideas = await generateEnhancedBusinessIdeas(selectedTools, userContext, goals);
      res.json(ideas);
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error generating enhanced ideas:", error);
      res.status(500).json({ message: "Failed to generate enhanced business ideas" });
    }
  });

  // User AI Context routes
  app.get("/api/ai/context", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Ensure user can only access their own context
      const context = await storage.getUserAIContext(req.user!.id);
      
      if (!context) {
        return res.status(404).json({ message: "User context not found" });
      }
      
      res.json(context);
    } catch (error) {
      console.error("Error fetching user context:", error);
      res.status(500).json({ message: "Failed to fetch user context" });
    }
  });

  app.post("/api/ai/context", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate and sanitize input - only allow safe context fields
      const contextUpdate = userContextUpdateSchema.parse(req.body);
      
      // Security check: ensure user can only update their own context
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update context (storage method ensures userId matches)
      const updatedUser = await storage.updateUserContext(req.user!.id, contextUpdate);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user context" });
      }

      const context = await storage.getUserAIContext(req.user!.id);
      res.json(context);
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error updating user context:", error);
      res.status(500).json({ message: "Failed to update user context" });
    }
  });

  // Technology Roadmap routes
  app.post("/api/ai/roadmap/generate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate and sanitize input
      const validatedInput = generateRoadmapSchema.parse(req.body);
      const { currentStack, targetGoals, timeframe } = validatedInput;
      
      // Security: verify user can generate roadmaps based on their context
      const userContext = await storage.getUserAIContext(req.user!.id);
      if (!userContext) {
        return res.status(404).json({ message: "User context not found" });
      }
      
      const roadmap = await generateTechRoadmap(currentStack, targetGoals, userContext, timeframe);
      res.json(roadmap);
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error generating tech roadmap:", error);
      res.status(500).json({ message: "Failed to generate technology roadmap" });
    }
  });

  app.get("/api/roadmaps", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const roadmaps = await storage.getUserRoadmaps(req.user!.id);
      res.json(roadmaps);
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      res.status(500).json({ message: "Failed to fetch roadmaps" });
    }
  });

  app.post("/api/roadmaps", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const roadmapData = insertTechRoadmapSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const roadmap = await storage.createTechRoadmap(roadmapData);
      res.status(201).json(roadmap);
    } catch (error) {
      console.error("Error creating roadmap:", error);
      res.status(500).json({ message: "Failed to create roadmap" });
    }
  });

  app.put("/api/roadmaps/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate route parameter
      const { id } = uuidParamSchema.parse(req.params);
      
      // Verify ownership before allowing update
      const isOwner = await storage.verifyRoadmapOwnership(id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this roadmap" });
      }

      // Security check: reject attempts to set restricted fields
      const restrictedFields = ['userId', 'id', 'createdAt', 'updatedAt'];
      const attemptedRestrictedFields = restrictedFields.filter(field => req.body.hasOwnProperty(field));
      if (attemptedRestrictedFields.length > 0) {
        return res.status(400).json({ 
          message: `Cannot modify restricted fields: ${attemptedRestrictedFields.join(', ')}` 
        });
      }

      // Validate and update roadmap
      const updates = insertTechRoadmapSchema.partial().parse(req.body);
      const roadmap = await storage.updateTechRoadmap(id, updates);
      
      if (!roadmap) {
        return res.status(404).json({ message: "Roadmap not found" });
      }

      res.json(roadmap);
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error updating roadmap:", error);
      res.status(500).json({ message: "Failed to update roadmap" });
    }
  });

  app.delete("/api/roadmaps/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate route parameter
      const { id } = uuidParamSchema.parse(req.params);
      
      // Verify ownership before allowing deletion
      const isOwner = await storage.verifyRoadmapOwnership(id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this roadmap" });
      }

      await storage.deleteTechRoadmap(id);
      res.status(204).send();
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error deleting roadmap:", error);
      res.status(500).json({ message: "Failed to delete roadmap" });
    }
  });

  // Contextual AI Recommendations routes
  app.get("/api/ai/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userTools = await storage.getUserTools(req.user!.id);
      const currentStack = userTools.map(ut => ut.tool.name);
      const availableTools = await storage.getAllTools();
      const userContext = await storage.getUserAIContext(req.user!.id);
      
      const recommendations = await getContextualRecommendations(currentStack, availableTools, userContext);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating contextual recommendations:", error);
      res.status(500).json({ message: "Failed to generate contextual recommendations" });
    }
  });

  // Stack Analysis routes
  app.get("/api/ai/stack-analysis", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const analysis = await storage.analyzeStackMaturity(req.user!.id);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing stack maturity:", error);
      res.status(500).json({ message: "Failed to analyze stack maturity" });
    }
  });

  // Budget-aware recommendations
  app.get("/api/ai/budget-recommendations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate query parameters
      const { maxBudget } = budgetRecommendationsQuerySchema.parse(req.query);
      const parsedMaxBudget = maxBudget ? parseFloat(maxBudget) : undefined;
      
      // Ensure user can only get recommendations for their own context
      const recommendations = await storage.getBudgetConstrainedRecommendations(req.user!.id, parsedMaxBudget);
      res.json(recommendations);
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid query parameters" });
      }
      console.error("Error fetching budget recommendations:", error);
      res.status(500).json({ message: "Failed to fetch budget recommendations" });
    }
  });

  // Saved ideas routes
  app.get("/api/saved-ideas", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const ideas = await storage.getSavedIdeas(req.user!.id);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching saved ideas:", error);
      res.status(500).json({ message: "Failed to fetch saved ideas" });
    }
  });

  app.post("/api/saved-ideas", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const ideaData = insertSavedIdeaSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const idea = await storage.createSavedIdea(ideaData);
      res.status(201).json(idea);
    } catch (error) {
      console.error("Error saving idea:", error);
      res.status(500).json({ message: "Failed to save idea" });
    }
  });

  app.delete("/api/saved-ideas/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate route parameter
      const { id } = uuidParamSchema.parse(req.params);
      
      // Verify ownership before allowing deletion
      const isOwner = await storage.verifySavedIdeaOwnership(id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this idea" });
      }

      await storage.deleteSavedIdea(id);
      res.status(204).send();
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid ID format" });
      }
      console.error("Error deleting saved idea:", error);
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  // Budget routes
  app.get("/api/user/budget", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ monthlyBudget: user.monthlyBudget });
    } catch (error) {
      console.error("Error fetching user budget:", error);
      res.status(500).json({ message: "Failed to fetch budget" });
    }
  });

  app.put("/api/user/budget", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate and sanitize input
      const { monthlyBudget } = updateUserBudgetSchema.parse(req.body);
      
      // Security: ensure user can only update their own budget
      const user = await storage.updateUserBudget(req.user!.id, monthlyBudget || '0');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ monthlyBudget: user.monthlyBudget });
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid budget amount" });
      }
      console.error("Error updating user budget:", error);
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  app.get("/api/budget/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userTools = await storage.getUserTools(req.user!.id);
      const currentSpend = userTools.reduce((sum, item) => {
        const cost = parseFloat(item.monthlyCost || "0");
        return sum + cost;
      }, 0);

      const monthlyBudget = user.monthlyBudget ? parseFloat(user.monthlyBudget) : null;
      
      let status = "no_budget";
      let percentage = 0;
      
      if (monthlyBudget !== null) {
        percentage = monthlyBudget > 0 ? (currentSpend / monthlyBudget) * 100 : 0;
        
        if (percentage <= 75) {
          status = "good";
        } else if (percentage <= 100) {
          status = "warning";
        } else {
          status = "exceeded";
        }
      }

      res.json({
        currentSpend,
        monthlyBudget,
        percentage,
        status,
        isOverBudget: monthlyBudget !== null && currentSpend > monthlyBudget
      });
    } catch (error) {
      console.error("Error fetching budget status:", error);
      res.status(500).json({ message: "Failed to fetch budget status" });
    }
  });

  // Cost snapshots routes
  app.get("/api/cost-snapshots", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const snapshots = await storage.getCostSnapshots(req.user!.id, limit);
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching cost snapshots:", error);
      res.status(500).json({ message: "Failed to fetch cost snapshots" });
    }
  });

  // Enhanced cost trends API with trend analysis
  app.get("/api/cost-trends", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate query parameters
      const validatedQuery = costTrendsQuerySchema.parse(req.query);
      const days = validatedQuery.days ? parseInt(validatedQuery.days) : 30;
      const limit = Math.max(days, 50); // Get enough data for trend analysis
      
      const snapshots = await storage.getCostSnapshots(req.user!.id, limit);
      
      if (snapshots.length === 0) {
        // Return empty state with current cost from active tools
        const userTools = await storage.getUserTools(req.user!.id);
        const currentCost = userTools.reduce((sum, item) => {
          return sum + parseFloat(item.monthlyCost || "0");
        }, 0);

        return res.json({
          data: [],
          summary: {
            currentCost,
            previousCost: 0,
            changeAmount: 0,
            changePercentage: 0,
            trend: 'stable' as const,
            averageCost: currentCost,
            highestCost: currentCost,
            lowestCost: currentCost,
            totalDays: 0
          }
        });
      }

      // Sort snapshots by date (oldest first) for proper trend calculation
      const sortedSnapshots = snapshots
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filter to requested time period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const filteredSnapshots = sortedSnapshots.filter(snapshot => 
        new Date(snapshot.date) >= cutoffDate
      );

      // Prepare data points for chart
      const data = filteredSnapshots.map(snapshot => ({
        date: snapshot.date,
        totalCost: parseFloat(snapshot.totalCost)
      }));

      // Calculate trend analysis
      const costs = data.map(d => d.totalCost);
      const currentCost = costs.length > 0 ? costs[costs.length - 1] : 0;
      const previousCost = costs.length > 1 ? costs[costs.length - 2] : costs[0] || 0;
      
      const changeAmount = currentCost - previousCost;
      const changePercentage = previousCost > 0 ? (changeAmount / previousCost) * 100 : 0;
      
      // Determine trend direction (using 5% threshold to avoid noise)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(changePercentage) > 5) {
        trend = changePercentage > 0 ? 'up' : 'down';
      }

      const averageCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
      const highestCost = costs.length > 0 ? Math.max(...costs) : 0;
      const lowestCost = costs.length > 0 ? Math.min(...costs) : 0;

      const response = {
        data,
        summary: {
          currentCost,
          previousCost,
          changeAmount,
          changePercentage,
          trend,
          averageCost,
          highestCost,
          lowestCost,
          totalDays: data.length
        }
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching cost trends:", error);
      res.status(500).json({ message: "Failed to fetch cost trends" });
    }
  });

  // Stack Intelligence API endpoints
  app.get("/api/stack/analysis", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const recommendations = await storage.generateStackRecommendations(req.user!.id);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating stack analysis:", error);
      res.status(500).json({ message: "Failed to generate stack analysis" });
    }
  });

  app.get("/api/stack/redundancies", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const redundancies = await storage.analyzeStackRedundancies(req.user!.id);
      res.json(redundancies);
    } catch (error) {
      console.error("Error analyzing redundancies:", error);
      res.status(500).json({ message: "Failed to analyze redundancies" });
    }
  });

  app.get("/api/stack/missing", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const missing = await storage.findMissingStackPieces(req.user!.id);
      res.json(missing);
    } catch (error) {
      console.error("Error finding missing stack pieces:", error);
      res.status(500).json({ message: "Failed to find missing stack pieces" });
    }
  });

  app.get("/api/stack/compatibility", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const compatibility = await storage.checkCompatibilityIssues(req.user!.id);
      res.json(compatibility);
    } catch (error) {
      console.error("Error checking compatibility:", error);
      res.status(500).json({ message: "Failed to check compatibility" });
    }
  });

  // Onboarding API endpoints
  app.get("/api/onboarding/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const status = await storage.getOnboardingStatus(req.user!.id);
      res.json(status);
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      res.status(500).json({ message: "Failed to fetch onboarding status" });
    }
  });

  app.post("/api/onboarding/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const statusUpdate = onboardingStatusUpdateSchema.parse(req.body);
      const updatedUser = await storage.updateOnboardingStatus(req.user!.id, statusUpdate);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update onboarding status" });
      }

      const status = await storage.getOnboardingStatus(req.user!.id);
      res.json(status);
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error updating onboarding status:", error);
      res.status(500).json({ message: "Failed to update onboarding status" });
    }
  });

  app.post("/api/onboarding/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const profileData = onboardingProfileSchema.parse(req.body);
      const updatedUser = await storage.updateOnboardingProfile(req.user!.id, profileData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile" });
      }

      // Return updated user context for immediate use
      const userContext = await storage.getUserAIContext(req.user!.id);
      res.json({
        success: true,
        profile: userContext,
        profileCompleted: updatedUser.profileCompleted
      });
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error updating onboarding profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/onboarding/templates", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const templates = await storage.getOnboardingTemplates();
      
      // Optionally filter templates based on user context
      const userContext = await storage.getUserAIContext(req.user!.id);
      
      // Add relevance scoring based on user context
      const enhancedTemplates = templates.map(template => {
        let relevanceScore = 0;
        
        // Score based on industry match
        if (userContext.industry && template.tags.includes(userContext.industry.toLowerCase())) {
          relevanceScore += 3;
        }
        
        // Score based on technical level
        if (userContext.technicalLevel === 'beginner' && template.complexity === 'low') {
          relevanceScore += 2;
        } else if (userContext.technicalLevel === 'expert' && template.complexity === 'high') {
          relevanceScore += 2;
        } else if (userContext.technicalLevel === 'intermediate') {
          relevanceScore += 1;
        }
        
        // Score based on budget
        if (userContext.monthlyBudget && template.estimatedCost <= userContext.monthlyBudget) {
          relevanceScore += 1;
        }
        
        return {
          ...template,
          relevanceScore,
          recommended: relevanceScore >= 3
        };
      });
      
      // Sort by relevance score
      enhancedTemplates.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      res.json(enhancedTemplates);
    } catch (error) {
      console.error("Error fetching onboarding templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/onboarding/select-template", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const selection = stackTemplateSelectionSchema.parse(req.body);
      const templates = await storage.getOnboardingTemplates();
      const selectedTemplate = templates.find(t => t.id === selection.templateId);
      
      if (!selectedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Add all tools from template to user's stack
      const selectedToolIds = selection.toolIds ?? [];
      const toolsToAdd = selectedToolIds.length > 0
        ? selectedTemplate.tools.filter(tool => selectedToolIds.includes(tool.id))
        : selectedTemplate.tools;

      const addedTools = [];
      
      for (const tool of toolsToAdd) {
        // Check if user already has this tool
        const existingUserTool = await storage.getUserToolByToolId(req.user!.id, tool.id);
        if (!existingUserTool) {
          const userToolData = {
            userId: req.user!.id,
            toolId: tool.id,
            monthlyCost: "0", // Default cost, user can update later
            quantity: 1,
            isActive: true
          };
          
          const addedTool = await storage.addUserTool(userToolData);
          addedTools.push(addedTool);
        }
      }

      // Create cost snapshot after adding tools
      await createCostSnapshot(req.user!.id);

      // Update onboarding status to indicate template selection is complete
      await storage.updateOnboardingStatus(req.user!.id, {
        onboardingStatus: 'in_progress',
        onboardingStep: 3
      });

      res.json({
        success: true,
        template: selectedTemplate,
        addedTools: addedTools.length,
        message: `Successfully added ${addedTools.length} tools from ${selectedTemplate.name} template`
      });
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error applying template:", error);
      res.status(500).json({ message: "Failed to apply template" });
    }
  });

  app.post("/api/onboarding/skip", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updatedUser = await storage.skipOnboarding(req.user!.id);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to skip onboarding" });
      }

      res.json({
        success: true,
        message: "Onboarding skipped successfully",
        onboardingStatus: updatedUser.onboardingStatus
      });
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      res.status(500).json({ message: "Failed to skip onboarding" });
    }
  });

  app.post("/api/onboarding/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updatedUser = await storage.completeOnboarding(req.user!.id);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to complete onboarding" });
      }

      // Create initial cost snapshot if user has tools
      const userTools = await storage.getUserTools(req.user!.id);
      if (userTools.length > 0) {
        await createCostSnapshot(req.user!.id);
      }

      res.json({
        success: true,
        message: "Onboarding completed successfully",
        onboardingStatus: updatedUser.onboardingStatus,
        toolsCount: userTools.length
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Task Generation and Management Routes
  
  // Generate tasks from a saved idea
  app.post("/api/ideas/:id/generate-tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const ideaId = uuidParamSchema.parse({ id: req.params.id }).id;
      const generationData = generateTasksSchema.parse(req.body);
      
      // Verify user owns the idea
      const idea = await storage.getSavedIdea(ideaId);
      if (!idea || idea.userId !== req.user!.id) {
        return res.status(404).json({ message: "Idea not found or access denied" });
      }

      // Get user's context and tech stack
      const userContext = await storage.getUserAIContext(req.user!.id);
      const userTools = await storage.getUserTools(req.user!.id);
      const tools = userTools.map(ut => ut.tool);

      // Generate project tasks using AI
      const taskGenerationResult = await generateProjectTasks(
        idea,
        userContext,
        tools,
        generationData.generationParameters || {}
      );

      // Create task generation record
      const generationRecord = await storage.createTaskGeneration({
        userId: req.user!.id,
        ideaId: idea.id,
        title: `Tasks for: ${idea.title}`,
        description: `Generated ${taskGenerationResult.tasks.length} tasks for project implementation`,
        status: "generating",
        aiModel: "gemini-2.5-flash",
        generationParameters: generationData.generationParameters || {},
        totalTasks: taskGenerationResult.tasks.length,
        estimatedProjectDuration: taskGenerationResult.projectMetadata.totalDuration,
        estimatedTotalCost: taskGenerationResult.projectMetadata.estimatedCost.toString(),
        projectComplexity: taskGenerationResult.projectMetadata.complexity,
        keyMilestones: taskGenerationResult.projectMetadata.keyMilestones,
        criticalPath: taskGenerationResult.projectMetadata.criticalPath,
        riskAssessment: taskGenerationResult.projectMetadata.riskAssessment,
        stackAnalysis: taskGenerationResult.stackAnalysis,
        generationMetadata: {
          aiModel: "gemini-2.5-flash",
          generatedAt: new Date().toISOString(),
          userStack: tools.map(t => t.name),
          parameters: generationData.generationParameters
        }
      });

      // Create individual tasks
      const createdTasks = [];
      for (const task of taskGenerationResult.tasks) {
        const createdTask = await storage.createProjectTask({
          userId: req.user!.id,
          ideaId: idea.id,
          generationId: generationRecord.id,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          complexity: task.complexity,
          estimatedHours: task.estimatedHours.toString(),
          estimatedDays: task.estimatedDays.toString(),
          technicalRequirements: task.technicalRequirements,
          acceptanceCriteria: task.acceptanceCriteria,
          suggestedTools: task.suggestedTools,
          requiredTools: task.requiredTools,
          costEstimate: task.costEstimate.toString(),
          resourceRequirements: task.resourceRequirements
        });
        createdTasks.push(createdTask);
      }

      // Create task dependencies
      const dependencies = [];
      for (const task of taskGenerationResult.tasks) {
        if (task.dependencies && task.dependencies.length > 0) {
          const createdTask = createdTasks.find(ct => ct.title === task.title);
          if (createdTask) {
            for (const depTitle of task.dependencies) {
              const dependentTask = createdTasks.find(ct => ct.title === depTitle);
              if (dependentTask) {
                const dependency = await storage.createTaskDependency({
                  taskId: createdTask.id,
                  dependsOnTaskId: dependentTask.id,
                  dependencyType: "finish_to_start",
                  isOptional: false,
                  lagTime: 0
                });
                dependencies.push(dependency);
              }
            }
          }
        }
      }

      // Mark generation as completed
      await storage.updateTaskGeneration(generationRecord.id, {
        status: "completed"
      });

      const response: GeneratedTasksResponse = {
        generation: generationRecord,
        tasks: createdTasks,
        dependencies,
        summary: {
          totalTasks: createdTasks.length,
          estimatedDuration: taskGenerationResult.projectMetadata.totalDuration,
          estimatedCost: taskGenerationResult.projectMetadata.estimatedCost,
          complexity: taskGenerationResult.projectMetadata.complexity,
          keyMilestones: taskGenerationResult.projectMetadata.keyMilestones,
          criticalPath: taskGenerationResult.projectMetadata.criticalPath
        },
        stackAnalysis: taskGenerationResult.stackAnalysis
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error generating tasks:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({ message: "Failed to generate tasks" });
    }
  });

  // Get all tasks for a user
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { projectId, status, category, priority } = req.query;
      
      let tasks = await storage.getUserTasks(req.user!.id);
      
      // Apply filters
      if (projectId) {
        tasks = tasks.filter(task => task.generationId === projectId);
      }
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }
      if (category) {
        tasks = tasks.filter(task => task.category === category);
      }
      if (priority) {
        tasks = tasks.filter(task => task.priority === priority);
      }

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get tasks for a specific generation/project
  app.get("/api/tasks/project/:generationId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const generationId = uuidParamSchema.parse({ id: req.params.generationId }).id;
      
      // Verify user owns the generation
      const generation = await storage.getTaskGeneration(generationId);
      if (!generation || generation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found or access denied" });
      }

      const tasks = await storage.getTasksByGeneration(generationId);
      const dependencies = await storage.getTaskDependenciesByGeneration(generationId);
      
      res.json({
        generation,
        tasks,
        dependencies,
        metrics: await storage.getTaskMetrics(generationId)
      });
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      res.status(500).json({ message: "Failed to fetch project tasks" });
    }
  });

  // Update a specific task
  app.put("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const taskId = uuidParamSchema.parse({ id: req.params.id }).id;
      
      // Verify ownership
      const isOwner = await storage.verifyTaskOwnership(taskId, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this task" });
      }

      const updates = updateProjectTaskSchema.parse(req.body);
      const updatedTask = await storage.updateProjectTask(taskId, updates);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Update task status
  app.put("/api/tasks/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const taskId = uuidParamSchema.parse({ id: req.params.id }).id;
      const statusUpdate = updateTaskStatusSchema.parse(req.body);
      
      // Verify ownership
      const isOwner = await storage.verifyTaskOwnership(taskId, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this task" });
      }

      const updates: any = { status: statusUpdate.status };
      
      if (statusUpdate.actualHours) {
        updates.actualHours = statusUpdate.actualHours;
      }
      if (statusUpdate.notes) {
        updates.notes = statusUpdate.notes;
      }
      if (statusUpdate.status === "completed" && !statusUpdate.completedAt) {
        updates.completedAt = new Date().toISOString();
      } else if (statusUpdate.completedAt) {
        updates.completedAt = statusUpdate.completedAt;
      }

      const updatedTask = await storage.updateProjectTask(taskId, updates);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  // Create a task dependency
  app.post("/api/tasks/:id/dependencies", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const taskId = uuidParamSchema.parse({ id: req.params.id }).id;
      const dependencyData = createTaskDependencySchema.parse(req.body);
      
      // Verify ownership of both tasks
      const isOwner = await storage.verifyTaskOwnership(taskId, req.user!.id);
      const isDependentOwner = await storage.verifyTaskOwnership(dependencyData.dependsOnTaskId, req.user!.id);
      
      if (!isOwner || !isDependentOwner) {
        return res.status(403).json({ message: "Access denied: You don't own these tasks" });
      }

      // Prevent circular dependencies
      const wouldCreateCircle = await storage.checkCircularDependency(taskId, dependencyData.dependsOnTaskId);
      if (wouldCreateCircle) {
        return res.status(400).json({ message: "Cannot create circular dependency" });
      }

      const dependency = await storage.createTaskDependency({
        taskId,
        dependsOnTaskId: dependencyData.dependsOnTaskId,
        dependencyType: dependencyData.dependencyType || "finish_to_start",
        isOptional: dependencyData.isOptional || false,
        lagTime: dependencyData.lagTime || 0,
        notes: dependencyData.notes
      });

      res.status(201).json(dependency);
    } catch (error) {
      console.error("Error creating task dependency:", error);
      res.status(500).json({ message: "Failed to create task dependency" });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const taskId = uuidParamSchema.parse({ id: req.params.id }).id;
      
      // Verify ownership
      const isOwner = await storage.verifyTaskOwnership(taskId, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this task" });
      }

      await storage.deleteProjectTask(taskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Get task generation history
  app.get("/api/task-generations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const generations = await storage.getUserTaskGenerations(req.user!.id);
      res.json(generations);
    } catch (error) {
      console.error("Error fetching task generations:", error);
      res.status(500).json({ message: "Failed to fetch task generations" });
    }
  });

  // Get specific task generation details
  app.get("/api/task-generations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const generationId = uuidParamSchema.parse({ id: req.params.id }).id;
      
      const generation = await storage.getTaskGeneration(generationId);
      if (!generation || generation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Generation not found or access denied" });
      }

      const tasks = await storage.getTasksByGeneration(generationId);
      const dependencies = await storage.getTaskDependenciesByGeneration(generationId);
      
      res.json({
        generation,
        tasks,
        dependencies,
        metrics: await storage.getTaskMetrics(generationId)
      });
    } catch (error) {
      console.error("Error fetching task generation:", error);
      res.status(500).json({ message: "Failed to fetch task generation" });
    }
  });

  // Optimize task sequencing
  app.post("/api/tasks/optimize/:generationId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const generationId = uuidParamSchema.parse({ id: req.params.generationId }).id;
      
      // Verify ownership
      const generation = await storage.getTaskGeneration(generationId);
      if (!generation || generation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Generation not found or access denied" });
      }

      const tasks = await storage.getTasksByGeneration(generationId);
      const userContext = await storage.getUserAIContext(req.user!.id);
      
      // Convert to GeneratedTask format for AI optimization
      const generatedTasks = tasks.map(task => {
        const requirements = task.resourceRequirements as {
          skillsNeeded?: unknown;
          teamMembers?: unknown;
          externalResources?: unknown;
        } | null;

        const skillsNeeded = Array.isArray(requirements?.skillsNeeded)
          ? (requirements!.skillsNeeded as unknown[]).filter((skill): skill is string => typeof skill === 'string')
          : [];

        const teamMembers = typeof requirements?.teamMembers === 'number' ? requirements.teamMembers : undefined;
        const externalResources = Array.isArray(requirements?.externalResources)
          ? (requirements.externalResources as unknown[]).filter((value): value is string => typeof value === 'string')
          : undefined;

        return {
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority as "low" | "medium" | "high" | "urgent",
          complexity: task.complexity as "low" | "medium" | "high",
          estimatedHours: parseFloat(task.estimatedHours || "0"),
          estimatedDays: parseFloat(task.estimatedDays || "0"),
          technicalRequirements: task.technicalRequirements || [],
          acceptanceCriteria: task.acceptanceCriteria || [],
          suggestedTools: task.suggestedTools || [],
          requiredTools: task.requiredTools || [],
          costEstimate: parseFloat(task.costEstimate || "0"),
          resourceRequirements: {
            skillsNeeded,
            ...(typeof teamMembers === 'number' ? { teamMembers } : {}),
            ...(externalResources ? { externalResources } : {})
          },
          dependencies: [] // Will be populated from database relationships
        };
      });

      const optimization = await optimizeTaskSequencing(generatedTasks, userContext);
      
      res.json(optimization);
    } catch (error) {
      console.error("Error optimizing task sequence:", error);
      res.status(500).json({ message: "Failed to optimize task sequence" });
    }
  });

  // Bulk update tasks
  app.put("/api/tasks/bulk", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const bulkUpdate = bulkUpdateTasksSchema.parse(req.body);
      
      // Verify ownership of all tasks
      for (const taskId of bulkUpdate.taskIds) {
        const isOwner = await storage.verifyTaskOwnership(taskId, req.user!.id);
        if (!isOwner) {
          return res.status(403).json({ message: `Access denied for task ${taskId}` });
        }
      }

      const updatedTasks = [];
      for (const taskId of bulkUpdate.taskIds) {
        const updatedTask = await storage.updateProjectTask(taskId, bulkUpdate.updates);
        if (updatedTask) {
          updatedTasks.push(updatedTask);
        }
      }

      res.json({
        success: true,
        updatedCount: updatedTasks.length,
        tasks: updatedTasks
      });
    } catch (error) {
      console.error("Error bulk updating tasks:", error);
      res.status(500).json({ message: "Failed to bulk update tasks" });
    }
  });

  // Repository Analysis Routes
  const analyzer = new GitHubRepositoryAnalyzer();

  app.post("/api/repositories/analyze", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { repositoryUrl, branch } = repositoryAnalysisRequestSchema.parse(req.body);
      
      // Parse repository info with security validation
      const repoInfo = analyzer.parseRepositoryUrl(repositoryUrl);
      if (!repoInfo) {
        return res.status(400).json({ 
          message: "Invalid repository URL. Only GitHub repositories are supported for security reasons." 
        });
      }
      
      // Create analysis record
      const analysisData = {
        userId: req.user!.id,
        repositoryUrl,
        repositoryName: repoInfo.repo,
        repositoryOwner: repoInfo.owner,
        branch: branch || "main",
        status: "analyzing" as const
      };

      const analysis = await storage.createRepositoryAnalysis(analysisData);

      try {
        // Perform repository analysis
        const analysisResult = await analyzer.analyzeRepository(repositoryUrl, branch);
        
        // Get existing tools for matching
        const existingTools = await storage.getAllTools();
        
        // Match detected tools with existing tools
        const matchedTools = await analyzer.matchWithExistingTools(
          analysisResult.detectedTools,
          existingTools
        );

        // Set analysis ID for all detected tools
        const detectedToolsWithAnalysis = matchedTools.map(tool => ({
          ...tool,
          analysisId: analysis.id
        }));

        // Save detected tools to database
        const savedDetectedTools = await storage.createDetectedTools(detectedToolsWithAnalysis);

        // Update analysis with results
        const updatedAnalysis = await storage.updateRepositoryAnalysis(analysis.id, {
          status: "completed",
          analysisResults: {
            summary: analysisResult.summary,
            detectedToolsCount: savedDetectedTools.length
          },
          totalDetectedTools: savedDetectedTools.length,
          estimatedMonthlyCost: analysisResult.summary.totalEstimatedCost.toString(),
          confidenceScore: analysisResult.summary.confidenceScore.toString(),
          completedAt: new Date()
        });

        // Get detailed detected tools with relationships
        const detectedToolsWithRelations = await storage.getDetectedToolsByAnalysisId(analysis.id);

        const response: RepositoryAnalysisResponse = {
          analysis: updatedAnalysis!,
          detectedTools: detectedToolsWithRelations,
          summary: analysisResult.summary
        };

        res.json(response);
      } catch (analysisError) {
        // Update analysis with error
        await storage.updateRepositoryAnalysis(analysis.id, {
          status: "failed",
          analysisError: analysisError instanceof Error ? analysisError.message : "Analysis failed",
          completedAt: new Date()
        });

        throw analysisError;
      }
    } catch (error) {
      console.error("Repository analysis error:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Repository analysis failed" 
      });
    }
  });

  app.get("/api/repositories/analyses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const analyses = await storage.getUserRepositoryAnalyses(req.user!.id);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching repository analyses:", error);
      res.status(500).json({ message: "Failed to fetch repository analyses" });
    }
  });

  app.get("/api/repositories/analyses/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      
      // Verify ownership
      const isOwner = await storage.verifyRepositoryAnalysisOwnership(id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this analysis" });
      }

      const analysis = await storage.getRepositoryAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Repository analysis not found" });
      }

      const detectedTools = await storage.getDetectedToolsByAnalysisId(id);

      const response: RepositoryAnalysisResponse = {
        analysis,
        detectedTools,
        summary: {
          totalTools: detectedTools.length,
          totalEstimatedCost: parseFloat(analysis.estimatedMonthlyCost || "0"),
          confidenceScore: parseFloat(analysis.confidenceScore || "0"),
          categories: Array.from(new Set(detectedTools.map(t => t.category)))
        }
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching repository analysis:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid analysis ID format" });
      }
      res.status(500).json({ message: "Failed to fetch repository analysis" });
    }
  });

  app.post("/api/repositories/import", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const importRequest = repositoryImportRequestSchema.parse(req.body);
      
      // Verify analysis ownership
      const isOwner = await storage.verifyRepositoryAnalysisOwnership(
        importRequest.analysisId, 
        req.user!.id
      );
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this analysis" });
      }

      // Get detected tools for the analysis
      const detectedTools = await storage.getDetectedToolsByAnalysisId(importRequest.analysisId);
      
      // Filter selected tools
      const selectedToolsMap = new Map(
        importRequest.selectedTools.map(t => [t.detectedToolId, t])
      );

      const toolsToImport = detectedTools.filter(tool => 
        selectedToolsMap.has(tool.id)
      );

      // Import selected tools as user tools
      let totalImportedCost = 0;
      const importedUserTools = [];

      for (const detectedTool of toolsToImport) {
        const selection = selectedToolsMap.get(detectedTool.id)!;
        
        // Use the detected tool's suggested tool or create a new entry
        const toolId = detectedTool.toolId || detectedTool.suggestedTool;
        
        if (toolId) {
          // Check if user already has this tool
          const existingUserTool = await storage.getUserToolByToolId(req.user!.id, toolId);
          if (existingUserTool) {
            // Update existing tool instead of creating duplicate
            await storage.updateUserTool(existingUserTool.id, {
              monthlyCost: selection.monthlyCost || existingUserTool.monthlyCost,
              quantity: selection.quantity || existingUserTool.quantity,
              isActive: selection.isActive !== undefined ? selection.isActive : existingUserTool.isActive
            });
          } else {
            // Create new user tool
            const userToolData = {
              userId: req.user!.id,
              toolId,
              monthlyCost: selection.monthlyCost || detectedTool.estimatedMonthlyCost || "0",
              quantity: selection.quantity || 1,
              isActive: selection.isActive !== undefined ? selection.isActive : true
            };

            const userTool = await storage.addUserTool(userToolData);
            importedUserTools.push(userTool);
            totalImportedCost += parseFloat(userToolData.monthlyCost);
          }

          // Mark detected tool as imported
          await storage.markDetectedToolAsImported(detectedTool.id);
        }
      }

      // Create import record
      const importData = {
        userId: req.user!.id,
        analysisId: importRequest.analysisId,
        importedTools: importedUserTools.map(t => ({ 
          userToolId: t.id, 
          toolId: t.toolId,
          monthlyCost: t.monthlyCost 
        })),
        totalImportedTools: importedUserTools.length,
        importedMonthlyCost: totalImportedCost.toString(),
        notes: importRequest.notes
      };

      const importRecord = await storage.createRepositoryImport(importData);

      // Create cost snapshot after import
      await createCostSnapshot(req.user!.id);

      res.json({
        import: importRecord,
        importedTools: importedUserTools.length,
        totalCost: totalImportedCost
      });
    } catch (error) {
      console.error("Repository import error:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ message: "Repository import failed" });
    }
  });

  app.delete("/api/repositories/analyses/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      
      // Verify ownership
      const isOwner = await storage.verifyRepositoryAnalysisOwnership(id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied: You don't own this analysis" });
      }

      await storage.deleteRepositoryAnalysis(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting repository analysis:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid analysis ID format" });
      }
      res.status(500).json({ message: "Failed to delete repository analysis" });
    }
  });

  // Documentation API Routes
  
  // Documentation search endpoint
  app.get("/api/docs/search", async (req, res) => {
    try {
      const searchRequest = docSearchSchema.parse(req.query);
      const userId = req.isAuthenticated() ? req.user!.id : undefined;
      
      // Save search history if user is logged in
      if (userId && searchRequest.q) {
        await storage.createDocSearchHistory({
          userId,
          query: searchRequest.q,
          filters: JSON.stringify(req.query)
        });
      }
      
      const results = await storage.searchDocumentation(searchRequest, userId);
      res.json(results);
    } catch (error) {
      console.error("Error searching documentation:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Invalid search request", 
          errors: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get all documentation with filtering
  app.get("/api/docs", async (req, res) => {
    try {
      const {
        category,
        contentType,
        difficulty,
        limit = "20",
        offset = "0"
      } = req.query;

      const filters = {
        categoryId: typeof category === 'string' ? category : undefined,
        contentType: typeof contentType === 'string' ? contentType : undefined,
        difficulty: typeof difficulty === 'string' ? difficulty : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const articles = await storage.getAllDocumentationArticles(filters);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching documentation:", error);
      res.status(500).json({ message: "Failed to fetch documentation" });
    }
  });

  // Get featured documentation
  app.get("/api/docs/featured", async (req, res) => {
    try {
      const featured = await storage.getFeaturedDocumentation();
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured documentation:", error);
      res.status(500).json({ message: "Failed to fetch featured documentation" });
    }
  });

  // Get popular documentation
  app.get("/api/docs/popular", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const popular = await storage.getPopularDocumentation(limit);
      res.json(popular);
    } catch (error) {
      console.error("Error fetching popular documentation:", error);
      res.status(500).json({ message: "Failed to fetch popular documentation" });
    }
  });

  // Get recent documentation
  app.get("/api/docs/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const recent = await storage.getRecentDocumentation(limit);
      res.json(recent);
    } catch (error) {
      console.error("Error fetching recent documentation:", error);
      res.status(500).json({ message: "Failed to fetch recent documentation" });
    }
  });

  // Get documentation categories hierarchy
  app.get("/api/docs/categories", async (req, res) => {
    try {
      const categories = await storage.getDocCategoriesHierarchy();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching documentation categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get documentation tags
  app.get("/api/docs/tags", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const tags = limit ? await storage.getPopularDocTags(limit) : await storage.getAllDocTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching documentation tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Get specific documentation article
  app.get("/api/docs/:id", async (req, res) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.isAuthenticated() ? req.user!.id : undefined;
      
      const article = await storage.getDocumentationArticle(id, userId);
      
      if (!article) {
        return res.status(404).json({ message: "Documentation article not found" });
      }

      // Increment view count
      await storage.incrementDocumentationView(id, userId, req.sessionID);

      res.json(article);
    } catch (error) {
      console.error("Error fetching documentation article:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid article ID format" });
      }
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Get related documentation
  app.get("/api/docs/:id/related", async (req, res) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const related = await storage.getRelatedDocumentation(id, limit);
      res.json(related);
    } catch (error) {
      console.error("Error fetching related documentation:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid article ID format" });
      }
      res.status(500).json({ message: "Failed to fetch related articles" });
    }
  });

  // User bookmarks routes
  app.get("/api/docs/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const bookmarks = await storage.getUserDocBookmarks(req.user!.id);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching user bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/docs/:id/bookmark", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      const { notes } = req.body;
      
      const bookmark = await storage.createDocBookmark(req.user!.id, id, notes);
      res.status(201).json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete("/api/docs/:id/bookmark", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      
      await storage.deleteDocBookmark(req.user!.id, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid article ID format" });
      }
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Documentation ratings routes
  app.get("/api/docs/:id/ratings", async (req, res) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      
      const ratings = await storage.getDocumentationRatings(id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching documentation ratings:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid article ID format" });
      }
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.post("/api/docs/:id/rating", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      const ratingData = insertDocRatingSchema.parse({
        ...req.body,
        userId: req.user!.id,
        articleId: id
      });
      
      // Check if user already rated this article
      const existingRating = await storage.getUserDocRating(req.user!.id, id);
      
      if (existingRating) {
        // Update existing rating
        const updated = await storage.updateDocRating(existingRating.id, {
          rating: ratingData.rating,
          review: ratingData.review
        });
        res.json(updated);
      } else {
        // Create new rating
        const rating = await storage.createDocRating(ratingData);
        res.status(201).json(rating);
      }
    } catch (error) {
      console.error("Error creating/updating rating:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Invalid rating data", 
          errors: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  app.delete("/api/docs/:id/rating", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      
      await storage.deleteDocRating(req.user!.id, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting rating:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid article ID format" });
      }
      res.status(500).json({ message: "Failed to delete rating" });
    }
  });

  // User search history
  app.get("/api/docs/search-history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const history = await storage.getUserDocSearchHistory(req.user!.id, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching search history:", error);
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });

  app.delete("/api/docs/search-history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { query } = req.query;
      await storage.deleteDocSearchHistory(req.user!.id, typeof query === 'string' ? query : undefined);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing search history:", error);
      res.status(500).json({ message: "Failed to clear search history" });
    }
  });

  // Documentation analytics (admin/insights)
  app.get("/api/docs/analytics", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const analytics = await storage.getDocumentationAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching documentation analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin routes for content management (future enhancement)
  app.post("/api/docs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const articleData = insertDocumentationArticleSchema.parse({
        ...req.body,
        authorId: req.user!.id
      });
      
      const article = await storage.createDocumentationArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating documentation article:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Invalid article data", 
          errors: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put("/api/docs/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      const updates = req.body;
      
      const updated = await storage.updateDocumentationArticle(id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating documentation article:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/docs/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      
      await storage.deleteDocumentationArticle(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting documentation article:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid article ID format" });
      }
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Initialize Discovery Engine
  const discoveryEngine = new DiscoveryEngine(process.env.GITHUB_API_KEY);

  // Discovery API endpoints
  app.get("/api/discovery/trending", async (req, res) => {
    try {
      const filters = discoveryTrendingSchema.parse(req.query);

      const { tools: trendingTools, sourceStatuses } = await discoveryEngine.discoverTrendingTools(
        { maxToolsPerSource: filters.limit },
        filters.category ? [filters.category] : undefined
      );

      const items = trendingTools.map(mapToDiscoveryToolSummary);
      const categoryCounts = new Map<string, number>();
      for (const tool of items) {
        categoryCounts.set(tool.category, (categoryCounts.get(tool.category) ?? 0) + 1);
      }
      const categories = Array.from(categoryCounts.entries()).map(([category, count]) => ({ category, count }));

      const payload = discoveryTrendingResponseSchema.parse({
        items,
        totalCount: items.length,
        timeframe: filters.timeframe,
        lastUpdated: new Date().toISOString(),
        categories,
        sourceStatuses,
      });

      res.json(payload);
    } catch (error) {
      console.error("Error fetching trending tools:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid query parameters" });
      }
      res.status(500).json({ message: "Failed to fetch trending tools" });
    }
  });

  app.get("/api/discovery/search", async (req, res) => {
    try {
      const filters = discoverySearchSchema.parse(req.query);

      if (!filters.query && !filters.category) {
        return res.status(400).json({ message: "Query or category required" });
      }

      const discoveryResult = filters.query
        ? await discoveryEngine.searchTools(
            filters.query,
            filters.sourceType ? [filters.sourceType] : undefined
          )
        : await discoveryEngine.discoverTrendingTools(
            { maxToolsPerSource: filters.limit },
            filters.category ? [filters.category] : undefined
          );

      let filteredResults = discoveryResult.tools;

      if (filters.languages?.length) {
        filteredResults = filteredResults.filter(tool =>
          tool.languages?.some(lang =>
            filters.languages!.some(filterLang =>
              lang.toLowerCase().includes(filterLang.toLowerCase())
            )
          )
        );
      }

      if (filters.pricingModel) {
        filteredResults = filteredResults.filter(tool =>
          getDiscoveryPricingModel(tool) === filters.pricingModel
        );
      }

      if (filters.difficultyLevel) {
        filteredResults = filteredResults.filter(tool =>
          tool.difficultyLevel === filters.difficultyLevel
        );
      }

      const startIndex = filters.offset;
      const endIndex = startIndex + filters.limit;

      const dtoFilteredResults = filteredResults.map(mapToDiscoveryToolSummary);
      const paginatedResults = dtoFilteredResults.slice(startIndex, endIndex);

      const categoriesFacet = new Map<string, number>();
      const sourceFacet = new Map<string, number>();
      const languageFacet = new Map<string, number>();
      const pricingFacet = new Map<string, number>();
      const tagFacet = new Map<string, number>();

      for (const tool of dtoFilteredResults) {
        categoriesFacet.set(tool.category, (categoriesFacet.get(tool.category) ?? 0) + 1);
        sourceFacet.set(tool.provenance.sourceType, (sourceFacet.get(tool.provenance.sourceType) ?? 0) + 1);
        pricingFacet.set(tool.badges.pricing, (pricingFacet.get(tool.badges.pricing) ?? 0) + 1);
        for (const language of tool.tech.languages) {
          languageFacet.set(language, (languageFacet.get(language) ?? 0) + 1);
        }
        for (const tag of tool.tech.tags.slice(0, 20)) {
          tagFacet.set(tag, (tagFacet.get(tag) ?? 0) + 1);
        }
      }

      const payload = discoverySearchResponseSchema.parse({
        items: paginatedResults,
        totalCount: dtoFilteredResults.length,
        facets: {
          categories: Array.from(categoriesFacet.entries()).map(([category, count]) => ({ category, count })),
          sourceTypes: Array.from(sourceFacet.entries()).map(([type, count]) => ({ type, count })),
          languages: Array.from(languageFacet.entries()).map(([language, count]) => ({ language, count })),
          pricingModels: Array.from(pricingFacet.entries()).map(([model, count]) => ({ model, count })),
          tags: Array.from(tagFacet.entries()).map(([tag, count]) => ({ tag, count })),
        },
        sourceStatuses: discoveryResult.sourceStatuses,
        searchTime: Date.now(),
      });

      res.json(payload);
    } catch (error) {
      console.error("Error searching discovery tools:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid search parameters" });
      }
      res.status(500).json({ message: "Failed to search tools" });
    }
  });

  app.get("/api/discovery/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userTools = await storage.getUserTools(req.user!.id);
      const userStack = userTools.map(ut => ut.tool.name);
      const userLanguages = user.preferredCategories || [];
      const userCategories = user.preferredCategories || [];

      const recommendations = await discoveryEngine.generateRecommendations(
        userStack,
        userCategories,
        userLanguages,
        user.teamSize || undefined,
        user.industry || undefined
      );

      const payload = discoveryRecommendationsResponseSchema.parse(recommendations);

      res.json(payload);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.post("/api/discovery/scan", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const scanRequest = startDiscoverySessionSchema.parse(req.body);
      
      // Start discovery session asynchronously
      const sessionId = crypto.randomUUID();
      
      // In a real implementation, this would be queued as a background job
      setTimeout(async () => {
        try {
          console.log(`Starting discovery session ${sessionId} with config:`, scanRequest);
          
          // Run discovery for specified source types
          const discoveryResult = await discoveryEngine.discoverTrendingTools(
            {
              enabledSources: scanRequest.sourceTypes,
              maxToolsPerSource: scanRequest.scanConfig?.maxToolsPerSource || 100,
              minPopularityThreshold: scanRequest.scanConfig?.minPopularityThreshold || 0,
            },
            scanRequest.categories
          );

          console.log(`Discovery session ${sessionId} completed. Found ${discoveryResult.tools.length} tools.`);
        } catch (error) {
          console.error(`Discovery session ${sessionId} failed:`, error);
        }
      }, 0);

      const response: DiscoverySessionStatus = {
        id: sessionId,
        status: "running",
        progress: {
          current: 0,
          total: scanRequest.sourceTypes.length,
          phase: "initializing",
        },
        results: {
          totalDiscovered: 0,
          newTools: 0,
          updated: 0,
          errors: 0,
        },
        startedAt: new Date().toISOString(),
      };

      res.status(202).json(response);
    } catch (error) {
      console.error("Error starting discovery scan:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid scan configuration" });
      }
      res.status(500).json({ message: "Failed to start discovery scan" });
    }
  });

  app.get("/api/discovery/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      
      // In a real implementation, this would fetch from storage
      const mockStatus: DiscoverySessionStatus = {
        id,
        status: "completed",
        progress: {
          current: 4,
          total: 4,
          phase: "completed",
        },
        results: {
          totalDiscovered: 156,
          newTools: 23,
          updated: 133,
          errors: 2,
        },
        startedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      };

      res.json(mockStatus);
    } catch (error) {
      console.error("Error fetching discovery session:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid session ID format" });
      }
      res.status(500).json({ message: "Failed to fetch discovery session" });
    }
  });

  app.post("/api/discovery/tools/:id/evaluate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      const evaluation = toolEvaluationSchema.parse({
        ...req.body,
        discoveredToolId: id,
      });

      // In a real implementation, this would save to storage
      const savedEvaluation = {
        id: crypto.randomUUID(),
        userId: req.user!.id,
        ...evaluation,
        evaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json(savedEvaluation);
    } catch (error) {
      console.error("Error saving tool evaluation:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid evaluation data" });
      }
      res.status(500).json({ message: "Failed to save tool evaluation" });
    }
  });

  app.post("/api/discovery/tools/:id/add", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = uuidParamSchema.parse(req.params);
      
      // In a real implementation, this would:
      // 1. Fetch discovered tool by ID
      // 2. Convert to regular tool
      // 3. Add to user's stack
      // 4. Create cost snapshot
      
      // Mock response for now
      const addedTool = {
        id: crypto.randomUUID(),
        userId: req.user!.id,
        toolId: id,
        monthlyCost: req.body.monthlyCost || "0",
        quantity: 1,
        isActive: true,
        addedAt: new Date().toISOString(),
      };

      res.status(201).json(addedTool);
    } catch (error) {
      console.error("Error adding discovered tool to stack:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid tool ID format" });
      }
      res.status(500).json({ message: "Failed to add tool to stack" });
    }
  });

  app.get("/api/discovery/categories", async (req, res) => {
    try {
      // In a real implementation, this would fetch from storage
      const categories = [
        { id: "frontend", name: "Frontend", slug: "frontend", description: "User interface frameworks and libraries", toolCount: 45 },
        { id: "backend", name: "Backend", slug: "backend", description: "Server-side frameworks and APIs", toolCount: 67 },
        { id: "database", name: "Database", slug: "database", description: "Data storage and management solutions", toolCount: 23 },
        { id: "devops", name: "DevOps", slug: "devops", description: "Development operations and deployment tools", toolCount: 34 },
        { id: "testing", name: "Testing", slug: "testing", description: "Testing frameworks and quality assurance tools", toolCount: 28 },
        { id: "monitoring", name: "Monitoring", slug: "monitoring", description: "Application monitoring and observability", toolCount: 19 },
        { id: "security", name: "Security", slug: "security", description: "Security tools and authentication", toolCount: 15 },
        { id: "machine-learning", name: "Machine Learning", slug: "machine-learning", description: "AI and machine learning frameworks", toolCount: 31 },
        { id: "data-science", name: "Data Science", slug: "data-science", description: "Data analysis and visualization tools", toolCount: 22 },
      ];

      res.json(categories);
    } catch (error) {
      console.error("Error fetching discovery categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/discovery/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // In a real implementation, this would fetch from storage
      const preferences = {
        id: crypto.randomUUID(),
        userId: req.user!.id,
        enableTrendingAlerts: true,
        enableNewToolAlerts: false,
        enableWeeklyDigest: true,
        preferredCategories: ["frontend", "backend"],
        excludedCategories: [],
        preferredLanguages: ["javascript", "typescript"],
        preferredLicenses: ["MIT", "Apache-2.0"],
        maxCostThreshold: 100,
        minPopularityThreshold: 0.5,
        enablePersonalizedRecommendations: true,
        recommendationFrequency: "weekly",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching discovery preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put("/api/discovery/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updates = updateDiscoveryPreferencesSchema.parse(req.body);
      
      // In a real implementation, this would update in storage
      const updatedPreferences = {
        id: crypto.randomUUID(),
        userId: req.user!.id,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating discovery preferences:", error);
      if (isZodError(error)) {
        return res.status(400).json({ message: "Invalid preference data" });
      }
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.get("/api/discovery/statistics", async (req, res) => {
    try {
      // In a real implementation, this would calculate from storage
      const statistics = {
        totalDiscoveredTools: 1247,
        toolsByCategory: [
          { category: "frontend", count: 156 },
          { category: "backend", count: 203 },
          { category: "database", count: 89 },
          { category: "devops", count: 134 },
          { category: "testing", count: 78 },
          { category: "monitoring", count: 45 },
          { category: "security", count: 67 },
          { category: "machine-learning", count: 123 },
          { category: "data-science", count: 98 },
        ],
        toolsBySourceType: [
          { sourceType: "npm", count: 456 },
          { sourceType: "github", count: 389 },
          { sourceType: "pypi", count: 234 },
          { sourceType: "docker", count: 168 },
        ],
        toolsByLanguage: [
          { language: "javascript", count: 298 },
          { language: "python", count: 267 },
          { language: "typescript", count: 198 },
          { language: "go", count: 134 },
          { language: "rust", count: 89 },
          { language: "java", count: 156 },
        ],
        recentlyDiscovered: 23, // Last 7 days
        activeSessions: 0,
        lastDiscoveryRun: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };

      res.json(statistics);
    } catch (error) {
      console.error("Error fetching discovery statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Enhanced Stack Intelligence with Discovery Integration
  app.get("/api/stack/enhanced-analysis", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.user!.id);
      const userTools = await storage.getUserTools(req.user!.id);
      const currentStack = userTools.map(ut => ut.tool.name);
      
      // Get traditional stack analysis
      const stackAnalysis = await storage.analyzeStackMaturity(req.user!.id);
      
      // Get discovery-based recommendations
      const userLanguages = user?.preferredCategories || [];
      const userCategories = user?.preferredCategories || [];
      
      const discoveryRecommendations = await discoveryEngine.generateRecommendations(
        currentStack,
        userCategories,
        userLanguages,
        user?.teamSize || undefined,
        user?.industry || undefined
      );
      const recommendationItems = discoveryRecommendations.items;

      // Integrate trending tools relevant to user's stack
      const { tools: relevantTrending } = await discoveryEngine.discoverTrendingTools(
        { maxToolsPerSource: 5 },
        userCategories.length > 0 ? userCategories : undefined
      );

      // Get alternative tools for current stack
      const alternatives = await Promise.all(
        currentStack.slice(0, 3).map(async (toolName) => {
          const category = userTools.find(ut => ut.tool.name === toolName)?.tool.category || 'general';
          return {
            currentTool: toolName,
            alternatives: (await discoveryEngine.getToolAlternatives(toolName, category, 3)).map(mapToDiscoveryToolSummary)
          };
        })
      );

      const enhancedAnalysis = {
        traditional: stackAnalysis,
        discovery: {
          personalizedRecommendations: recommendationItems.slice(0, 8),
          trendingInYourDomain: relevantTrending.slice(0, 6),
          alternatives: alternatives.filter(alt => alt.alternatives.length > 0),
          stackInsights: {
            modernizationOpportunities: relevantTrending.filter(tool => 
              getDiscoveryPopularityScore(tool) >= 70 && !currentStack.includes(tool.name)
            ).length,
            emergingTechnologies: relevantTrending.filter(tool => {
              const lastUpdated = getDiscoveryLastUpdatedDate(tool);
              if (!lastUpdated) {
                return false;
              }
              return lastUpdated > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            }).length,
            costOptimizationPotential: alternatives.reduce((total, alt) => 
              total + alt.alternatives.filter(a => getDiscoveryPricingModel(a) === 'free').length, 0
            )
          }
        },
        combinedScore: {
          maturity: stackAnalysis.overallScore || 0.7,
          innovation: Math.min(0.3 + (relevantTrending.length * 0.1), 1.0),
          costEfficiency: Math.max(0.5, 1.0 - (userTools.length * 0.05)),
        }
      };

      res.json(enhancedAnalysis);
    } catch (error) {
      console.error("Error generating enhanced stack analysis:", error);
      res.status(500).json({ message: "Failed to generate enhanced analysis" });
    }
  });

  // Discovery-Enhanced Cost Impact Analysis
  app.post("/api/discovery/cost-impact", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { discoveredToolIds } = req.body;
      
      if (!Array.isArray(discoveredToolIds) || discoveredToolIds.length === 0) {
        return res.status(400).json({ message: "discoveredToolIds array is required" });
      }

      const userTools = await storage.getUserTools(req.user!.id);
      const currentCost = userTools.reduce((sum, ut) => sum + parseFloat(ut.monthlyCost || "0"), 0);
      const baselineAverageCost = userTools.length > 0 ? currentCost / userTools.length : 50;

      const createSyntheticSummary = (id: string): DiscoveryToolSummary => {
        const pricing = randomFrom(['free', 'freemium', 'paid', 'enterprise']);
        const category = randomFrom(['frontend', 'backend', 'database', 'devops', 'testing', 'monitoring']);
        const difficulty = randomFrom(['beginner', 'intermediate', 'expert']);
        const estimatedMonthlyCost = pricing === 'free' ? 0 : Math.floor(Math.random() * 90) + 15;

        const syntheticSource: DiscoveryToolSource = {
          name: `Tool-${id}`,
          description: `Synthetic cost analysis candidate for ${id}`,
          category,
          sourceType: 'synthetic',
          sourceId: id,
          sourceUrl: null,
          repositoryUrl: null,
          documentationUrl: null,
          homepageUrl: null,
          languages: [],
          frameworks: [],
          tags: [],
          keywords: [],
          pricingModel: pricing,
          costCategory: pricing === 'free' ? 'free' : 'paid',
          estimatedMonthlyCost,
          difficultyLevel: difficulty,
          popularityScore: Math.round(Math.random() * 100),
          trendingScore: Math.round(Math.random() * 100),
          qualityScore: Math.round(Math.random() * 100),
          githubStars: null,
          githubForks: null,
          npmWeeklyDownloads: null,
          dockerPulls: null,
          packageDownloads: null,
          discoveredAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          lastScanned: null,
          metrics: null,
          evaluation: null,
        };

        return mapToDiscoveryToolSummary(syntheticSource);
      };

      // TODO: replace synthetic fallback once storage exposes a bulk getDiscoveredToolsByIds helper.
      const discoveredTools = await Promise.all(
        discoveredToolIds.map(async (id) => {
          try {
            const existing = await storage.getDiscoveredTool(id);
            if (existing) {
              return mapStoredDiscoveredTool(existing);
            }
          } catch (error) {
            console.warn(`Failed to load discovered tool ${id}:`, error);
          }
          return createSyntheticSummary(id);
        })
      );

      const toolFinancials = discoveredTools.map(summary => {
        const monthlyCost = getDiscoveryMonthlyCost(summary);
        const pricingModel = getDiscoveryPricingModel(summary);
        const potentialSavings = pricingModel === 'free'
          ? Math.min(baselineAverageCost, monthlyCost || baselineAverageCost)
          : Math.round(monthlyCost * 0.25);

        return {
          summary,
          pricingModel,
          monthlyCost,
          potentialSavings,
        };
      });

      const totalEstimatedCost = toolFinancials.reduce((sum, tool) => sum + tool.monthlyCost, 0);
      const totalPotentialSavings = toolFinancials.reduce((sum, tool) => sum + tool.potentialSavings, 0);
      const netCostImpact = totalEstimatedCost - totalPotentialSavings;

      const costImpactAnalysis = {
        currentMonthlyCost: currentCost,
        estimatedAdditionalCost: totalEstimatedCost,
        potentialSavings: totalPotentialSavings,
        netCostImpact,
        projectedMonthlyCost: currentCost + netCostImpact,
        costChangePercentage: currentCost > 0 ? (netCostImpact / currentCost) * 100 : 0,
        tools: toolFinancials,
        recommendations: {
          budgetFriendly: toolFinancials.filter(t => t.monthlyCost <= 25),
          highROI: toolFinancials.filter(t => t.potentialSavings >= t.monthlyCost * 0.3),
          riskLevel: netCostImpact > currentCost * 0.5 ? 'high' : netCostImpact > currentCost * 0.2 ? 'medium' : 'low'
        }
      };

      res.json(costImpactAnalysis);
    } catch (error) {
      console.error("Error analyzing cost impact:", error);
      res.status(500).json({ message: "Failed to analyze cost impact" });
    }
  });

  // Stack Optimization with Discovery Intelligence
  app.get("/api/stack/optimization-suggestions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.user!.id);
      const userTools = await storage.getUserTools(req.user!.id);
      const currentStack = userTools.map(ut => ut.tool.name);
      
      // Get redundancies from traditional analysis
      const redundancies = await storage.getStackRedundancies(req.user!.id);
      const compatibility = await storage.checkCompatibilityIssues(req.user!.id);
      
      // Get discovery-based optimization suggestions
      const optimizationSuggestions = await Promise.all([
        // Modern alternatives for existing tools
        discoveryEngine.getStackCompatibleTools(currentStack, 'frontend', 3),
        discoveryEngine.getStackCompatibleTools(currentStack, 'backend', 3),
        discoveryEngine.getStackCompatibleTools(currentStack, 'devops', 3),
      ]);

      const modernAlternatives = optimizationSuggestions
        .flat()
        .map(tool => (tool && typeof tool === 'object' && 'provenance' in tool ? tool : mapToDiscoveryToolSummary(tool)))
        .filter(tool =>
          !currentStack.includes(tool.name) && getDiscoveryPopularityScore(tool) >= 60
        );

      // Cost optimization opportunities
      const costOptimizations = userTools.map(ut => {
        const currentCost = parseFloat(ut.monthlyCost || "0");
        const freeAlternatives = modernAlternatives.filter(alt => 
          alt.category === ut.tool.category && getDiscoveryPricingModel(alt) === 'free'
        );
        
        return {
          currentTool: ut.tool.name,
          currentCost,
          category: ut.tool.category,
          freeAlternatives: freeAlternatives.slice(0, 2),
          potentialSavings: freeAlternatives.length > 0 ? currentCost : 0
        };
      }).filter(opt => opt.potentialSavings > 0);

      // Security and maintenance updates
      const maintenanceAlerts = userTools.filter(ut => {
        // Mock logic - in real implementation, check last updated dates, known vulnerabilities
        return Math.random() < 0.2; // 20% chance of maintenance alert
      }).map(ut => ({
        tool: ut.tool.name,
        issue: 'Outdated version detected',
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        recommendedAction: 'Update to latest version',
        modernAlternatives: modernAlternatives.filter(alt => alt.category === ut.tool.category).slice(0, 2)
      }));

      const optimizationReport = {
        traditional: {
          redundancies: redundancies || [],
          compatibilityIssues: compatibility || []
        },
        discovery: {
          modernAlternatives: modernAlternatives.slice(0, 8),
          costOptimizations,
          maintenanceAlerts,
          trendingUpgrades: modernAlternatives.filter(alt => {
            const lastUpdated = getDiscoveryLastUpdatedDate(alt);
            if (!lastUpdated) {
              return false;
            }
            return (
              getDiscoveryPopularityScore(alt) >= 80 &&
              lastUpdated > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
            );
          }).slice(0, 4)
        },
        summary: {
          totalOptimizationOpportunities: costOptimizations.length + maintenanceAlerts.length + modernAlternatives.length,
          potentialMonthlySavings: costOptimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0),
          modernizationScore: Math.min(modernAlternatives.length * 0.1, 1.0),
          urgentActions: maintenanceAlerts.filter(alert => alert.severity === 'high').length
        }
      };

      res.json(optimizationReport);
    } catch (error) {
      console.error("Error generating optimization suggestions:", error);
      res.status(500).json({ message: "Failed to generate optimization suggestions" });
    }
  });

  // Discovery-Informed Budget Planning
  app.post("/api/budget/discovery-planning", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { targetBudget, timeframe = 6 } = req.body; // Default 6 months planning
      
      if (!targetBudget || isNaN(parseFloat(targetBudget))) {
        return res.status(400).json({ message: "Valid target budget is required" });
      }

      const user = await storage.getUser(req.user!.id);
      const userTools = await storage.getUserTools(req.user!.id);
      const currentCost = userTools.reduce((sum, ut) => sum + parseFloat(ut.monthlyCost || "0"), 0);
      const budgetLimit = parseFloat(targetBudget);
      const availableBudget = budgetLimit - currentCost;

      // Get budget-constrained recommendations from discovery
      const userStack = userTools.map(ut => ut.tool.name);
      const userCategories = user?.preferredCategories || [];
      
      const recommendationResult = await discoveryEngine.generateRecommendations(
        userStack,
        userCategories,
        user?.preferredCategories || [],
        user?.teamSize || undefined,
        user?.industry || undefined
      );
      const allRecommendations = recommendationResult.items;

      // Categorize tools by estimated cost
      const budgetPlan = {
        immediate: [], // Free tools that can be added now
        shortTerm: [], // Low-cost tools for next 3 months
        longTerm: [], // Higher-cost tools for 3-6 months
        futureConsideration: [], // Tools that exceed current budget planning
      };

      allRecommendations.forEach(tool => {
        const pricingModel = getDiscoveryPricingModel(tool);
        const estimatedCost = getDiscoveryMonthlyCost(tool);
        const toolWithCost = { ...tool, pricingModel, estimatedCost };

        if (estimatedCost === 0) {
          budgetPlan.immediate.push(toolWithCost);
        } else if (estimatedCost <= availableBudget * 0.3) {
          budgetPlan.shortTerm.push(toolWithCost);
        } else if (estimatedCost <= availableBudget * 0.7) {
          budgetPlan.longTerm.push(toolWithCost);
        } else {
          budgetPlan.futureConsideration.push(toolWithCost);
        }
      });

      // Calculate phased adoption plan
      const phasedPlan = {
        phase1: { // Month 1-2
          tools: [...budgetPlan.immediate.slice(0, 3), ...budgetPlan.shortTerm.slice(0, 2)],
          estimatedCost: budgetPlan.shortTerm.slice(0, 2).reduce((sum, t) => sum + t.estimatedCost, 0),
          focus: "Free tools and low-cost essentials"
        },
        phase2: { // Month 3-4
          tools: [...budgetPlan.shortTerm.slice(2, 4), ...budgetPlan.longTerm.slice(0, 1)],
          estimatedCost: [...budgetPlan.shortTerm.slice(2, 4), ...budgetPlan.longTerm.slice(0, 1)]
            .reduce((sum, t) => sum + t.estimatedCost, 0),
          focus: "Productivity and efficiency tools"
        },
        phase3: { // Month 5-6
          tools: budgetPlan.longTerm.slice(1, 3),
          estimatedCost: budgetPlan.longTerm.slice(1, 3).reduce((sum, t) => sum + t.estimatedCost, 0),
          focus: "Advanced capabilities and optimization"
        }
      };

      const budgetingPlan = {
        current: {
          monthlyCost: currentCost,
          budget: budgetLimit,
          availableBudget
        },
        recommendations: budgetPlan,
        phasedAdoption: phasedPlan,
        projections: {
          month3Cost: currentCost + phasedPlan.phase1.estimatedCost + phasedPlan.phase2.estimatedCost,
          month6Cost: currentCost + phasedPlan.phase1.estimatedCost + phasedPlan.phase2.estimatedCost + phasedPlan.phase3.estimatedCost,
          budgetUtilization: {
            month3: ((currentCost + phasedPlan.phase1.estimatedCost + phasedPlan.phase2.estimatedCost) / budgetLimit) * 100,
            month6: ((currentCost + phasedPlan.phase1.estimatedCost + phasedPlan.phase2.estimatedCost + phasedPlan.phase3.estimatedCost) / budgetLimit) * 100
          }
        },
        insights: {
          freeToolsAvailable: budgetPlan.immediate.length,
          averageToolCost: allRecommendations.length > 0 ?
            allRecommendations.reduce((sum, t) => sum + getDiscoveryMonthlyCost(t), 0) / allRecommendations.length : 0,
          budgetConstraints: availableBudget < 50 ? "tight" : availableBudget < 200 ? "moderate" : "comfortable"
        }
      };

      res.json(budgetingPlan);
    } catch (error) {
      console.error("Error generating discovery budget plan:", error);
      res.status(500).json({ message: "Failed to generate budget plan" });
    }
  });

  // ============================================================================
  // PROJECT PLANNING API ENDPOINTS
  // ============================================================================

  // Core Project Management
  app.get("/api/projects", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { status, projectType, priority, limit, offset } = req.query;
      const filters = {
        status: status as string,
        projectType: projectType as string,
        priority: priority as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const projects = await storage.getUserProjects(req.user.id, filters);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Validate request body
      const validatedData = insertProjectSchema.parse(req.body);

      const projectData = {
        ...validatedData,
        userId: req.user.id,
        ownerId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate request body
      const validatedUpdates = insertProjectSchema.partial().parse(req.body);

      const updates = {
        ...validatedUpdates,
        updatedAt: new Date(),
        lastActivityAt: new Date()
      };

      const project = await storage.updateProject(id, updates);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      if (isZodError(error)) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project Timeline Management
  app.get("/api/projects/:id/timeline", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const timelines = await storage.getProjectTimelines(id);
      res.json(timelines);
    } catch (error) {
      console.error("Error fetching project timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  app.post("/api/projects/:id/timeline/calculate", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get project data
      const [tasks, phases, milestones] = await Promise.all([
        storage.getUserTasks(req.user.id), // Simplified - would filter by project
        storage.getProjectPhases(id),
        storage.getProjectMilestones(id)
      ]);

      const dependencies = []; // Would get from storage
      const timelineResult = await timelineEngine.calculateProjectTimeline(
        id, tasks, dependencies, phases, milestones
      );

      res.json(timelineResult);
    } catch (error) {
      console.error("Error calculating timeline:", error);
      res.status(500).json({ message: "Failed to calculate timeline" });
    }
  });

  app.get("/api/projects/:id/gantt", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const ganttData = await storage.getGanttChartData(id);
      res.json(ganttData);
    } catch (error) {
      console.error("Error fetching Gantt data:", error);
      res.status(500).json({ message: "Failed to fetch Gantt chart data" });
    }
  });

  // Resource Management
  app.get("/api/projects/:id/resources", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { resourceType } = req.query;
      const resources = await storage.getProjectResources(id, resourceType as string);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching project resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.post("/api/projects/:id/resources", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const resourceData = {
        ...req.body,
        projectId: id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const resource = await storage.createProjectResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating project resource:", error);
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  app.get("/api/resources/optimization", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userResources = await storage.getUserResourceAllocations(req.user.id);
      const userProjects = await storage.getUserProjects(req.user.id);
      const userTasks = await storage.getUserTasks(req.user.id);

      // Extract resources for optimization
      const resources = userResources.map(ur => ({
        id: ur.id,
        resourceId: ur.resourceId,
        resourceName: ur.resourceName,
        resourceType: ur.resourceType,
        projectId: ur.project.id,
        allocationPercentage: ur.allocationPercentage,
        totalHoursAllocated: ur.totalHoursAllocated,
        hoursUsed: ur.hoursUsed,
        availableFrom: ur.availableFrom,
        availableUntil: ur.availableUntil,
        hourlyRate: ur.hourlyRate,
        requiredSkills: ur.requiredSkills,
        isActive: ur.isActive
      }));

      const optimization = await resourceOptimizer.optimizeResourceAllocation(
        resources, userTasks, userProjects
      );

      res.json(optimization);
    } catch (error) {
      console.error("Error optimizing resources:", error);
      res.status(500).json({ message: "Failed to optimize resources" });
    }
  });

  app.get("/api/resources/utilization", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { startDate, endDate } = req.query;
      const userResources = await storage.getUserResourceAllocations(req.user.id);
      
      // Extract unique resources
      const resources = userResources.map(ur => ({
        id: ur.id,
        resourceId: ur.resourceId,
        resourceName: ur.resourceName,
        resourceType: ur.resourceType,
        allocationPercentage: ur.allocationPercentage,
        totalHoursAllocated: ur.totalHoursAllocated,
        hoursUsed: ur.hoursUsed,
        availableFrom: ur.availableFrom,
        availableUntil: ur.availableUntil,
        hourlyRate: ur.hourlyRate,
        isActive: ur.isActive
      }));

      const dateRange = {
        start: startDate ? new Date(startDate as string) : new Date(),
        end: endDate ? new Date(endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const utilization = await resourceOptimizer.analyzeResourceUtilization(resources, dateRange);
      res.json(utilization);
    } catch (error) {
      console.error("Error analyzing resource utilization:", error);
      res.status(500).json({ message: "Failed to analyze utilization" });
    }
  });

  // Budget Management
  app.get("/api/projects/:id/budget", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const budgets = await storage.getProjectBudgets(id);
      const summary = await storage.getBudgetSummary(id);
      
      res.json({ budgets, summary });
    } catch (error) {
      console.error("Error fetching project budget:", error);
      res.status(500).json({ message: "Failed to fetch budget" });
    }
  });

  app.post("/api/projects/:id/budget", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const budgetData = {
        ...req.body,
        projectId: id,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      const budget = await storage.createProjectBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating project budget:", error);
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  app.post("/api/projects/:id/budget/estimate", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get project data
      const [project, tasks, resources, budgets] = await Promise.all([
        storage.getProject(id),
        storage.getUserTasks(req.user.id), // Would filter by project
        storage.getProjectResources(id),
        storage.getProjectBudgets(id)
      ]);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const marketRates = new Map([
        ['developer', 75],
        ['designer', 65],
        ['project_manager', 85],
        ['qa_engineer', 60],
        ['devops', 80]
      ]);

      const estimation = await budgetCalculator.estimateProjectBudget(
        project, tasks, resources, marketRates
      );

      res.json(estimation);
    } catch (error) {
      console.error("Error estimating project budget:", error);
      res.status(500).json({ message: "Failed to estimate budget" });
    }
  });

  app.post("/api/projects/:id/budget/forecast", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      const { projectProgress = 50 } = req.body;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const budgets = await storage.getProjectBudgets(id);
      const timeline = {
        start: project.startDate || new Date(),
        plannedEnd: project.targetEndDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        currentDate: new Date()
      };

      const forecast = await budgetCalculator.generateBudgetForecast(
        id, budgets, projectProgress, timeline
      );

      res.json(forecast);
    } catch (error) {
      console.error("Error generating budget forecast:", error);
      res.status(500).json({ message: "Failed to generate forecast" });
    }
  });

  // Milestone Management
  app.get("/api/projects/:id/milestones", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const milestones = await storage.getProjectMilestones(id);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching project milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.post("/api/projects/:id/milestones", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const milestoneData = {
        ...req.body,
        projectId: id,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const milestone = await storage.createProjectMilestone(milestoneData);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  app.get("/api/milestones/upcoming", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { days = 30 } = req.query;
      const daysAhead = parseInt(days as string);

      const upcomingMilestones = await storage.getUpcomingMilestones(req.user.id, daysAhead);
      res.json(upcomingMilestones);
    } catch (error) {
      console.error("Error fetching upcoming milestones:", error);
      res.status(500).json({ message: "Failed to fetch upcoming milestones" });
    }
  });

  // Project Phase Management
  app.get("/api/projects/:id/phases", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const phases = await storage.getProjectPhases(id);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching project phases:", error);
      res.status(500).json({ message: "Failed to fetch phases" });
    }
  });

  app.post("/api/projects/:id/phases", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const phaseData = {
        ...req.body,
        projectId: id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const phase = await storage.createProjectPhase(phaseData);
      res.status(201).json(phase);
    } catch (error) {
      console.error("Error creating project phase:", error);
      res.status(500).json({ message: "Failed to create phase" });
    }
  });

  // Risk Assessment
  app.get("/api/projects/:id/risks", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get project data
      const [project, tasks, resources, budgets] = await Promise.all([
        storage.getProject(id),
        storage.getUserTasks(req.user.id), // Would filter by project
        storage.getProjectResources(id),
        storage.getProjectBudgets(id)
      ]);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const riskAssessment = await riskAnalyzer.assessProjectRisks(
        project, tasks, resources, budgets
      );

      res.json(riskAssessment);
    } catch (error) {
      console.error("Error assessing project risks:", error);
      res.status(500).json({ message: "Failed to assess risks" });
    }
  });

  // Project Templates
  app.get("/api/project-templates", async (req, res) => {
    try {
      const { category, templateType, isPublic, limit } = req.query;
      
      const filters = {
        category: category as string,
        templateType: templateType as string,
        isPublic: isPublic ? isPublic === 'true' : undefined,
        createdBy: req.user?.id,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const templates = await storage.getProjectTemplates(filters);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching project templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/project-templates", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const templateData = {
        ...req.body,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const template = await storage.createProjectTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating project template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.post("/api/project-templates/:id/create-project", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      const { projectName, customizations = {} } = req.body;

      if (!projectName) {
        return res.status(400).json({ message: "Project name is required" });
      }

      const project = await storage.createProjectFromTemplate(
        id, req.user.id, projectName, customizations
      );

      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project from template:", error);
      if (error instanceof Error && error.message === 'Template not found') {
        return res.status(404).json({ message: "Template not found" });
      }
      res.status(500).json({ message: "Failed to create project from template" });
    }
  });

  // Portfolio Analytics
  app.get("/api/projects/analytics/portfolio", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const portfolioAnalytics = await storage.getPortfolioAnalytics(req.user.id);
      res.json(portfolioAnalytics);
    } catch (error) {
      console.error("Error fetching portfolio analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/projects/analytics/overview", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const portfolioOverview = await storage.getPortfolioOverview(req.user.id);
      res.json(portfolioOverview);
    } catch (error) {
      console.error("Error fetching portfolio overview:", error);
      res.status(500).json({ message: "Failed to fetch overview" });
    }
  });

  // Comprehensive Project Planning
  app.post("/api/projects/:id/comprehensive-plan", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const isOwner = await storage.verifyProjectOwnership(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get project data
      const [project, tasks, resources, budgets, phases, milestones] = await Promise.all([
        storage.getProject(id),
        storage.getUserTasks(req.user.id), // Would filter by project
        storage.getProjectResources(id),
        storage.getProjectBudgets(id),
        storage.getProjectPhases(id),
        storage.getProjectMilestones(id)
      ]);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const options = {
        optimization: {
          prioritize: req.body.prioritize || 'balanced',
          aggressiveness: req.body.aggressiveness || 'moderate',
          constraints: req.body.constraints || []
        },
        analysis: {
          includeAlternatives: req.body.includeAlternatives ?? true,
          alternativeCount: req.body.alternativeCount || 3,
          scenarioAnalysis: req.body.scenarioAnalysis ?? true,
          sensitivityAnalysis: req.body.sensitivityAnalysis ?? false
        },
        detail: {
          planningHorizon: req.body.planningHorizon || 6,
          updateFrequency: req.body.updateFrequency || 'weekly',
          granularity: req.body.granularity || 'medium',
          includeOperational: req.body.includeOperational ?? true
        }
      };

      const context = {
        organizationInfo: {
          size: req.body.organizationSize || 'small',
          industry: req.body.industry || 'technology',
          maturity: req.body.maturity || 'developing',
          culture: req.body.culture || 'agile'
        },
        projectContext: {
          strategicImportance: req.body.strategicImportance || 'medium',
          stakeholderCount: req.body.stakeholderCount || 5,
          regulatoryRequirements: req.body.regulatoryRequirements ?? false,
          publicVisibility: req.body.publicVisibility ?? false,
          innovation: req.body.innovation || 'incremental'
        },
        environmentalFactors: {
          marketVolatility: req.body.marketVolatility || 'medium',
          technologyStability: req.body.technologyStability || 'stable',
          competitivePressure: req.body.competitivePressure || 'medium',
          economicConditions: req.body.economicConditions || 'stable'
        }
      };

      const comprehensivePlan = await projectPlanner.createComprehensiveProjectPlan(
        project, tasks, resources, budgets, phases, milestones, options, context
      );

      res.json(comprehensivePlan);
    } catch (error) {
      console.error("Error creating comprehensive project plan:", error);
      res.status(500).json({ message: "Failed to create comprehensive plan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to create cost snapshots
async function createCostSnapshot(userId: string) {
  try {
    const userTools = await storage.getUserTools(userId);
    const totalCost = userTools.reduce((sum, item) => {
      const cost = parseFloat(item.monthlyCost || "0");
      return sum + cost;
    }, 0);

    const snapshot = insertCostSnapshotSchema.parse({
      userId,
      totalCost: totalCost.toString()
    });

    await storage.createCostSnapshot(snapshot);
  } catch (error) {
    console.error("Error creating cost snapshot:", error);
  }
}

async function importToolsFromCSV() {
  try {
    const csvPath = path.resolve(process.cwd(), "attached_assets", "tools (1)_1758015589276.csv");
    
    if (!fs.existsSync(csvPath)) {
      console.log("Tools CSV file not found, skipping import");
      return;
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
    
    const tools = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line handling quoted values
      const values = [];
      let current = "";
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length >= headers.length) {
        const tool = {
          id: values[0].replace(/"/g, ""),
          name: values[1].replace(/"/g, ""),
          description: values[2].replace(/"/g, ""),
          category: values[3].replace(/"/g, ""),
          url: values[4].replace(/"/g, ""),
          frameworks: values[5].replace(/"/g, ""),
          languages: values[6].replace(/"/g, ""),
          features: values[7].replace(/"/g, ""),
          integrations: values[8].replace(/"/g, ""),
          maturityScore: values[9].replace(/"/g, "") || null,
          popularityScore: values[10].replace(/"/g, "") || null,
          pricing: values[11].replace(/"/g, ""),
          notes: values[12].replace(/"/g, ""),
        };
        
        tools.push(tool);
      }
    }
    
    await storage.importTools(tools);
    console.log(`Imported ${tools.length} tools from CSV`);
  } catch (error) {
    console.error("Error importing tools from CSV:", error);
  }
}








