import { 
  users, 
  tools, 
  userTools, 
  savedIdeas, 
  costSnapshots, 
  techRoadmaps,
  projectTasks,
  taskGenerations,
  taskDependencies,
  taskCategories,
  // Enhanced project planning tables
  projects,
  projectPhases,
  projectMilestones,
  projectResources,
  projectBudgets,
  projectTimelines,
  projectTemplates,
  projectAnalytics,
  // Documentation tables
  docCategories,
  docTags,
  documentationArticles,
  docArticleTags,
  userDocBookmarks,
  docSearchHistory,
  docRatings,
  docViews,
  // Discovery tables
  discoveredTools,
  toolDiscoverySessions,
  externalToolData,
  toolPopularityMetrics,
  discoveryCategories,
  userDiscoveryPreferences,
  discoveredToolEvaluations,
  type User, 
  type InsertUser, 
  type Tool, 
  type InsertTool, 
  type UserTool, 
  type InsertUserTool, 
  type SavedIdea, 
  type InsertSavedIdea, 
  type CostSnapshot, 
  type InsertCostSnapshot, 
  type TechRoadmap, 
  type InsertTechRoadmap, 
  type UserContextUpdate, 
  type UserAIContext, 
  type OptimizationSeverity, 
  type RecommendationImportance, 
  type OnboardingProfile, 
  type OnboardingStatusUpdate, 
  type OnboardingStatus, 
  type OnboardingStackTemplate,
  type ProjectTask,
  type InsertProjectTask,
  type UpdateProjectTask,
  type TaskGeneration,
  type InsertTaskGeneration,
  type TaskDependency,
  type InsertTaskDependency,
  type TaskCategory,
  type InsertTaskCategory,
  type TaskMetrics,
  type ProjectTaskWithDependencies,
  // Enhanced project planning types
  type Project,
  type InsertProject,
  type ProjectPhase,
  type InsertProjectPhase,
  type ProjectMilestone,
  type InsertProjectMilestone,
  type ProjectResource,
  type InsertProjectResource,
  type ProjectBudget,
  type InsertProjectBudget,
  type ProjectTimeline,
  type InsertProjectTimeline,
  type ProjectTemplate,
  type InsertProjectTemplate,
  type ProjectAnalytics,
  type InsertProjectAnalytics,
  // Documentation types
  type DocCategory,
  type InsertDocCategory,
  type DocTag,
  type InsertDocTag,
  type DocumentationArticle,
  type InsertDocumentationArticle,
  type DocArticleTag,
  type InsertDocArticleTag,
  type UserDocBookmark,
  type InsertUserDocBookmark,
  type DocSearchHistory,
  type InsertDocSearchHistory,
  type DocRating,
  type InsertDocRating,
  type DocView,
  type InsertDocView,
  type DocumentationArticleWithDetails,
  type DocSearchResult,
  type DocSearchResponse,
  type DocCategoryWithStats,
  type DocSearchRequest,
  // Discovery types
  type DiscoveredTool,
  type InsertDiscoveredTool,
  type ToolDiscoverySession,
  type InsertToolDiscoverySession,
  type ExternalToolData,
  type InsertExternalToolData,
  type ToolPopularityMetric,
  type InsertToolPopularityMetric,
  type DiscoveryCategory,
  type InsertDiscoveryCategory,
  type UserDiscoveryPreference,
  type InsertUserDiscoveryPreference,
  type DiscoveredToolEvaluation,
  type InsertDiscoveredToolEvaluation,
  type DiscoveredToolWithMetrics,
  type TrendingToolsResponse,
  type DiscoverySearchResponse,
  type ToolRecommendationsResponse,
  type DiscoverySessionStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, like, ilike, count, avg, exists, inArray, or, isNull } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import session from "express-session";
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
  getUserToolById(id: string): Promise<UserTool | undefined>;
  verifyUserToolOwnership(userToolId: string, userId: string): Promise<boolean>;
  
  // Usage tracking operations
  markToolAsUsed(userToolId: string): Promise<UserTool | undefined>;
  toggleToolActiveStatus(userToolId: string, isActive: boolean): Promise<UserTool | undefined>;
  getDormantTools(userId: string, daysSinceLastUse?: number): Promise<(UserTool & { tool: Tool })[]>;
  
  // Saved ideas operations
  getSavedIdeas(userId: string): Promise<SavedIdea[]>;
  createSavedIdea(idea: InsertSavedIdea): Promise<SavedIdea>;
  deleteSavedIdea(id: string): Promise<void>;
  verifySavedIdeaOwnership(ideaId: string, userId: string): Promise<boolean>;
  
  // Budget operations
  updateUserBudget(userId: string, monthlyBudget: string): Promise<User | undefined>;
  
  // Cost snapshot operations
  createCostSnapshot(snapshot: InsertCostSnapshot): Promise<CostSnapshot>;
  getCostSnapshots(userId: string, limit?: number): Promise<CostSnapshot[]>;
  
  // Stack intelligence operations
  analyzeStackRedundancies(userId: string): Promise<{
    redundancies: Array<{
      category: string;
      tools: Array<UserTool & { tool: Tool }>;
      severity: OptimizationSeverity;
      potentialSavings: number;
      recommendation: string;
      reason: string;
    }>;
    totalPotentialSavings: number;
  }>;
  findMissingStackPieces(userId: string): Promise<{
    missing: Array<{
      category: string;
      importance: RecommendationImportance;
      reason: string;
      suggestedTools: Tool[];
      benefits: string;
    }>;
    essentialCategories: string[];
    stackCompleteness: number;
  }>;
  checkCompatibilityIssues(userId: string): Promise<{
    issues: Array<{
      type: 'security_risk' | 'compatibility_conflict' | 'deprecation_notice' | 'integration_opportunity';
      toolIds: string[];
      toolNames: string[];
      severity: OptimizationSeverity;
      description: string;
      recommendation: string;
      impact: string;
    }>;
    riskScore: number;
  }>;
  generateStackRecommendations(userId: string): Promise<{
    recommendations: Array<{
      type: 'add_tool' | 'remove_tool' | 'replace_tool' | 'optimize_cost';
      priority: OptimizationSeverity;
      category: string;
      title: string;
      description: string;
      suggestedTools?: Tool[];
      potentialSavings?: number;
      reasoning: string;
      benefits?: string;
    }>;
    stackHealthScore: number;
    optimizationScore: number;
  }>;
  
  // User context operations
  getUserAIContext(userId: string): Promise<UserAIContext>;
  updateUserContext(userId: string, context: UserContextUpdate): Promise<User | undefined>;
  
  // Onboarding operations
  getOnboardingStatus(userId: string): Promise<OnboardingStatus>;
  updateOnboardingStatus(userId: string, updates: OnboardingStatusUpdate): Promise<User | undefined>;
  updateOnboardingProfile(userId: string, profile: OnboardingProfile): Promise<User | undefined>;
  getOnboardingTemplates(): Promise<OnboardingStackTemplate[]>;
  skipOnboarding(userId: string): Promise<User | undefined>;
  completeOnboarding(userId: string): Promise<User | undefined>;
  
  // Tech roadmap operations
  createTechRoadmap(roadmap: InsertTechRoadmap): Promise<TechRoadmap>;
  getUserRoadmaps(userId: string): Promise<TechRoadmap[]>;
  getRoadmapById(id: string): Promise<TechRoadmap | undefined>;
  updateTechRoadmap(id: string, updates: Partial<InsertTechRoadmap>): Promise<TechRoadmap | undefined>;
  deleteTechRoadmap(id: string): Promise<void>;
  verifyRoadmapOwnership(roadmapId: string, userId: string): Promise<boolean>;

  // Repository analysis operations
  createRepositoryAnalysis(analysis: InsertRepositoryAnalysis): Promise<RepositoryAnalysis>;
  getRepositoryAnalysis(id: string): Promise<RepositoryAnalysis | undefined>;
  getUserRepositoryAnalyses(userId: string): Promise<RepositoryAnalysis[]>;
  updateRepositoryAnalysis(id: string, updates: Partial<InsertRepositoryAnalysis>): Promise<RepositoryAnalysis | undefined>;
  deleteRepositoryAnalysis(id: string): Promise<void>;
  verifyRepositoryAnalysisOwnership(analysisId: string, userId: string): Promise<boolean>;

  // Repository import operations
  createRepositoryImport(importData: InsertRepositoryImport): Promise<RepositoryImport>;
  getRepositoryImport(id: string): Promise<RepositoryImport | undefined>;
  getUserRepositoryImports(userId: string): Promise<RepositoryImport[]>;
  getImportsByAnalysisId(analysisId: string): Promise<RepositoryImport[]>;

  // Detected tools operations
  createDetectedTools(tools: InsertDetectedTool[]): Promise<DetectedTool[]>;
  getDetectedToolsByAnalysisId(analysisId: string): Promise<(DetectedTool & { tool?: Tool; suggestedToolRef?: Tool })[]>;
  updateDetectedTool(id: string, updates: Partial<InsertDetectedTool>): Promise<DetectedTool | undefined>;
  markDetectedToolAsImported(id: string): Promise<DetectedTool | undefined>;
  
  // AI enhancement operations
  getBudgetConstrainedRecommendations(userId: string, maxBudget?: number): Promise<Tool[]>;
  getTeamSuitableTools(userId: string, teamSize: string): Promise<Tool[]>;
  getIndustrySpecificTools(userId: string, industry: string): Promise<Tool[]>;
  analyzeStackMaturity(userId: string): Promise<{
    currentLevel: 'beginner' | 'intermediate' | 'expert';
    recommendations: string[];
    nextSteps: string[];
    maturityScore: number;
  }>;

  // Task generation and management operations
  getSavedIdea(id: string): Promise<SavedIdea | undefined>;
  createTaskGeneration(generation: InsertTaskGeneration): Promise<TaskGeneration>;
  updateTaskGeneration(id: string, updates: Partial<InsertTaskGeneration>): Promise<TaskGeneration | undefined>;
  getTaskGeneration(id: string): Promise<TaskGeneration | undefined>;
  getUserTaskGenerations(userId: string): Promise<TaskGeneration[]>;
  
  createProjectTask(task: InsertProjectTask): Promise<ProjectTask>;
  updateProjectTask(id: string, updates: UpdateProjectTask): Promise<ProjectTask | undefined>;
  deleteProjectTask(id: string): Promise<void>;
  getUserTasks(userId: string): Promise<ProjectTask[]>;
  getTasksByGeneration(generationId: string): Promise<ProjectTask[]>;
  verifyTaskOwnership(taskId: string, userId: string): Promise<boolean>;
  
  createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency>;
  getTaskDependenciesByGeneration(generationId: string): Promise<TaskDependency[]>;
  checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean>;
  
  getTaskMetrics(generationId: string): Promise<TaskMetrics>;
  getTaskCategories(): Promise<TaskCategory[]>;
  createTaskCategory(category: InsertTaskCategory): Promise<TaskCategory>;
  
  // Documentation system operations
  // Doc categories operations
  getAllDocCategories(): Promise<DocCategory[]>;
  getDocCategoriesHierarchy(): Promise<DocCategoryWithStats[]>;
  getDocCategory(id: string): Promise<DocCategory | undefined>;
  getDocCategoryBySlug(slug: string): Promise<DocCategory | undefined>;
  createDocCategory(category: InsertDocCategory): Promise<DocCategory>;
  updateDocCategory(id: string, updates: Partial<InsertDocCategory>): Promise<DocCategory | undefined>;
  deleteDocCategory(id: string): Promise<void>;
  
  // Doc tags operations
  getAllDocTags(): Promise<DocTag[]>;
  getPopularDocTags(limit?: number): Promise<DocTag[]>;
  getDocTag(id: string): Promise<DocTag | undefined>;
  getDocTagBySlug(slug: string): Promise<DocTag | undefined>;
  createDocTag(tag: InsertDocTag): Promise<DocTag>;
  updateDocTag(id: string, updates: Partial<InsertDocTag>): Promise<DocTag | undefined>;
  deleteDocTag(id: string): Promise<void>;
  
  // Documentation articles operations
  getAllDocumentationArticles(filters?: {
    categoryId?: string;
    contentType?: string;
    difficulty?: string;
    isPublished?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<DocumentationArticle[]>;
  searchDocumentation(request: DocSearchRequest, userId?: string): Promise<DocSearchResponse>;
  getDocumentationArticle(id: string, userId?: string): Promise<DocumentationArticleWithDetails | undefined>;
  getDocumentationArticleBySlug(slug: string, userId?: string): Promise<DocumentationArticleWithDetails | undefined>;
  createDocumentationArticle(article: InsertDocumentationArticle): Promise<DocumentationArticle>;
  updateDocumentationArticle(id: string, updates: Partial<InsertDocumentationArticle>): Promise<DocumentationArticle | undefined>;
  deleteDocumentationArticle(id: string): Promise<void>;
  incrementDocumentationView(articleId: string, userId?: string, sessionId?: string): Promise<void>;
  
  // Featured and popular content
  getFeaturedDocumentation(): Promise<DocumentationArticle[]>;
  getPopularDocumentation(limit?: number): Promise<DocumentationArticle[]>;
  getRecentDocumentation(limit?: number): Promise<DocumentationArticle[]>;
  getRelatedDocumentation(articleId: string, limit?: number): Promise<DocumentationArticle[]>;
  
  // User bookmarks operations
  getUserDocBookmarks(userId: string): Promise<(UserDocBookmark & { article: DocumentationArticle })[]>;
  createDocBookmark(userId: string, articleId: string, notes?: string): Promise<UserDocBookmark>;
  updateDocBookmark(id: string, notes: string): Promise<UserDocBookmark | undefined>;
  deleteDocBookmark(userId: string, articleId: string): Promise<void>;
  verifyDocBookmarkOwnership(bookmarkId: string, userId: string): Promise<boolean>;
  
  // User search history operations
  getUserDocSearchHistory(userId: string, limit?: number): Promise<DocSearchHistory[]>;
  createDocSearchHistory(searchHistory: InsertDocSearchHistory): Promise<DocSearchHistory>;
  deleteDocSearchHistory(userId: string, searchQuery?: string): Promise<void>;
  
  // Doc ratings operations
  getDocumentationRatings(articleId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
  }>;
  getUserDocRating(userId: string, articleId: string): Promise<DocRating | undefined>;
  createDocRating(rating: InsertDocRating): Promise<DocRating>;
  updateDocRating(id: string, updates: Partial<InsertDocRating>): Promise<DocRating | undefined>;
  deleteDocRating(userId: string, articleId: string): Promise<void>;
  
  // Doc analytics operations
  getDocumentationAnalytics(): Promise<{
    totalArticles: number;
    totalViews: number;
    totalBookmarks: number;
    averageRating: number;
    popularCategories: Array<{ categoryName: string; count: number }>;
    topSearchQueries: Array<{ query: string; count: number }>;
  }>;

  // Discovery system operations
  // Discovered tools operations
  createDiscoveredTool(tool: InsertDiscoveredTool): Promise<DiscoveredTool>;
  updateDiscoveredTool(id: string, updates: Partial<InsertDiscoveredTool>): Promise<DiscoveredTool | undefined>;
  getDiscoveredTool(id: string): Promise<DiscoveredTool | undefined>;
  getDiscoveredToolBySourceId(sourceType: string, sourceId: string): Promise<DiscoveredTool | undefined>;
  getAllDiscoveredTools(filters?: {
    category?: string;
    sourceType?: string;
    languages?: string[];
    pricingModel?: string;
    difficultyLevel?: string;
    minPopularityScore?: number;
    limit?: number;
    offset?: number;
  }): Promise<DiscoveredTool[]>;
  searchDiscoveredTools(query: string, filters?: {
    category?: string;
    sourceType?: string;
    languages?: string[];
    limit?: number;
  }): Promise<DiscoveredTool[]>;
  getTrendingDiscoveredTools(timeframe?: string, category?: string, limit?: number): Promise<DiscoveredToolWithMetrics[]>;
  deleteDiscoveredTool(id: string): Promise<void>;
  bulkCreateDiscoveredTools(tools: InsertDiscoveredTool[]): Promise<DiscoveredTool[]>;
  
  // Discovery sessions operations
  createDiscoverySession(session: InsertToolDiscoverySession): Promise<ToolDiscoverySession>;
  updateDiscoverySession(id: string, updates: Partial<InsertToolDiscoverySession>): Promise<ToolDiscoverySession | undefined>;
  getDiscoverySession(id: string): Promise<ToolDiscoverySession | undefined>;
  getAllDiscoverySessions(limit?: number): Promise<ToolDiscoverySession[]>;
  getActiveDiscoverySession(): Promise<ToolDiscoverySession | undefined>;
  getDiscoverySessionStatus(id: string): Promise<DiscoverySessionStatus | undefined>;
  deleteDiscoverySession(id: string): Promise<void>;
  
  // External tool data operations
  createExternalToolData(data: InsertExternalToolData): Promise<ExternalToolData>;
  updateExternalToolData(id: string, updates: Partial<InsertExternalToolData>): Promise<ExternalToolData | undefined>;
  getExternalToolData(discoveredToolId: string, sourceType: string): Promise<ExternalToolData | undefined>;
  getFreshExternalToolData(discoveredToolId: string, sourceType: string): Promise<ExternalToolData | undefined>;
  bulkCreateExternalToolData(data: InsertExternalToolData[]): Promise<ExternalToolData[]>;
  deleteExpiredExternalToolData(): Promise<number>; // Returns count of deleted records
  
  // Tool popularity metrics operations
  createToolPopularityMetric(metric: InsertToolPopularityMetric): Promise<ToolPopularityMetric>;
  updateToolPopularityMetric(id: string, updates: Partial<InsertToolPopularityMetric>): Promise<ToolPopularityMetric | undefined>;
  getLatestToolPopularityMetric(discoveredToolId: string): Promise<ToolPopularityMetric | undefined>;
  getToolPopularityHistory(discoveredToolId: string, limit?: number): Promise<ToolPopularityMetric[]>;
  bulkCreateToolPopularityMetrics(metrics: InsertToolPopularityMetric[]): Promise<ToolPopularityMetric[]>;
  calculateTrendingScores(timeframe: string): Promise<{ discoveredToolId: string; trendingScore: number }[]>;
  
  // Discovery categories operations
  getAllDiscoveryCategories(): Promise<DiscoveryCategory[]>;
  getDiscoveryCategoriesHierarchy(): Promise<DiscoveryCategory[]>;
  getDiscoveryCategory(id: string): Promise<DiscoveryCategory | undefined>;
  getDiscoveryCategoryBySlug(slug: string): Promise<DiscoveryCategory | undefined>;
  createDiscoveryCategory(category: InsertDiscoveryCategory): Promise<DiscoveryCategory>;
  updateDiscoveryCategory(id: string, updates: Partial<InsertDiscoveryCategory>): Promise<DiscoveryCategory | undefined>;
  deleteDiscoveryCategory(id: string): Promise<void>;
  getCategoryToolCount(categoryId: string): Promise<number>;
  
  // User discovery preferences operations
  getUserDiscoveryPreferences(userId: string): Promise<UserDiscoveryPreference | undefined>;
  createUserDiscoveryPreferences(preferences: InsertUserDiscoveryPreference): Promise<UserDiscoveryPreference>;
  updateUserDiscoveryPreferences(userId: string, updates: Partial<InsertUserDiscoveryPreference>): Promise<UserDiscoveryPreference | undefined>;
  deleteUserDiscoveryPreferences(userId: string): Promise<void>;
  
  // Discovered tool evaluations operations
  getUserToolEvaluations(userId: string): Promise<(DiscoveredToolEvaluation & { discoveredTool: DiscoveredTool })[]>;
  getUserToolEvaluation(userId: string, discoveredToolId: string): Promise<DiscoveredToolEvaluation | undefined>;
  createToolEvaluation(evaluation: InsertDiscoveredToolEvaluation): Promise<DiscoveredToolEvaluation>;
  updateToolEvaluation(id: string, updates: Partial<InsertDiscoveredToolEvaluation>): Promise<DiscoveredToolEvaluation | undefined>;
  deleteToolEvaluation(id: string): Promise<void>;
  verifyToolEvaluationOwnership(evaluationId: string, userId: string): Promise<boolean>;
  
  // Discovery intelligence operations
  getPersonalizedRecommendations(
    userId: string,
    limit?: number
  ): Promise<DiscoveredToolWithMetrics[]>;
  
  getComplementaryTools(
    userStack: string[],
    userLanguages: string[],
    limit?: number
  ): Promise<DiscoveredToolWithMetrics[]>;
  
  analyzeCategoryTrends(
    category?: string,
    timeframe?: string
  ): Promise<{
    category: string;
    totalTools: number;
    trendingTools: number;
    avgPopularityScore: number;
    topLanguages: Array<{ language: string; count: number }>;
    growthRate: number;
  }[]>;
  
  getToolAlternatives(
    toolName: string,
    category: string,
    limit?: number
  ): Promise<DiscoveredToolWithMetrics[]>;
  
  getStackCompatibleTools(
    userTools: string[],
    targetCategory: string,
    limit?: number
  ): Promise<DiscoveredToolWithMetrics[]>;
  
  // Discovery statistics operations
  getDiscoveryStatistics(): Promise<{
    totalDiscoveredTools: number;
    toolsByCategory: Array<{ category: string; count: number }>;
    toolsBySourceType: Array<{ sourceType: string; count: number }>;
    toolsByLanguage: Array<{ language: string; count: number }>;
    recentlyDiscovered: number; // Last 7 days
    activeSessions: number;
    lastDiscoveryRun: string | null;
  }>;
  
  getDiscoverySessionMetrics(sessionId: string): Promise<{
    totalApiCalls: number;
    rateLimitHits: number;
    toolsDiscovered: number;
    categoriesScanned: number;
    duration: number;
    errors: Array<{ source: string; error: string; timestamp: string }>;
  } | undefined>;

  // Enhanced Project Planning Operations
  // Projects CRUD operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string, filters?: {
    status?: string;
    projectType?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;
  verifyProjectOwnership(projectId: string, userId: string): Promise<boolean>;
  
  // Project phases operations
  createProjectPhase(phase: InsertProjectPhase): Promise<ProjectPhase>;
  getProjectPhases(projectId: string): Promise<ProjectPhase[]>;
  updateProjectPhase(id: string, updates: Partial<InsertProjectPhase>): Promise<ProjectPhase | undefined>;
  deleteProjectPhase(id: string): Promise<void>;
  reorderProjectPhases(projectId: string, phaseIds: string[]): Promise<void>;
  
  // Project milestones operations
  createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone>;
  getProjectMilestones(projectId: string): Promise<ProjectMilestone[]>;
  updateProjectMilestone(id: string, updates: Partial<InsertProjectMilestone>): Promise<ProjectMilestone | undefined>;
  deleteProjectMilestone(id: string): Promise<void>;
  getMilestonesByDateRange(projectId: string, startDate: Date, endDate: Date): Promise<ProjectMilestone[]>;
  getUpcomingMilestones(userId: string, daysAhead: number): Promise<(ProjectMilestone & { project: Project })[]>;
  
  // Project resources operations
  createProjectResource(resource: InsertProjectResource): Promise<ProjectResource>;
  getProjectResources(projectId: string, resourceType?: string): Promise<ProjectResource[]>;
  updateProjectResource(id: string, updates: Partial<InsertProjectResource>): Promise<ProjectResource | undefined>;
  deleteProjectResource(id: string): Promise<void>;
  getUserResourceAllocations(userId: string): Promise<(ProjectResource & { project: Project })[]>;
  getResourceUtilization(resourceId: string, startDate: Date, endDate: Date): Promise<{
    totalAllocated: number;
    totalUsed: number;
    utilizationRate: number;
    projects: Array<{ projectId: string; projectName: string; allocation: number }>;
  }>;
  
  // Project budgets operations
  createProjectBudget(budget: InsertProjectBudget): Promise<ProjectBudget>;
  getProjectBudgets(projectId: string): Promise<ProjectBudget[]>;
  updateProjectBudget(id: string, updates: Partial<InsertProjectBudget>): Promise<ProjectBudget | undefined>;
  deleteProjectBudget(id: string): Promise<void>;
  getBudgetSummary(projectId: string): Promise<{
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    budgetsByCategory: Array<{
      category: string;
      allocated: number;
      spent: number;
      remaining: number;
      variance: number;
    }>;
    projectedCompletion: Date | null;
  }>;
  trackBudgetExpense(projectId: string, budgetId: string, amount: number, description?: string): Promise<void>;
  
  // Project timelines operations
  createProjectTimeline(timeline: InsertProjectTimeline): Promise<ProjectTimeline>;
  getProjectTimelines(projectId: string): Promise<ProjectTimeline[]>;
  updateProjectTimeline(id: string, updates: Partial<InsertProjectTimeline>): Promise<ProjectTimeline | undefined>;
  deleteProjectTimeline(id: string): Promise<void>;
  calculateProjectSchedule(projectId: string): Promise<{
    startDate: Date;
    endDate: Date;
    totalDuration: number;
    criticalPath: string[];
    scheduleVariance: number;
    completionProbability: number;
  }>;
  getGanttChartData(projectId: string): Promise<{
    tasks: Array<{
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      progress: number;
      dependencies: string[];
      assignees: string[];
      isCritical: boolean;
    }>;
    milestones: Array<{
      id: string;
      name: string;
      date: Date;
      status: string;
    }>;
    phases: Array<{
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      progress: number;
    }>;
  }>;
  
  // Project templates operations
  createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate>;
  getProjectTemplates(filters?: {
    category?: string;
    templateType?: string;
    isPublic?: boolean;
    createdBy?: string;
    limit?: number;
  }): Promise<ProjectTemplate[]>;
  getProjectTemplate(id: string): Promise<ProjectTemplate | undefined>;
  updateProjectTemplate(id: string, updates: Partial<InsertProjectTemplate>): Promise<ProjectTemplate | undefined>;
  deleteProjectTemplate(id: string): Promise<void>;
  createProjectFromTemplate(templateId: string, userId: string, projectName: string, customizations?: any): Promise<Project>;
  
  // Project analytics operations
  recordProjectAnalytics(analytics: InsertProjectAnalytics): Promise<ProjectAnalytics>;
  getProjectAnalytics(projectId: string, dateRange?: { start: Date; end: Date }): Promise<ProjectAnalytics[]>;
  getPortfolioAnalytics(userId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
    spentBudget: number;
    averageCompletion: number;
    projectsByStatus: Array<{ status: string; count: number; percentage: number }>;
    projectsByType: Array<{ type: string; count: number }>;
    upcomingMilestones: number;
    overdueTasks: number;
    teamUtilization: number;
    budgetVariance: number;
  }>;
  
  // Advanced project planning operations
  optimizeProjectSchedule(projectId: string): Promise<{
    originalDuration: number;
    optimizedDuration: number;
    timeSavings: number;
    recommendations: string[];
    newTimelines: ProjectTimeline[];
  }>;
  
  analyzeResourceConflicts(userId: string): Promise<{
    conflicts: Array<{
      resourceId: string;
      resourceName: string;
      conflictPeriod: { start: Date; end: Date };
      overallocation: number;
      affectedProjects: Array<{ projectId: string; projectName: string; allocation: number }>;
      suggestions: string[];
    }>;
    resolutionStrategies: string[];
  }>;
  
  calculateProjectRisk(projectId: string): Promise<{
    overallRiskScore: number;
    riskFactors: Array<{
      category: string;
      risk: string;
      probability: number;
      impact: number;
      riskScore: number;
      mitigation: string;
    }>;
    recommendations: string[];
    contingencyBudget: number;
  }>;
  
  getProjectDependencies(projectId: string): Promise<{
    internal: Array<{
      dependentTask: string;
      prerequisiteTask: string;
      dependencyType: string;
      lagTime: number;
      criticality: string;
    }>;
    external: Array<{
      task: string;
      dependency: string;
      vendor: string;
      expectedDate: Date;
      status: string;
    }>;
    criticalPath: string[];
  }>;
  
  forecastProjectCompletion(projectId: string): Promise<{
    probabilisticCompletion: Array<{ date: Date; probability: number }>;
    mostLikelyCompletion: Date;
    optimisticCompletion: Date;
    pessimisticCompletion: Date;
    confidenceInterval: { lower: Date; upper: Date };
    keyRisks: string[];
    recommendations: string[];
  }>;
  
  // Portfolio management operations
  getPortfolioOverview(userId: string): Promise<{
    recentActivity: Array<{
      id: string;
      projectName: string;
      action: string;
      timestamp: string;
      actor: string;
    }>;
    criticalAlerts: Array<{
      id: string;
      type: 'budget' | 'timeline' | 'resource' | 'risk';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      projectId: string;
      projectName: string;
    }>;
    upcomingDeadlines: Array<{
      id: string;
      name: string;
      projectName: string;
      dueDate: string;
      type: 'milestone' | 'deliverable' | 'phase';
      status: string;
    }>;
  }>;
  
  optimizePortfolioResources(userId: string): Promise<{
    currentUtilization: number;
    optimizedUtilization: number;
    resourceReallocation: Array<{
      resourceId: string;
      currentProjects: string[];
      suggestedProjects: string[];
      efficiencyGain: number;
    }>;
    recommendations: string[];
  }>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

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

  async getUserToolById(id: string): Promise<UserTool | undefined> {
    const [userTool] = await db
      .select()
      .from(userTools)
      .where(eq(userTools.id, id));
    return userTool;
  }

  async verifyUserToolOwnership(userToolId: string, userId: string): Promise<boolean> {
    const [userTool] = await db
      .select({ userId: userTools.userId })
      .from(userTools)
      .where(eq(userTools.id, userToolId));
    return userTool?.userId === userId;
  }

  // Usage tracking operations
  async markToolAsUsed(userToolId: string): Promise<UserTool | undefined> {
    const [updated] = await db
      .update(userTools)
      .set({ lastUsedAt: new Date() })
      .where(eq(userTools.id, userToolId))
      .returning();
    return updated;
  }

  async toggleToolActiveStatus(userToolId: string, isActive: boolean): Promise<UserTool | undefined> {
    const [updated] = await db
      .update(userTools)
      .set({ isActive })
      .where(eq(userTools.id, userToolId))
      .returning();
    return updated;
  }

  async getDormantTools(userId: string, daysSinceLastUse: number = 30): Promise<(UserTool & { tool: Tool })[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastUse);
    
    const result = await db
      .select()
      .from(userTools)
      .innerJoin(tools, eq(userTools.toolId, tools.id))
      .where(and(
        eq(userTools.userId, userId),
        // Consider dormant if: never used OR last used before cutoff date OR marked inactive
        sql`(
          ${userTools.lastUsedAt} IS NULL 
          OR ${userTools.lastUsedAt} < ${cutoffDate.toISOString()}
          OR ${userTools.isActive} = false
        )`
      ));
      
    return result.map((row: any) => ({
      ...row.user_tools,
      tool: row.tools
    }));
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

  async verifySavedIdeaOwnership(ideaId: string, userId: string): Promise<boolean> {
    const [idea] = await db
      .select({ userId: savedIdeas.userId })
      .from(savedIdeas)
      .where(eq(savedIdeas.id, ideaId));
    return idea?.userId === userId;
  }

  // Budget operations
  async updateUserBudget(userId: string, monthlyBudget: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ monthlyBudget })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Cost snapshot operations
  async createCostSnapshot(snapshot: InsertCostSnapshot): Promise<CostSnapshot> {
    const [created] = await db.insert(costSnapshots).values(snapshot).returning();
    return created;
  }

  async getCostSnapshots(userId: string, limit: number = 30): Promise<CostSnapshot[]> {
    return await db
      .select()
      .from(costSnapshots)
      .where(eq(costSnapshots.userId, userId))
      .orderBy(costSnapshots.date)
      .limit(limit);
  }

  // Stack intelligence operations
  async analyzeStackRedundancies(userId: string): Promise<{
    redundancies: Array<{
      category: string;
      tools: Array<UserTool & { tool: Tool }>;
      severity: OptimizationSeverity;
      potentialSavings: number;
      recommendation: string;
      reason: string;
    }>;
    totalPotentialSavings: number;
  }> {
    const userTools = await this.getUserTools(userId);
    const redundancies: any[] = [];
    let totalPotentialSavings = 0;

    // Group tools by category
    const toolsByCategory = userTools.reduce((acc, userTool) => {
      const category = userTool.tool.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(userTool);
      return acc;
    }, {} as Record<string, typeof userTools>);

    // Analyze each category for redundancies - be conservative about classifications
    for (const [category, tools] of Object.entries(toolsByCategory)) {
      if (tools.length > 1) {
        // Calculate potential savings (keep the most cost-effective tool)
        const costs = tools.map(t => parseFloat(t.monthlyCost || "0"));
        const minCost = Math.min(...costs);
        const potentialSavings = costs.reduce((sum, cost) => sum + cost, 0) - minCost;

        // New conservative severity classification - only mark critical for genuine problems
        let severity: OptimizationSeverity = 'note';
        let reason = `You have ${tools.length} tools in the ${category} category.`;
        
        // Only critical if there's a genuine compatibility/security issue
        if (category === 'Payment Platforms' && tools.length > 1) {
          // Multiple payment processors could cause issues
          severity = 'critical';
          reason = 'Multiple payment platforms can create accounting conflicts and compliance issues.';
        } else if (potentialSavings > 100) {
          // High cost redundancy = optimization opportunity
          severity = 'optimization';
          reason = `Significant monthly savings available (${potentialSavings.toFixed(0)}/month).`;
        } else if (tools.length > 3) {
          // Too many similar tools = suggestion
          severity = 'suggestion';
          reason = `Consider consolidating to reduce complexity and maintenance overhead.`;
        } else if (potentialSavings > 10) {
          // Small savings available
          severity = 'optimization';
          reason = `Minor cost savings opportunity available.`;
        }

        // Generate positive recommendation
        const bestTool = tools.reduce((best, current) => {
          const bestScore = parseFloat(best.tool.popularityScore || "0") + parseFloat(best.tool.maturityScore || "0");
          const currentScore = parseFloat(current.tool.popularityScore || "0") + parseFloat(current.tool.maturityScore || "0");
          return currentScore > bestScore ? current : best;
        });

        const othersToRemove = tools.filter(t => t.id !== bestTool.id);
        const recommendation = potentialSavings > 5 
          ? `Save $${potentialSavings.toFixed(2)}/month by keeping ${bestTool.tool.name} and reviewing ${othersToRemove.map(t => t.tool.name).join(', ')}.`
          : `Consider whether all ${tools.length} ${category} tools are actively needed.`;

        redundancies.push({
          category,
          tools,
          severity,
          potentialSavings,
          recommendation,
          reason
        });

        totalPotentialSavings += potentialSavings;
      }
    }

    return { redundancies, totalPotentialSavings };
  }

  async findMissingStackPieces(userId: string): Promise<{
    missing: Array<{
      category: string;
      importance: 'critical' | 'important' | 'recommended';
      reason: string;
      suggestedTools: Tool[];
    }>;
    essentialCategories: string[];
    stackCompleteness: number;
  }> {
    const userTools = await this.getUserTools(userId);
    const allTools = await this.getAllTools();
    
    // Define essential categories for a complete tech stack
    const essentialCategories = [
      'Backend/Database',
      'Frontend/Design', 
      'DevOps/Deployment',
      'AI Coding Tools',
      'IDE/Development'
    ];

    const userCategories = new Set(userTools.map(ut => ut.tool.category));
    const missing: any[] = [];

    for (const category of essentialCategories) {
      if (!userCategories.has(category)) {
        const suggestedTools = allTools
          .filter(tool => tool.category === category)
          .sort((a, b) => {
            const aScore = parseFloat(a.popularityScore || "0") + parseFloat(a.maturityScore || "0");
            const bScore = parseFloat(b.popularityScore || "0") + parseFloat(b.maturityScore || "0");
            return bScore - aScore;
          })
          .slice(0, 3);

        // New conservative importance classification
        let importance: RecommendationImportance = 'optional';
        let reason = `Consider adding ${category} tools to your stack.`;
        let benefits = '';

        // Only mark as essential for truly necessary categories
        if (category === 'Backend/Database') {
          importance = 'beneficial'; // Not essential - they might be using external APIs
          reason = 'Most applications benefit from dedicated data storage.';
          benefits = 'Enables data persistence, user management, and content storage.';
        } else if (category === 'DevOps/Deployment') {
          importance = 'beneficial';
          reason = 'Deployment tools streamline your development workflow.';
          benefits = 'Automates deployments, improves reliability, and enables collaboration.';
        } else if (category === 'AI Coding Tools') {
          importance = 'beneficial';
          reason = 'AI tools can significantly boost coding productivity.';
          benefits = 'Code completion, bug detection, and faster development cycles.';
        } else if (category === 'Frontend/Design') {
          importance = 'beneficial';
          reason = 'Frontend tools help create better user experiences.';
          benefits = 'Professional UI/UX, responsive design, and user engagement.';
        } else if (category === 'IDE/Development') {
          importance = 'beneficial';
          reason = 'Development tools improve coding efficiency.';
          benefits = 'Better debugging, code organization, and developer productivity.';
        }

        missing.push({
          category,
          importance,
          reason,
          suggestedTools,
          benefits
        });
      }
    }

    const stackCompleteness = Math.round(((essentialCategories.length - missing.length) / essentialCategories.length) * 100);

    return { missing, essentialCategories, stackCompleteness };
  }

  async checkCompatibilityIssues(userId: string): Promise<{
    issues: Array<{
      type: 'security_risk' | 'compatibility_conflict' | 'deprecation_notice' | 'integration_opportunity';
      toolIds: string[];
      toolNames: string[];
      severity: OptimizationSeverity;
      description: string;
      recommendation: string;
      impact: string;
    }>;
    riskScore: number;
  }> {
    const userTools = await this.getUserTools(userId);
    const issues: any[] = [];

    // Check for truly critical security risks only
    const criticallyOldTools = userTools.filter(ut => {
      const maturity = parseFloat(ut.tool.maturityScore || "5");
      // Only flag as critical if maturity is extremely low (indicating security risk)
      return maturity < 1;
    });

    for (const tool of criticallyOldTools) {
      issues.push({
        type: 'security_risk',
        toolIds: [tool.toolId],
        toolNames: [tool.tool.name],
        severity: 'critical',
        description: `${tool.tool.name} appears to have serious maintenance or security concerns.`,
        recommendation: `Review ${tool.tool.name} for potential security issues and consider migrating to a maintained alternative.`,
        impact: 'Potential security vulnerabilities or lack of support for critical bugs.'
      });
    }

    // Check for framework consolidation opportunities (not conflicts)
    const frontendFrameworks = userTools.filter(ut => 
      ut.tool.frameworks && (
        ut.tool.frameworks.includes('React') || 
        ut.tool.frameworks.includes('Vue') || 
        ut.tool.frameworks.includes('Angular')
      )
    );

    if (frontendFrameworks.length > 1) {
      issues.push({
        type: 'compatibility_conflict',
        toolIds: frontendFrameworks.map(ut => ut.toolId),
        toolNames: frontendFrameworks.map(ut => ut.tool.name),
        severity: 'suggestion', // Downgraded from 'high'
        description: `You're using ${frontendFrameworks.length} frontend frameworks: ${frontendFrameworks.map(f => f.tool.name).join(', ')}.`,
        recommendation: 'Consider standardizing on one frontend framework for consistency and reduced complexity.',
        impact: 'Team onboarding complexity and potential inconsistencies in development patterns.'
      });
    }

    // Check for tools that might benefit from updates (not "deprecated")
    const lowerMaturityTools = userTools.filter(ut => {
      const maturity = parseFloat(ut.tool.maturityScore || "5");
      return maturity >= 1 && maturity < 3; // Tools that are maintained but could be better
    });

    for (const tool of lowerMaturityTools) {
      issues.push({
        type: 'deprecation_notice',
        toolIds: [tool.toolId],
        toolNames: [tool.tool.name],
        severity: 'note',
        description: `${tool.tool.name} could potentially be upgraded to a more mature alternative.`,
        recommendation: `Research newer alternatives in the ${tool.tool.category} category that might offer better features or support.`,
        impact: 'Missing out on improved features, better performance, or enhanced developer experience.'
      });
    }

    // Frame as integration opportunities, not warnings
    const standaloneTools = userTools.filter(ut => 
      !ut.tool.integrations || ut.tool.integrations.trim() === ''
    );

    if (standaloneTools.length > 3) { // Raised threshold
      issues.push({
        type: 'integration_opportunity',
        toolIds: standaloneTools.map(ut => ut.toolId),
        toolNames: standaloneTools.map(ut => ut.tool.name),
        severity: 'note',
        description: `${standaloneTools.length} tools in your stack could benefit from better integration.`,
        recommendation: 'Look for tools that connect your current stack or consider consolidation for better workflow.',
        impact: 'Potential for improved automation and reduced manual work between tools.'
      });
    }

    // Conservative risk score calculation
    const riskScore = issues.reduce((score, issue) => {
      return score + (issue.severity === 'critical' ? 40 : 
                     issue.severity === 'optimization' ? 15 : 
                     issue.severity === 'suggestion' ? 8 : 3);
    }, 0);

    return { issues, riskScore: Math.min(riskScore, 100) };
  }

  async generateStackRecommendations(userId: string): Promise<{
    recommendations: Array<{
      type: 'add_tool' | 'remove_tool' | 'replace_tool' | 'optimize_cost';
      priority: 'high' | 'medium' | 'low';
      category: string;
      description: string;
      suggestedTools?: Tool[];
      potentialSavings?: number;
      reasoning: string;
    }>;
    stackHealthScore: number;
  }> {
    const [redundancies, missing, compatibility] = await Promise.all([
      this.analyzeStackRedundancies(userId),
      this.findMissingStackPieces(userId),
      this.checkCompatibilityIssues(userId)
    ]);

    const recommendations: any[] = [];
    
    // Add recommendations from redundancy analysis with value-focused approach
    redundancies.redundancies.forEach(redundancy => {
      if (redundancy.potentialSavings > 5) { // Only include if there are meaningful savings
        recommendations.push({
          type: 'optimize_cost',
          priority: redundancy.severity,
          category: redundancy.category,
          title: `Save $${redundancy.potentialSavings.toFixed(0)}/month in ${redundancy.category}`,
          description: redundancy.recommendation,
          potentialSavings: redundancy.potentialSavings,
          reasoning: redundancy.reason,
          benefits: `Reduce monthly costs and simplify your ${redundancy.category} workflow.`
        });
      }
    });

    // Add recommendations from missing pieces analysis
    missing.missing.forEach(gap => {
      // Only add beneficial and essential recommendations 
      if (gap.importance === 'beneficial' || gap.importance === 'essential') {
        recommendations.push({
          type: 'add_tool',
          priority: gap.importance === 'essential' ? 'critical' : 'optimization',
          category: gap.category,
          title: `Consider ${gap.category} tools`,
          description: gap.reason,
          suggestedTools: gap.suggestedTools,
          reasoning: gap.reason,
          benefits: gap.benefits
        });
      }
    });

    // Add recommendations from compatibility issues - only critical ones
    compatibility.issues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'optimization') {
        let title = '';
        switch(issue.type) {
          case 'security_risk':
            title = `Address security concern in ${issue.toolNames[0]}`;
            break;
          case 'compatibility_conflict':
            title = `Streamline frontend framework usage`;
            break;
          case 'deprecation_notice':
            title = `Explore alternatives to ${issue.toolNames[0]}`;
            break;
          default:
            title = `Integration opportunity identified`;
        }

        recommendations.push({
          type: issue.type === 'security_risk' ? 'replace_tool' : 'optimize_cost',
          priority: issue.severity,
          category: 'Stack Optimization',
          title,
          description: issue.description,
          reasoning: issue.recommendation,
          benefits: `Improve security, maintainability, and development workflow.`
        });
      }
    });

    // Calculate improved stack health score (less penalizing)
    const completenessScore = missing.stackCompleteness;
    // Reduce penalties - most redundancies and compatibility issues aren't critical
    const redundancyPenalty = Math.min(redundancies.redundancies.filter(r => r.severity === 'critical').length * 15, 20);
    const compatibilityPenalty = Math.min(compatibility.issues.filter(i => i.severity === 'critical').length * 10, 15);
    
    const stackHealthScore = Math.max(30, Math.round(completenessScore - redundancyPenalty - compatibilityPenalty));
    
    // Calculate optimization score based on potential improvements
    const optimizationOpportunities = recommendations.filter(r => r.priority === 'optimization').length;
    const costSavings = redundancies.totalPotentialSavings;
    const optimizationScore = Math.min(100, Math.round(75 + (costSavings * 2) - (optimizationOpportunities * 5)));

    return { recommendations, stackHealthScore, optimizationScore };
  }

  // User context operations
  async getUserAIContext(userId: string): Promise<UserAIContext> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      teamSize: user.teamSize as any,
      industry: user.industry || undefined,
      technicalLevel: user.technicalLevel as any,
      primaryGoals: user.primaryGoals || [],
      companyStage: user.companyStage as any,
      monthlyBudget: user.monthlyBudget ? parseFloat(user.monthlyBudget) : undefined,
      aiContext: user.aiContext || {},
    };
  }

  async updateUserContext(userId: string, context: UserContextUpdate): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(context)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Tech roadmap operations
  async createTechRoadmap(roadmap: InsertTechRoadmap): Promise<TechRoadmap> {
    const [created] = await db.insert(techRoadmaps).values(roadmap).returning();
    return created;
  }

  async getUserRoadmaps(userId: string): Promise<TechRoadmap[]> {
    return await db
      .select()
      .from(techRoadmaps)
      .where(eq(techRoadmaps.userId, userId))
      .orderBy(techRoadmaps.createdAt);
  }

  async getRoadmapById(id: string): Promise<TechRoadmap | undefined> {
    const [roadmap] = await db
      .select()
      .from(techRoadmaps)
      .where(eq(techRoadmaps.id, id));
    return roadmap;
  }

  async updateTechRoadmap(id: string, updates: Partial<InsertTechRoadmap>): Promise<TechRoadmap | undefined> {
    const [updated] = await db
      .update(techRoadmaps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(techRoadmaps.id, id))
      .returning();
    return updated;
  }

  async deleteTechRoadmap(id: string): Promise<void> {
    await db.delete(techRoadmaps).where(eq(techRoadmaps.id, id));
  }

  async verifyRoadmapOwnership(roadmapId: string, userId: string): Promise<boolean> {
    const [roadmap] = await db
      .select({ userId: techRoadmaps.userId })
      .from(techRoadmaps)
      .where(eq(techRoadmaps.id, roadmapId));
    return roadmap?.userId === userId;
  }

  // AI enhancement operations
  async getBudgetConstrainedRecommendations(userId: string, maxBudget?: number): Promise<Tool[]> {
    const userTools = await this.getUserTools(userId);
    const currentCost = userTools.reduce((sum, ut) => sum + parseFloat(ut.monthlyCost), 0);
    
    const user = await this.getUser(userId);
    const budget = maxBudget || (user?.monthlyBudget ? parseFloat(user.monthlyBudget) : 1000);
    const remainingBudget = Math.max(0, budget - currentCost);

    // Get tools that fit within remaining budget (assume pricing contains cost info)
    const allTools = await this.getAllTools();
    const userToolIds = new Set(userTools.map(ut => ut.toolId));
    
    return allTools.filter(tool => {
      if (userToolIds.has(tool.id)) return false; // Already have this tool
      
      // Simple budget check - tools with no pricing are considered free
      if (!tool.pricing) return true;
      
      // Extract cost from pricing string (simple heuristic)
      const costMatch = tool.pricing.match(/\$(\d+)/);
      if (!costMatch) return true; // No clear cost, assume affordable
      
      const toolCost = parseInt(costMatch[1]);
      return toolCost <= remainingBudget;
    }).slice(0, 10); // Limit to top 10 recommendations
  }

  async getTeamSuitableTools(userId: string, teamSize: string): Promise<Tool[]> {
    const allTools = await this.getAllTools();
    const userTools = await this.getUserTools(userId);
    const userToolIds = new Set(userTools.map(ut => ut.toolId));

    // Filter tools based on team size suitability
    return allTools.filter(tool => {
      if (userToolIds.has(tool.id)) return false;

      const description = (tool.description || '').toLowerCase();
      const features = (tool.features || '').toLowerCase();
      
      switch (teamSize) {
        case 'solo':
          return !description.includes('enterprise') && !description.includes('team collaboration');
        case 'small':
          return description.includes('small team') || description.includes('collaboration') || 
                 !description.includes('enterprise');
        case 'medium':
        case 'large':
          return description.includes('team') || description.includes('collaboration') ||
                 features.includes('multi-user');
        case 'enterprise':
          return description.includes('enterprise') || description.includes('scalable') ||
                 features.includes('enterprise');
        default:
          return true;
      }
    }).slice(0, 15);
  }

  async getIndustrySpecificTools(userId: string, industry: string): Promise<Tool[]> {
    const allTools = await this.getAllTools();
    const userTools = await this.getUserTools(userId);
    const userToolIds = new Set(userTools.map(ut => ut.toolId));

    // Industry-specific keywords mapping
    const industryKeywords: Record<string, string[]> = {
      'fintech': ['financial', 'payment', 'banking', 'compliance', 'security', 'risk'],
      'healthcare': ['healthcare', 'medical', 'HIPAA', 'patient', 'clinical', 'health'],
      'ecommerce': ['ecommerce', 'retail', 'shopping', 'inventory', 'payment', 'checkout'],
      'saas': ['saas', 'subscription', 'multi-tenant', 'cloud', 'api', 'integration'],
      'gaming': ['game', 'gaming', 'unity', 'graphics', 'real-time', 'multiplayer'],
      'education': ['education', 'learning', 'student', 'course', 'academic', 'teaching'],
    };

    const keywords = industryKeywords[industry.toLowerCase()] || [];
    
    return allTools.filter(tool => {
      if (userToolIds.has(tool.id)) return false;
      
      const searchText = `${tool.description} ${tool.features} ${tool.notes}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    }).slice(0, 12);
  }

  async analyzeStackMaturity(userId: string): Promise<{
    currentLevel: 'beginner' | 'intermediate' | 'expert';
    recommendations: string[];
    nextSteps: string[];
    maturityScore: number;
  }> {
    const userTools = await this.getUserTools(userId);
    const user = await this.getUser(userId);
    
    // Analyze stack complexity
    const categories = new Set(userTools.map(ut => ut.tool.category));
    const totalTools = userTools.length;
    const averageMaturity = userTools.reduce((sum, ut) => {
      const score = ut.tool.maturityScore ? parseFloat(ut.tool.maturityScore) : 5;
      return sum + score;
    }, 0) / Math.max(totalTools, 1);

    // Calculate maturity score (0-100)
    let maturityScore = 0;
    maturityScore += Math.min(categories.size * 10, 50); // Category diversity
    maturityScore += Math.min(totalTools * 2, 30); // Tool count
    maturityScore += Math.min(averageMaturity * 2, 20); // Tool quality

    // Determine current level
    let currentLevel: 'beginner' | 'intermediate' | 'expert';
    if (maturityScore < 30) {
      currentLevel = 'beginner';
    } else if (maturityScore < 70) {
      currentLevel = 'intermediate';
    } else {
      currentLevel = 'expert';
    }

    // Generate recommendations based on level
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    if (currentLevel === 'beginner') {
      recommendations.push(
        'Focus on core development tools first',
        'Choose well-established, popular tools with good documentation',
        'Avoid over-engineering your initial setup'
      );
      nextSteps.push(
        'Add a robust testing framework',
        'Set up continuous integration',
        'Implement basic monitoring'
      );
    } else if (currentLevel === 'intermediate') {
      recommendations.push(
        'Consider adopting DevOps practices',
        'Implement comprehensive testing strategies',
        'Focus on security and compliance tools'
      );
      nextSteps.push(
        'Add advanced monitoring and alerting',
        'Implement infrastructure as code',
        'Consider microservices architecture'
      );
    } else {
      recommendations.push(
        'Optimize for performance and scalability',
        'Implement advanced security measures',
        'Consider contributing to open source tools you use'
      );
      nextSteps.push(
        'Explore cutting-edge technologies',
        'Implement advanced observability',
        'Consider building custom tools for specific needs'
      );
    }

    return {
      currentLevel,
      recommendations,
      nextSteps,
      maturityScore: Math.round(maturityScore)
    };
  }

  // Onboarding operations
  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      status: (user.onboardingStatus as any) || "pending",
      step: user.onboardingStep || 0,
      profileCompleted: user.profileCompleted || false,
      completedSteps: [] // Will be populated based on profile data
    };
  }

  async updateOnboardingStatus(userId: string, updates: OnboardingStatusUpdate): Promise<User | undefined> {
    const updateData: any = {};
    
    if (updates.onboardingStatus) updateData.onboardingStatus = updates.onboardingStatus;
    if (typeof updates.onboardingStep === 'number') updateData.onboardingStep = updates.onboardingStep;
    if (typeof updates.profileCompleted === 'boolean') updateData.profileCompleted = updates.profileCompleted;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateOnboardingProfile(userId: string, profile: OnboardingProfile): Promise<User | undefined> {
    const updateData: any = {
      profileCompleted: true,
      onboardingStep: Math.max(2, 0) // Ensure we're at least on step 2
    };

    // Map profile data to user fields
    if (profile.teamSize) updateData.teamSize = profile.teamSize;
    if (profile.industry) updateData.industry = profile.industry;
    if (profile.technicalLevel) updateData.technicalLevel = profile.technicalLevel;
    if (profile.primaryGoals) updateData.primaryGoals = profile.primaryGoals;
    if (profile.companyStage) updateData.companyStage = profile.companyStage;
    if (profile.monthlyBudget) {
      updateData.monthlyBudget = typeof profile.monthlyBudget === 'string' ? profile.monthlyBudget : profile.monthlyBudget.toString();
    }

    // Store additional context
    const aiContext: any = {};
    if (profile.projectType) aiContext.projectType = profile.projectType;
    if (profile.preferredApproach) aiContext.preferredApproach = profile.preferredApproach;
    
    if (Object.keys(aiContext).length > 0) {
      updateData.aiContext = aiContext;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getOnboardingTemplates(): Promise<OnboardingStackTemplate[]> {
    const allTools = await this.getAllTools();
    
    // Define popular stack templates
    const templates: OnboardingStackTemplate[] = [
      {
        id: 'saas-starter',
        name: 'SaaS Startup Stack',
        description: 'Complete stack for building a modern SaaS application',
        category: 'saas',
        tools: allTools.filter(tool => 
          ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Vercel'].some(name => 
            tool.name.toLowerCase().includes(name.toLowerCase())
          )
        ).slice(0, 5),
        estimatedCost: 50,
        complexity: 'medium',
        bestFor: ['MVP development', 'Subscription business', 'B2B SaaS'],
        tags: ['react', 'nodejs', 'database', 'payments']
      },
      {
        id: 'ecommerce-complete',
        name: 'E-commerce Platform',
        description: 'Everything needed to launch an online store',
        category: 'ecommerce',
        tools: allTools.filter(tool => 
          ['Shopify', 'Stripe', 'Mailchimp', 'Google Analytics'].some(name => 
            tool.name.toLowerCase().includes(name.toLowerCase())
          )
        ).slice(0, 6),
        estimatedCost: 75,
        complexity: 'low',
        bestFor: ['Online retail', 'Product sales', 'Digital goods'],
        tags: ['ecommerce', 'payments', 'analytics']
      },
      {
        id: 'api-backend',
        name: 'API & Backend Services',
        description: 'Robust backend infrastructure for modern applications',
        category: 'api',
        tools: allTools.filter(tool => 
          ['Express', 'MongoDB', 'Redis', 'Docker', 'AWS'].some(name => 
            tool.name.toLowerCase().includes(name.toLowerCase())
          )
        ).slice(0, 5),
        estimatedCost: 100,
        complexity: 'high',
        bestFor: ['API development', 'Microservices', 'Scalable backends'],
        tags: ['api', 'backend', 'database', 'cloud']
      },
      {
        id: 'mobile-app',
        name: 'Mobile App Development',
        description: 'Cross-platform mobile app development stack',
        category: 'mobile',
        tools: allTools.filter(tool => 
          ['React Native', 'Firebase', 'Expo', 'TestFlight'].some(name => 
            tool.name.toLowerCase().includes(name.toLowerCase())
          )
        ).slice(0, 4),
        estimatedCost: 30,
        complexity: 'medium',
        bestFor: ['iOS & Android apps', 'Cross-platform', 'Rapid prototyping'],
        tags: ['mobile', 'react-native', 'firebase']
      },
      {
        id: 'website-portfolio',
        name: 'Professional Website',
        description: 'Simple, fast website for portfolios and business presence',
        category: 'website',
        tools: allTools.filter(tool => 
          ['Next.js', 'Tailwind', 'Vercel', 'Cloudinary'].some(name => 
            tool.name.toLowerCase().includes(name.toLowerCase())
          )
        ).slice(0, 4),
        estimatedCost: 20,
        complexity: 'low',
        bestFor: ['Portfolio sites', 'Business websites', 'Landing pages'],
        tags: ['nextjs', 'tailwind', 'static-site']
      }
    ];

    return templates;
  }

  async skipOnboarding(userId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        onboardingStatus: 'skipped',
        onboardingStep: 4
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async completeOnboarding(userId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        onboardingStatus: 'completed',
        onboardingStep: 4
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Repository analysis operations
  async createRepositoryAnalysis(analysis: InsertRepositoryAnalysis): Promise<RepositoryAnalysis> {
    const [created] = await db.insert(repositoryAnalyses).values(analysis).returning();
    return created;
  }

  async getRepositoryAnalysis(id: string): Promise<RepositoryAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(repositoryAnalyses)
      .where(eq(repositoryAnalyses.id, id));
    return analysis;
  }

  async getUserRepositoryAnalyses(userId: string): Promise<RepositoryAnalysis[]> {
    return await db
      .select()
      .from(repositoryAnalyses)
      .where(eq(repositoryAnalyses.userId, userId))
      .orderBy(sql`${repositoryAnalyses.createdAt} DESC`);
  }

  async updateRepositoryAnalysis(id: string, updates: Partial<InsertRepositoryAnalysis>): Promise<RepositoryAnalysis | undefined> {
    const [updated] = await db
      .update(repositoryAnalyses)
      .set(updates)
      .where(eq(repositoryAnalyses.id, id))
      .returning();
    return updated;
  }

  async deleteRepositoryAnalysis(id: string): Promise<void> {
    await db.delete(repositoryAnalyses).where(eq(repositoryAnalyses.id, id));
  }

  async verifyRepositoryAnalysisOwnership(analysisId: string, userId: string): Promise<boolean> {
    const [analysis] = await db
      .select({ userId: repositoryAnalyses.userId })
      .from(repositoryAnalyses)
      .where(eq(repositoryAnalyses.id, analysisId));
    return analysis?.userId === userId;
  }

  // Repository import operations
  async createRepositoryImport(importData: InsertRepositoryImport): Promise<RepositoryImport> {
    const [created] = await db.insert(repositoryImports).values(importData).returning();
    return created;
  }

  async getRepositoryImport(id: string): Promise<RepositoryImport | undefined> {
    const [importRecord] = await db
      .select()
      .from(repositoryImports)
      .where(eq(repositoryImports.id, id));
    return importRecord;
  }

  async getUserRepositoryImports(userId: string): Promise<RepositoryImport[]> {
    return await db
      .select()
      .from(repositoryImports)
      .where(eq(repositoryImports.userId, userId))
      .orderBy(sql`${repositoryImports.createdAt} DESC`);
  }

  async getImportsByAnalysisId(analysisId: string): Promise<RepositoryImport[]> {
    return await db
      .select()
      .from(repositoryImports)
      .where(eq(repositoryImports.analysisId, analysisId))
      .orderBy(sql`${repositoryImports.createdAt} DESC`);
  }

  // Detected tools operations
  async createDetectedTools(tools: InsertDetectedTool[]): Promise<DetectedTool[]> {
    if (tools.length === 0) return [];
    const created = await db.insert(detectedTools).values(tools).returning();
    return created;
  }

  async getDetectedToolsByAnalysisId(analysisId: string): Promise<(DetectedTool & { tool?: Tool; suggestedToolRef?: Tool })[]> {
    const result = await db
      .select({
        detectedTool: detectedTools,
        tool: tools,
        suggestedTool: sql<Tool>`suggested_tool_table.*`.as('suggestedTool')
      })
      .from(detectedTools)
      .leftJoin(tools, eq(detectedTools.toolId, tools.id))
      .leftJoin(
        sql`${tools} as suggested_tool_table`, 
        eq(detectedTools.suggestedTool, sql`suggested_tool_table.id`)
      )
      .where(eq(detectedTools.analysisId, analysisId))
      .orderBy(sql`${detectedTools.confidenceScore} DESC`);

    return result.map((row: any) => ({
      ...row.detectedTool,
      tool: row.tool,
      suggestedToolRef: row.suggestedTool
    }));
  }

  async updateDetectedTool(id: string, updates: Partial<InsertDetectedTool>): Promise<DetectedTool | undefined> {
    const [updated] = await db
      .update(detectedTools)
      .set(updates)
      .where(eq(detectedTools.id, id))
      .returning();
    return updated;
  }

  async markDetectedToolAsImported(id: string): Promise<DetectedTool | undefined> {
    const [updated] = await db
      .update(detectedTools)
      .set({ isImported: true })
      .where(eq(detectedTools.id, id))
      .returning();
    return updated;
  }

  // Task generation and management operations
  async getSavedIdea(id: string): Promise<SavedIdea | undefined> {
    const [idea] = await db.select().from(savedIdeas).where(eq(savedIdeas.id, id));
    return idea;
  }

  async createTaskGeneration(generation: InsertTaskGeneration): Promise<TaskGeneration> {
    const [created] = await db.insert(taskGenerations).values(generation).returning();
    return created;
  }

  async updateTaskGeneration(id: string, updates: Partial<InsertTaskGeneration>): Promise<TaskGeneration | undefined> {
    const [updated] = await db.update(taskGenerations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(taskGenerations.id, id))
      .returning();
    return updated;
  }

  async getTaskGeneration(id: string): Promise<TaskGeneration | undefined> {
    const [generation] = await db.select().from(taskGenerations).where(eq(taskGenerations.id, id));
    return generation;
  }

  async getUserTaskGenerations(userId: string): Promise<TaskGeneration[]> {
    const generations = await db.select()
      .from(taskGenerations)
      .where(eq(taskGenerations.userId, userId))
      .orderBy(sql`${taskGenerations.createdAt} DESC`);
    return generations;
  }

  async createProjectTask(task: InsertProjectTask): Promise<ProjectTask> {
    const [created] = await db.insert(projectTasks).values(task).returning();
    return created;
  }

  async updateProjectTask(id: string, updates: UpdateProjectTask): Promise<ProjectTask | undefined> {
    const [updated] = await db.update(projectTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectTasks.id, id))
      .returning();
    return updated;
  }

  async deleteProjectTask(id: string): Promise<void> {
    // First delete all dependencies
    await db.delete(taskDependencies)
      .where(
        sql`${taskDependencies.taskId} = ${id} OR ${taskDependencies.dependsOnTaskId} = ${id}`
      );
    
    // Then delete the task
    await db.delete(projectTasks).where(eq(projectTasks.id, id));
  }

  async getUserTasks(userId: string): Promise<ProjectTask[]> {
    const tasks = await db.select()
      .from(projectTasks)
      .where(eq(projectTasks.userId, userId))
      .orderBy(sql`${projectTasks.createdAt} DESC`);
    return tasks;
  }

  async getTasksByGeneration(generationId: string): Promise<ProjectTask[]> {
    const tasks = await db.select()
      .from(projectTasks)
      .where(eq(projectTasks.generationId, generationId))
      .orderBy(sql`${projectTasks.priority} DESC, ${projectTasks.createdAt} ASC`);
    return tasks;
  }

  async verifyTaskOwnership(taskId: string, userId: string): Promise<boolean> {
    const [task] = await db.select({ userId: projectTasks.userId })
      .from(projectTasks)
      .where(eq(projectTasks.id, taskId));
    return task?.userId === userId;
  }

  async createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
    const [created] = await db.insert(taskDependencies).values(dependency).returning();
    return created;
  }

  async getTaskDependenciesByGeneration(generationId: string): Promise<TaskDependency[]> {
    const dependencies = await db.select()
      .from(taskDependencies)
      .innerJoin(projectTasks, eq(taskDependencies.taskId, projectTasks.id))
      .where(eq(projectTasks.generationId, generationId));
    
    return dependencies.map(d => d.task_dependencies);
  }

  async checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // Simple implementation: check if dependsOnTaskId depends on taskId (direct circular)
    const [dependency] = await db.select()
      .from(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, dependsOnTaskId),
          eq(taskDependencies.dependsOnTaskId, taskId)
        )
      );
    
    if (dependency) return true;

    // TODO: Implement deeper circular dependency detection using recursive queries
    // For now, just check direct circular dependencies
    return false;
  }

  async getTaskMetrics(generationId: string): Promise<TaskMetrics> {
    const tasks = await this.getTasksByGeneration(generationId);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    
    const totalEstimatedHours = tasks.reduce((sum, task) => {
      return sum + parseFloat(task.estimatedHours || '0');
    }, 0);
    
    const totalActualHours = tasks.reduce((sum, task) => {
      return sum + parseFloat(task.actualHours || '0');
    }, 0);

    // Calculate average complexity
    const complexityScores = { low: 1, medium: 2, high: 3 };
    const avgComplexityScore = tasks.length > 0 
      ? tasks.reduce((sum, task) => sum + complexityScores[task.complexity as keyof typeof complexityScores], 0) / tasks.length
      : 1;
    const averageTaskComplexity: "low" | "medium" | "high" = 
      avgComplexityScore <= 1.5 ? "low" : avgComplexityScore <= 2.5 ? "medium" : "high";

    const projectCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Simple estimated remaining time calculation
    const remainingTasks = totalTasks - completedTasks;
    const avgHoursPerTask = completedTasks > 0 && totalActualHours > 0 
      ? totalActualHours / completedTasks 
      : totalEstimatedHours / Math.max(totalTasks, 1);
    const estimatedRemainingHours = remainingTasks * avgHoursPerTask;
    const estimatedRemainingTime = estimatedRemainingHours < 40 
      ? `${Math.ceil(estimatedRemainingHours)} hours`
      : `${Math.ceil(estimatedRemainingHours / 8)} days`;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      totalEstimatedHours,
      totalActualHours,
      averageTaskComplexity,
      projectCompletionPercentage,
      estimatedRemainingTime
    };
  }

  async getTaskCategories(): Promise<TaskCategory[]> {
    const categories = await db.select().from(taskCategories);
    
    // If no categories exist, create default ones
    if (categories.length === 0) {
      const defaultCategories = [
        { id: 'setup', name: 'Setup & Infrastructure', description: 'Project initialization and infrastructure setup', color: '#6366f1', icon: 'Settings' },
        { id: 'frontend', name: 'Frontend Development', description: 'UI/UX design and frontend implementation', color: '#8b5cf6', icon: 'Monitor' },
        { id: 'backend', name: 'Backend Development', description: 'Server-side logic and API development', color: '#10b981', icon: 'Server' },
        { id: 'database', name: 'Database Design', description: 'Database schema and data management', color: '#f59e0b', icon: 'Database' },
        { id: 'auth', name: 'Authentication', description: 'User authentication and authorization', color: '#ef4444', icon: 'Shield' },
        { id: 'testing', name: 'Testing & QA', description: 'Quality assurance and testing', color: '#06b6d4', icon: 'CheckCircle' },
        { id: 'docs', name: 'Documentation', description: 'Technical and user documentation', color: '#84cc16', icon: 'FileText' },
        { id: 'devops', name: 'DevOps & Deployment', description: 'Deployment and operations', color: '#f97316', icon: 'Upload' },
        { id: 'integration', name: 'Integrations', description: 'Third-party services and APIs', color: '#ec4899', icon: 'Link' }
      ];

      for (const category of defaultCategories) {
        await db.insert(taskCategories).values(category).onConflictDoNothing();
      }

      return await db.select().from(taskCategories);
    }

    return categories;
  }

  async createTaskCategory(category: InsertTaskCategory): Promise<TaskCategory> {
    const [created] = await db.insert(taskCategories).values(category).returning();
    return created;
  }

  // Documentation system operations implementation
  
  // Doc categories operations
  async getAllDocCategories(): Promise<DocCategory[]> {
    return await db.select().from(docCategories)
      .where(eq(docCategories.isVisible, true))
      .orderBy(asc(docCategories.level), asc(docCategories.sortOrder), asc(docCategories.name));
  }

  async getDocCategoriesHierarchy(): Promise<DocCategoryWithStats[]> {
    const categories = await db.select({
      category: docCategories,
      articleCount: count(documentationArticles.id).as('articleCount')
    })
    .from(docCategories)
    .leftJoin(documentationArticles, 
      and(
        eq(docCategories.id, documentationArticles.categoryId),
        eq(documentationArticles.isPublished, true)
      )
    )
    .where(eq(docCategories.isVisible, true))
    .groupBy(docCategories.id)
    .orderBy(asc(docCategories.level), asc(docCategories.sortOrder), asc(docCategories.name));

    // Build hierarchy structure
    const categoryMap = new Map<string, DocCategoryWithStats>();
    const rootCategories: DocCategoryWithStats[] = [];

    categories.forEach(row => {
      const category: DocCategoryWithStats = {
        ...row.category,
        articleCount: row.articleCount || 0,
        children: []
      };
      categoryMap.set(category.id, category);
      
      if (!category.parentId) {
        rootCategories.push(category);
      }
    });

    // Connect children to parents
    categoryMap.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children!.push(category);
        }
      }
    });

    return rootCategories;
  }

  async getDocCategory(id: string): Promise<DocCategory | undefined> {
    const [category] = await db.select().from(docCategories).where(eq(docCategories.id, id));
    return category;
  }

  async getDocCategoryBySlug(slug: string): Promise<DocCategory | undefined> {
    const [category] = await db.select().from(docCategories).where(eq(docCategories.slug, slug));
    return category;
  }

  async createDocCategory(category: InsertDocCategory): Promise<DocCategory> {
    const [created] = await db.insert(docCategories).values(category).returning();
    return created;
  }

  async updateDocCategory(id: string, updates: Partial<InsertDocCategory>): Promise<DocCategory | undefined> {
    const [updated] = await db.update(docCategories)
      .set(updates)
      .where(eq(docCategories.id, id))
      .returning();
    return updated;
  }

  async deleteDocCategory(id: string): Promise<void> {
    await db.delete(docCategories).where(eq(docCategories.id, id));
  }

  // Doc tags operations
  async getAllDocTags(): Promise<DocTag[]> {
    return await db.select().from(docTags)
      .where(eq(docTags.isVisible, true))
      .orderBy(desc(docTags.usageCount), asc(docTags.name));
  }

  async getPopularDocTags(limit: number = 20): Promise<DocTag[]> {
    return await db.select().from(docTags)
      .where(eq(docTags.isVisible, true))
      .orderBy(desc(docTags.usageCount))
      .limit(limit);
  }

  async getDocTag(id: string): Promise<DocTag | undefined> {
    const [tag] = await db.select().from(docTags).where(eq(docTags.id, id));
    return tag;
  }

  async getDocTagBySlug(slug: string): Promise<DocTag | undefined> {
    const [tag] = await db.select().from(docTags).where(eq(docTags.slug, slug));
    return tag;
  }

  async createDocTag(tag: InsertDocTag): Promise<DocTag> {
    const [created] = await db.insert(docTags).values(tag).returning();
    return created;
  }

  async updateDocTag(id: string, updates: Partial<InsertDocTag>): Promise<DocTag | undefined> {
    const [updated] = await db.update(docTags)
      .set(updates)
      .where(eq(docTags.id, id))
      .returning();
    return updated;
  }

  async deleteDocTag(id: string): Promise<void> {
    await db.delete(docTags).where(eq(docTags.id, id));
  }

  // Documentation articles operations
  async getAllDocumentationArticles(filters: {
    categoryId?: string;
    contentType?: string;
    difficulty?: string;
    isPublished?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<DocumentationArticle[]> {
    let query = db.select().from(documentationArticles);
    
    const conditions = [];
    
    if (filters.categoryId) {
      conditions.push(eq(documentationArticles.categoryId, filters.categoryId));
    }
    
    if (filters.contentType) {
      conditions.push(eq(documentationArticles.contentType, filters.contentType));
    }
    
    if (filters.difficulty) {
      conditions.push(eq(documentationArticles.difficulty, filters.difficulty));
    }
    
    if (filters.isPublished !== undefined) {
      conditions.push(eq(documentationArticles.isPublished, filters.isPublished));
    } else {
      conditions.push(eq(documentationArticles.isPublished, true));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(documentationArticles.isFeatured), desc(documentationArticles.viewCount), desc(documentationArticles.updatedAt));

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async searchDocumentation(request: DocSearchRequest, userId?: string): Promise<DocSearchResponse> {
    const startTime = Date.now();
    
    let query = db.select({
      article: documentationArticles,
      category: docCategories
    })
    .from(documentationArticles)
    .innerJoin(docCategories, eq(documentationArticles.categoryId, docCategories.id));

    const conditions = [eq(documentationArticles.isPublished, true)];
    
    // Full-text search on title and content
    if (request.q) {
      conditions.push(
        or(
          ilike(documentationArticles.title, `%${request.q}%`),
          ilike(documentationArticles.content, `%${request.q}%`),
          ilike(documentationArticles.excerpt, `%${request.q}%`)
        )
      );
    }

    // Apply filters
    if (request.category) {
      conditions.push(eq(documentationArticles.categoryId, request.category));
    }

    if (request.contentType) {
      conditions.push(eq(documentationArticles.contentType, request.contentType));
    }

    if (request.difficulty) {
      conditions.push(eq(documentationArticles.difficulty, request.difficulty));
    }

    if (request.frameworks && request.frameworks.length > 0) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM unnest(${documentationArticles.frameworks}) AS framework WHERE framework = ANY(${request.frameworks}))`
      );
    }

    if (request.languages && request.languages.length > 0) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM unnest(${documentationArticles.languages}) AS language WHERE language = ANY(${request.languages}))`
      );
    }

    query = query.where(and(...conditions));

    // Order by relevance (simplified - could be more sophisticated)
    query = query.orderBy(
      desc(documentationArticles.isFeatured),
      desc(documentationArticles.viewCount),
      desc(documentationArticles.updatedAt)
    );

    const limit = request.limit ? parseInt(request.limit) : 20;
    const offset = request.offset ? parseInt(request.offset) : 0;
    
    // Get total count
    const totalCountResult = await db.select({ count: count() })
      .from(documentationArticles)
      .innerJoin(docCategories, eq(documentationArticles.categoryId, docCategories.id))
      .where(and(...conditions));
    
    const totalCount = totalCountResult[0]?.count || 0;

    // Get results
    const results = await query.limit(limit).offset(offset);

    // Get tags for articles
    const articleIds = results.map(r => r.article.id);
    const articleTags = articleIds.length > 0 
      ? await db.select({
          articleId: docArticleTags.articleId,
          tag: docTags
        })
        .from(docArticleTags)
        .innerJoin(docTags, eq(docArticleTags.tagId, docTags.id))
        .where(inArray(docArticleTags.articleId, articleIds))
      : [];

    const tagsByArticle = articleTags.reduce((acc, item) => {
      if (!acc[item.articleId]) acc[item.articleId] = [];
      acc[item.articleId].push(item.tag);
      return acc;
    }, {} as Record<string, DocTag[]>);

    const searchTime = Date.now() - startTime;

    // Build search results
    const searchResults: DocSearchResult[] = results.map(row => ({
      id: row.article.id,
      title: row.article.title,
      slug: row.article.slug,
      excerpt: row.article.excerpt || undefined,
      contentType: row.article.contentType,
      difficulty: row.article.difficulty,
      estimatedReadTime: row.article.estimatedReadTime || undefined,
      category: {
        id: row.category.id,
        name: row.category.name,
        slug: row.category.slug,
      },
      tags: tagsByArticle[row.article.id] || [],
      viewCount: row.article.viewCount || 0,
      relevanceScore: 1, // Simplified relevance score
      lastUpdated: row.article.updatedAt?.toISOString() || row.article.createdAt?.toISOString() || '',
    }));

    // Get facets for filtering
    const facets = {
      categories: [],
      tags: [],
      contentTypes: [],
      difficulties: [],
    } as DocSearchResponse['facets'];

    return {
      results: searchResults,
      totalCount,
      searchTime,
      facets,
    };
  }

  async getDocumentationArticle(id: string, userId?: string): Promise<DocumentationArticleWithDetails | undefined> {
    const result = await db.select({
      article: documentationArticles,
      category: docCategories,
      author: users
    })
    .from(documentationArticles)
    .innerJoin(docCategories, eq(documentationArticles.categoryId, docCategories.id))
    .leftJoin(users, eq(documentationArticles.authorId, users.id))
    .where(eq(documentationArticles.id, id));

    if (!result[0]) return undefined;

    const { article, category, author } = result[0];

    // Get tags
    const articleTags = await db.select({
      articleTag: docArticleTags,
      tag: docTags
    })
    .from(docArticleTags)
    .innerJoin(docTags, eq(docArticleTags.tagId, docTags.id))
    .where(eq(docArticleTags.articleId, id));

    // Get ratings
    const ratingsData = await this.getDocumentationRatings(id);

    // Check if user has bookmarked
    let isBookmarked = false;
    let userRating: DocRating | undefined;
    
    if (userId) {
      const [bookmark] = await db.select().from(userDocBookmarks)
        .where(and(eq(userDocBookmarks.userId, userId), eq(userDocBookmarks.articleId, id)));
      isBookmarked = !!bookmark;

      userRating = await this.getUserDocRating(userId, id);
    }

    return {
      ...article,
      category,
      author: author || undefined,
      tags: articleTags.map(at => ({ ...at.articleTag, tag: at.tag })),
      averageRating: ratingsData.averageRating,
      totalRatings: ratingsData.totalRatings,
      isBookmarked,
      userRating,
    };
  }

  async getDocumentationArticleBySlug(slug: string, userId?: string): Promise<DocumentationArticleWithDetails | undefined> {
    const [article] = await db.select().from(documentationArticles).where(eq(documentationArticles.slug, slug));
    
    if (!article) return undefined;
    
    return this.getDocumentationArticle(article.id, userId);
  }

  async createDocumentationArticle(article: InsertDocumentationArticle): Promise<DocumentationArticle> {
    // Generate search vector for full-text search
    const searchVector = `${article.title} ${article.excerpt || ''} ${article.content}`;
    
    const [created] = await db.insert(documentationArticles).values({
      ...article,
      searchVector: searchVector
    }).returning();
    return created;
  }

  async updateDocumentationArticle(id: string, updates: Partial<InsertDocumentationArticle>): Promise<DocumentationArticle | undefined> {
    // Update search vector if content changed
    if (updates.title || updates.excerpt || updates.content) {
      const article = await db.select().from(documentationArticles).where(eq(documentationArticles.id, id));
      if (article[0]) {
        const searchVector = `${updates.title || article[0].title} ${updates.excerpt || article[0].excerpt || ''} ${updates.content || article[0].content}`;
        updates.searchVector = searchVector;
      }
    }

    const [updated] = await db.update(documentationArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentationArticles.id, id))
      .returning();
    return updated;
  }

  async deleteDocumentationArticle(id: string): Promise<void> {
    await db.delete(documentationArticles).where(eq(documentationArticles.id, id));
  }

  async incrementDocumentationView(articleId: string, userId?: string, sessionId?: string): Promise<void> {
    // Record view
    await db.insert(docViews).values({
      articleId,
      userId,
      sessionId
    });

    // Increment view count
    await db.update(documentationArticles)
      .set({ 
        viewCount: sql`${documentationArticles.viewCount} + 1` 
      })
      .where(eq(documentationArticles.id, articleId));
  }

  // Featured and popular content
  async getFeaturedDocumentation(): Promise<DocumentationArticle[]> {
    return await db.select().from(documentationArticles)
      .where(and(eq(documentationArticles.isFeatured, true), eq(documentationArticles.isPublished, true)))
      .orderBy(desc(documentationArticles.updatedAt))
      .limit(10);
  }

  async getPopularDocumentation(limit: number = 10): Promise<DocumentationArticle[]> {
    return await db.select().from(documentationArticles)
      .where(eq(documentationArticles.isPublished, true))
      .orderBy(desc(documentationArticles.viewCount))
      .limit(limit);
  }

  async getRecentDocumentation(limit: number = 10): Promise<DocumentationArticle[]> {
    return await db.select().from(documentationArticles)
      .where(eq(documentationArticles.isPublished, true))
      .orderBy(desc(documentationArticles.updatedAt))
      .limit(limit);
  }

  async getRelatedDocumentation(articleId: string, limit: number = 5): Promise<DocumentationArticle[]> {
    // Get current article to find related content
    const [currentArticle] = await db.select().from(documentationArticles).where(eq(documentationArticles.id, articleId));
    
    if (!currentArticle) return [];

    // Find articles in same category or with overlapping tags (simplified)
    return await db.select().from(documentationArticles)
      .where(
        and(
          eq(documentationArticles.isPublished, true),
          eq(documentationArticles.categoryId, currentArticle.categoryId),
          sql`${documentationArticles.id} != ${articleId}`
        )
      )
      .orderBy(desc(documentationArticles.viewCount))
      .limit(limit);
  }

  // User bookmarks operations
  async getUserDocBookmarks(userId: string): Promise<(UserDocBookmark & { article: DocumentationArticle })[]> {
    const result = await db.select({
      bookmark: userDocBookmarks,
      article: documentationArticles
    })
    .from(userDocBookmarks)
    .innerJoin(documentationArticles, eq(userDocBookmarks.articleId, documentationArticles.id))
    .where(eq(userDocBookmarks.userId, userId))
    .orderBy(desc(userDocBookmarks.createdAt));

    return result.map(row => ({
      ...row.bookmark,
      article: row.article
    }));
  }

  async createDocBookmark(userId: string, articleId: string, notes?: string): Promise<UserDocBookmark> {
    const [created] = await db.insert(userDocBookmarks).values({
      userId,
      articleId,
      notes
    }).returning();
    return created;
  }

  async updateDocBookmark(id: string, notes: string): Promise<UserDocBookmark | undefined> {
    const [updated] = await db.update(userDocBookmarks)
      .set({ notes })
      .where(eq(userDocBookmarks.id, id))
      .returning();
    return updated;
  }

  async deleteDocBookmark(userId: string, articleId: string): Promise<void> {
    await db.delete(userDocBookmarks)
      .where(and(eq(userDocBookmarks.userId, userId), eq(userDocBookmarks.articleId, articleId)));
  }

  async verifyDocBookmarkOwnership(bookmarkId: string, userId: string): Promise<boolean> {
    const [bookmark] = await db.select({ userId: userDocBookmarks.userId })
      .from(userDocBookmarks)
      .where(eq(userDocBookmarks.id, bookmarkId));
    return bookmark?.userId === userId;
  }

  // User search history operations
  async getUserDocSearchHistory(userId: string, limit: number = 20): Promise<DocSearchHistory[]> {
    return await db.select().from(docSearchHistory)
      .where(eq(docSearchHistory.userId, userId))
      .orderBy(desc(docSearchHistory.searchedAt))
      .limit(limit);
  }

  async createDocSearchHistory(searchHistory: InsertDocSearchHistory): Promise<DocSearchHistory> {
    const [created] = await db.insert(docSearchHistory).values(searchHistory).returning();
    return created;
  }

  async deleteDocSearchHistory(userId: string, searchQuery?: string): Promise<void> {
    if (searchQuery) {
      await db.delete(docSearchHistory)
        .where(and(eq(docSearchHistory.userId, userId), eq(docSearchHistory.query, searchQuery)));
    } else {
      await db.delete(docSearchHistory).where(eq(docSearchHistory.userId, userId));
    }
  }

  // Doc ratings operations
  async getDocumentationRatings(articleId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
  }> {
    const ratingsData = await db.select({
      rating: docRatings.rating,
      count: count()
    })
    .from(docRatings)
    .where(eq(docRatings.articleId, articleId))
    .groupBy(docRatings.rating);

    const averageData = await db.select({
      avg: avg(docRatings.rating),
      count: count()
    })
    .from(docRatings)
    .where(eq(docRatings.articleId, articleId));

    const averageRating = averageData[0]?.avg ? parseFloat(averageData[0].avg) : 0;
    const totalRatings = averageData[0]?.count || 0;

    const ratingDistribution = ratingsData.map(r => ({
      rating: r.rating,
      count: r.count
    }));

    return {
      averageRating,
      totalRatings,
      ratingDistribution
    };
  }

  async getUserDocRating(userId: string, articleId: string): Promise<DocRating | undefined> {
    const [rating] = await db.select().from(docRatings)
      .where(and(eq(docRatings.userId, userId), eq(docRatings.articleId, articleId)));
    return rating;
  }

  async createDocRating(rating: InsertDocRating): Promise<DocRating> {
    const [created] = await db.insert(docRatings).values({
      ...rating,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updateDocRating(id: string, updates: Partial<InsertDocRating>): Promise<DocRating | undefined> {
    const [updated] = await db.update(docRatings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(docRatings.id, id))
      .returning();
    return updated;
  }

  async deleteDocRating(userId: string, articleId: string): Promise<void> {
    await db.delete(docRatings)
      .where(and(eq(docRatings.userId, userId), eq(docRatings.articleId, articleId)));
  }

  // Doc analytics operations
  async getDocumentationAnalytics(): Promise<{
    totalArticles: number;
    totalViews: number;
    totalBookmarks: number;
    averageRating: number;
    popularCategories: Array<{ categoryName: string; count: number }>;
    topSearchQueries: Array<{ query: string; count: number }>;
  }> {
    // Get basic counts
    const [articleStats] = await db.select({
      totalArticles: count(),
      totalViews: sql<number>`COALESCE(SUM(${documentationArticles.viewCount}), 0)`
    })
    .from(documentationArticles)
    .where(eq(documentationArticles.isPublished, true));

    const [bookmarkStats] = await db.select({
      totalBookmarks: count()
    }).from(userDocBookmarks);

    const [ratingStats] = await db.select({
      averageRating: avg(docRatings.rating)
    }).from(docRatings);

    // Get popular categories
    const popularCategories = await db.select({
      categoryName: docCategories.name,
      count: count()
    })
    .from(documentationArticles)
    .innerJoin(docCategories, eq(documentationArticles.categoryId, docCategories.id))
    .where(eq(documentationArticles.isPublished, true))
    .groupBy(docCategories.name)
    .orderBy(desc(count()))
    .limit(10);

    // Get top search queries
    const topSearchQueries = await db.select({
      query: docSearchHistory.query,
      count: count()
    })
    .from(docSearchHistory)
    .groupBy(docSearchHistory.query)
    .orderBy(desc(count()))
    .limit(10);

    return {
      totalArticles: articleStats?.totalArticles || 0,
      totalViews: articleStats?.totalViews || 0,
      totalBookmarks: bookmarkStats?.totalBookmarks || 0,
      averageRating: ratingStats?.averageRating ? parseFloat(ratingStats.averageRating) : 0,
      popularCategories: popularCategories.map(pc => ({
        categoryName: pc.categoryName,
        count: pc.count
      })),
      topSearchQueries: topSearchQueries.map(tq => ({
        query: tq.query,
        count: tq.count
      }))
    };
  }

  // Enhanced Project Planning Operations Implementation
  // Projects CRUD operations
  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string, filters: {
    status?: string;
    projectType?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Project[]> {
    const conditions: SQL[] = [eq(projects.userId, userId)];

    if (filters.status) {
      conditions.push(eq(projects.status, filters.status));
    }
    if (filters.projectType) {
      conditions.push(eq(projects.projectType, filters.projectType));
    }
    if (filters.priority) {
      conditions.push(eq(projects.priority, filters.priority));
    }

    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);

    const result = await db.select()
      .from(projects)
      .where(whereCondition)
      .orderBy(desc(projects.lastActivityAt), desc(projects.createdAt));

    let filteredResult = result;
    if (filters.offset) {
      filteredResult = filteredResult.slice(filters.offset);
    }
    if (filters.limit) {
      filteredResult = filteredResult.slice(0, filters.limit);
    }

    return filteredResult;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async verifyProjectOwnership(projectId: string, userId: string): Promise<boolean> {
    const [project] = await db.select({ userId: projects.userId, ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.id, projectId));
    return project?.userId === userId || project?.ownerId === userId;
  }

  // Project phases operations
  async createProjectPhase(phase: InsertProjectPhase): Promise<ProjectPhase> {
    const [created] = await db.insert(projectPhases).values(phase).returning();
    return created;
  }

  async getProjectPhases(projectId: string): Promise<ProjectPhase[]> {
    return db.select().from(projectPhases)
      .where(eq(projectPhases.projectId, projectId))
      .orderBy(asc(projectPhases.orderIndex));
  }

  async updateProjectPhase(id: string, updates: Partial<InsertProjectPhase>): Promise<ProjectPhase | undefined> {
    const [updated] = await db.update(projectPhases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectPhases.id, id))
      .returning();
    return updated;
  }

  async deleteProjectPhase(id: string): Promise<void> {
    await db.delete(projectPhases).where(eq(projectPhases.id, id));
  }

  async reorderProjectPhases(projectId: string, phaseIds: string[]): Promise<void> {
    for (let i = 0; i < phaseIds.length; i++) {
      await db.update(projectPhases)
        .set({ orderIndex: i, updatedAt: new Date() })
        .where(and(eq(projectPhases.id, phaseIds[i]), eq(projectPhases.projectId, projectId)));
    }
  }

  // Project milestones operations
  async createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone> {
    const [created] = await db.insert(projectMilestones).values(milestone).returning();
    return created;
  }

  async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    return db.select().from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(asc(projectMilestones.targetDate));
  }

  async updateProjectMilestone(id: string, updates: Partial<InsertProjectMilestone>): Promise<ProjectMilestone | undefined> {
    const [updated] = await db.update(projectMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectMilestones.id, id))
      .returning();
    return updated;
  }

  async deleteProjectMilestone(id: string): Promise<void> {
    await db.delete(projectMilestones).where(eq(projectMilestones.id, id));
  }

  async getMilestonesByDateRange(projectId: string, startDate: Date, endDate: Date): Promise<ProjectMilestone[]> {
    return db.select().from(projectMilestones)
      .where(
        and(
          eq(projectMilestones.projectId, projectId),
          sql`${projectMilestones.targetDate} >= ${startDate}`,
          sql`${projectMilestones.targetDate} <= ${endDate}`
        )
      )
      .orderBy(asc(projectMilestones.targetDate));
  }

  async getUpcomingMilestones(userId: string, daysAhead: number): Promise<(ProjectMilestone & { project: Project })[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const result = await db.select()
      .from(projectMilestones)
      .innerJoin(projects, eq(projectMilestones.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, userId),
          sql`${projectMilestones.targetDate} <= ${endDate}`,
          eq(projectMilestones.status, 'pending')
        )
      )
      .orderBy(asc(projectMilestones.targetDate));

    return result.map((row: any) => ({
      ...row.project_milestones,
      project: row.projects
    }));
  }

  // Project resources operations
  async createProjectResource(resource: InsertProjectResource): Promise<ProjectResource> {
    const [created] = await db.insert(projectResources).values(resource).returning();
    return created;
  }

  async getProjectResources(projectId: string, resourceType?: string): Promise<ProjectResource[]> {
    const conditions: SQL[] = [eq(projectResources.projectId, projectId)];

    if (resourceType) {
      conditions.push(eq(projectResources.resourceType, resourceType));
    }

    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);

    return db.select()
      .from(projectResources)
      .where(whereCondition)
      .orderBy(asc(projectResources.createdAt));
  }

  async updateProjectResource(id: string, updates: Partial<InsertProjectResource>): Promise<ProjectResource | undefined> {
    const [updated] = await db.update(projectResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectResources.id, id))
      .returning();
    return updated;
  }

  async deleteProjectResource(id: string): Promise<void> {
    await db.delete(projectResources).where(eq(projectResources.id, id));
  }

  async getUserResourceAllocations(userId: string): Promise<(ProjectResource & { project: Project })[]> {
    const result = await db.select()
      .from(projectResources)
      .innerJoin(projects, eq(projectResources.projectId, projects.id))
      .where(
        and(
          or(
            eq(projectResources.resourceId, userId),
            eq(projects.userId, userId)
          ),
          eq(projectResources.isActive, true)
        )
      )
      .orderBy(desc(projectResources.createdAt));

    return result.map((row: any) => ({
      ...row.project_resources,
      project: row.projects
    }));
  }

  async getResourceUtilization(resourceId: string, startDate: Date, endDate: Date): Promise<{
    totalAllocated: number;
    totalUsed: number;
    utilizationRate: number;
    projects: Array<{ projectId: string; projectName: string; allocation: number }>;
  }> {
    const resources = await db.select()
      .from(projectResources)
      .innerJoin(projects, eq(projectResources.projectId, projects.id))
      .where(
        and(
          eq(projectResources.resourceId, resourceId),
          sql`${projectResources.availableFrom} <= ${endDate}`,
          sql`${projectResources.availableUntil} >= ${startDate}`
        )
      );

    const totalAllocated = resources.reduce((sum: number, r: any) => 
      sum + parseFloat(r.project_resources.totalHoursAllocated || '0'), 0);
    const totalUsed = resources.reduce((sum: number, r: any) => 
      sum + parseFloat(r.project_resources.hoursUsed || '0'), 0);
    const utilizationRate = totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;

    const projectBreakdown = resources.map((r: any) => ({
      projectId: r.projects.id,
      projectName: r.projects.name,
      allocation: parseFloat(r.project_resources.allocationPercentage || '0')
    }));

    return {
      totalAllocated,
      totalUsed,
      utilizationRate,
      projects: projectBreakdown
    };
  }

  // Project budgets operations
  async createProjectBudget(budget: InsertProjectBudget): Promise<ProjectBudget> {
    const [created] = await db.insert(projectBudgets).values(budget).returning();
    return created;
  }

  async getProjectBudgets(projectId: string): Promise<ProjectBudget[]> {
    return db.select().from(projectBudgets)
      .where(eq(projectBudgets.projectId, projectId))
      .orderBy(asc(projectBudgets.budgetCategory));
  }

  async updateProjectBudget(id: string, updates: Partial<InsertProjectBudget>): Promise<ProjectBudget | undefined> {
    const [updated] = await db.update(projectBudgets)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(projectBudgets.id, id))
      .returning();
    return updated;
  }

  async deleteProjectBudget(id: string): Promise<void> {
    await db.delete(projectBudgets).where(eq(projectBudgets.id, id));
  }

  async getBudgetSummary(projectId: string): Promise<{
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    budgetsByCategory: Array<{
      category: string;
      allocated: number;
      spent: number;
      remaining: number;
      variance: number;
    }>;
    projectedCompletion: Date | null;
  }> {
    const budgets = await this.getProjectBudgets(projectId);
    
    const totalAllocated = budgets.reduce((sum, b) => sum + parseFloat(b.allocatedAmount || '0'), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spentAmount || '0'), 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + parseFloat(b.remainingAmount || '0'), 0);

    const budgetsByCategory = budgets.map(b => ({
      category: b.budgetCategory,
      allocated: parseFloat(b.allocatedAmount || '0'),
      spent: parseFloat(b.spentAmount || '0'),
      remaining: parseFloat(b.remainingAmount || '0'),
      variance: parseFloat(b.variancePercentage || '0')
    }));

    // Simple projection based on current spending rate
    let projectedCompletion: Date | null = null;
    const avgSpendingRate = budgets.reduce((sum, b) => sum + parseFloat(b.spendingRate || '0'), 0) / budgets.length;
    if (avgSpendingRate > 0 && totalRemaining > 0) {
      const daysToCompletion = totalRemaining / avgSpendingRate;
      projectedCompletion = new Date();
      projectedCompletion.setDate(projectedCompletion.getDate() + daysToCompletion);
    }

    return {
      totalAllocated,
      totalSpent,
      totalRemaining,
      budgetsByCategory,
      projectedCompletion
    };
  }

  async trackBudgetExpense(projectId: string, budgetId: string, amount: number, description?: string): Promise<void> {
    const budget = await db.select().from(projectBudgets).where(eq(projectBudgets.id, budgetId)).limit(1);
    if (budget[0]) {
      const newSpent = parseFloat(budget[0].spentAmount || '0') + amount;
      const newRemaining = parseFloat(budget[0].allocatedAmount || '0') - newSpent;
      
      await db.update(projectBudgets)
        .set({
          spentAmount: newSpent.toString(),
          remainingAmount: newRemaining.toString(),
          lastUpdated: new Date()
        })
        .where(eq(projectBudgets.id, budgetId));
    }
  }

  // Project timelines operations
  async createProjectTimeline(timeline: InsertProjectTimeline): Promise<ProjectTimeline> {
    const [created] = await db.insert(projectTimelines).values(timeline).returning();
    return created;
  }

  async getProjectTimelines(projectId: string): Promise<ProjectTimeline[]> {
    return db.select().from(projectTimelines)
      .where(eq(projectTimelines.projectId, projectId))
      .orderBy(asc(projectTimelines.plannedStartDate));
  }

  async updateProjectTimeline(id: string, updates: Partial<InsertProjectTimeline>): Promise<ProjectTimeline | undefined> {
    const [updated] = await db.update(projectTimelines)
      .set({ ...updates, updatedAt: new Date(), lastRecalculated: new Date() })
      .where(eq(projectTimelines.id, id))
      .returning();
    return updated;
  }

  async deleteProjectTimeline(id: string): Promise<void> {
    await db.delete(projectTimelines).where(eq(projectTimelines.id, id));
  }

  async calculateProjectSchedule(projectId: string): Promise<{
    startDate: Date;
    endDate: Date;
    totalDuration: number;
    criticalPath: string[];
    scheduleVariance: number;
    completionProbability: number;
  }> {
    const timelines = await this.getProjectTimelines(projectId);
    const tasks = await db.select().from(projectTasks).where(eq(projectTasks.userId, projectId)); // Simplified
    
    if (timelines.length === 0) {
      const now = new Date();
      return {
        startDate: now,
        endDate: now,
        totalDuration: 0,
        criticalPath: [],
        scheduleVariance: 0,
        completionProbability: 1.0
      };
    }

    const startDates = timelines.map(t => t.plannedStartDate).filter(d => d) as Date[];
    const endDates = timelines.map(t => t.plannedEndDate).filter(d => d) as Date[];
    
    const projectStartDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    const projectEndDate = new Date(Math.max(...endDates.map(d => d.getTime())));
    const totalDuration = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Simplified critical path calculation
    const criticalPath = timelines
      .filter(t => t.isCriticalPath)
      .map(t => t.id)
      .slice(0, 10); // Limit for performance

    // Calculate schedule variance
    const completedTimelines = timelines.filter(t => t.isCompleted);
    const onTimeCompletions = completedTimelines.filter(t => 
      t.actualEndDate && t.plannedEndDate && t.actualEndDate <= t.plannedEndDate
    ).length;
    const scheduleVariance = completedTimelines.length > 0 
      ? (onTimeCompletions / completedTimelines.length) * 100 - 100 
      : 0;

    // Simple completion probability based on current progress
    const avgProgress = timelines.reduce((sum, t) => sum + parseFloat(t.progressPercentage || '0'), 0) / timelines.length;
    const completionProbability = Math.min(1.0, avgProgress / 100 + 0.1);

    return {
      startDate: projectStartDate,
      endDate: projectEndDate,
      totalDuration,
      criticalPath,
      scheduleVariance,
      completionProbability
    };
  }

  async getGanttChartData(projectId: string): Promise<{
    tasks: Array<{
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      progress: number;
      dependencies: string[];
      assignees: string[];
      isCritical: boolean;
    }>;
    milestones: Array<{
      id: string;
      name: string;
      date: Date;
      status: string;
    }>;
    phases: Array<{
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      progress: number;
    }>;
  }> {
    const [tasksResult, milestonesResult, phasesResult] = await Promise.all([
      db.select().from(projectTasks).where(eq(projectTasks.userId, projectId)), // Simplified query
      this.getProjectMilestones(projectId),
      this.getProjectPhases(projectId)
    ]);

    const tasks = tasksResult.map(task => ({
      id: task.id,
      name: task.title,
      startDate: task.startDate || new Date(),
      endDate: task.dueDate || new Date(),
      progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
      dependencies: [], // Would need to fetch from taskDependencies
      assignees: task.assigneeId ? [task.assigneeId] : [],
      isCritical: false // Simplified
    }));

    const milestones = milestonesResult.map(milestone => ({
      id: milestone.id,
      name: milestone.name,
      date: milestone.targetDate,
      status: milestone.status
    }));

    const phases = phasesResult.map(phase => ({
      id: phase.id,
      name: phase.name,
      startDate: phase.startDate || new Date(),
      endDate: phase.endDate || new Date(),
      progress: parseFloat(phase.progress || '0')
    }));

    return { tasks, milestones, phases };
  }

  // Project templates operations
  async createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate> {
    const [created] = await db.insert(projectTemplates).values(template).returning();
    return created;
  }

  async getProjectTemplates(filters: {
    category?: string;
    templateType?: string;
    isPublic?: boolean;
    createdBy?: string;
    limit?: number;
  } = {}): Promise<ProjectTemplate[]> {
    let query = db.select().from(projectTemplates);

    const conditions: any[] = [];
    if (filters.category) conditions.push(eq(projectTemplates.category, filters.category));
    if (filters.templateType) conditions.push(eq(projectTemplates.templateType, filters.templateType));
    if (filters.isPublic !== undefined) conditions.push(eq(projectTemplates.isPublic, filters.isPublic));
    if (filters.createdBy) conditions.push(eq(projectTemplates.createdBy, filters.createdBy));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(projectTemplates.usageCount), desc(projectTemplates.averageRating));
    
    const results = await query;
    return filters.limit ? results.slice(0, filters.limit) : results;
  }

  async getProjectTemplate(id: string): Promise<ProjectTemplate | undefined> {
    const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, id));
    return template;
  }

  async updateProjectTemplate(id: string, updates: Partial<InsertProjectTemplate>): Promise<ProjectTemplate | undefined> {
    const [updated] = await db.update(projectTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteProjectTemplate(id: string): Promise<void> {
    await db.delete(projectTemplates).where(eq(projectTemplates.id, id));
  }

  async createProjectFromTemplate(templateId: string, userId: string, projectName: string, customizations: any = {}): Promise<Project> {
    const template = await this.getProjectTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create the main project
    const projectData: InsertProject = {
      userId,
      templateId,
      name: projectName,
      description: customizations.description || template.description,
      projectType: template.category,
      ownerId: userId,
      complexity: template.complexity,
      techStack: customizations.techStack || template.techStack,
      platforms: customizations.platforms || template.platforms,
      requiredSkills: template.requiredSkills,
      ...customizations
    };

    const project = await this.createProject(projectData);

    // Increment template usage count
    await db.update(projectTemplates)
      .set({ usageCount: sql`${projectTemplates.usageCount} + 1` })
      .where(eq(projectTemplates.id, templateId));

    return project;
  }

  // Project analytics operations
  async recordProjectAnalytics(analytics: InsertProjectAnalytics): Promise<ProjectAnalytics> {
    const [created] = await db.insert(projectAnalytics).values(analytics).returning();
    return created;
  }

  async getProjectAnalytics(projectId: string, dateRange?: { start: Date; end: Date }): Promise<ProjectAnalytics[]> {
    let query = db.select().from(projectAnalytics)
      .where(eq(projectAnalytics.projectId, projectId));

    if (dateRange) {
      query = query.where(
        and(
          sql`${projectAnalytics.recordDate} >= ${dateRange.start}`,
          sql`${projectAnalytics.recordDate} <= ${dateRange.end}`
        )
      );
    }

    return query.orderBy(desc(projectAnalytics.recordDate));
  }

  async getPortfolioAnalytics(userId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
    spentBudget: number;
    averageCompletion: number;
    projectsByStatus: Array<{ status: string; count: number; percentage: number }>;
    projectsByType: Array<{ type: string; count: number }>;
    upcomingMilestones: number;
    overdueTasks: number;
    teamUtilization: number;
    budgetVariance: number;
  }> {
    const userProjects = await this.getUserProjects(userId);

    const totalProjects = userProjects.length;
    const activeProjects = userProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const completedProjects = userProjects.filter(p => p.status === 'completed').length;

    const totalBudget = userProjects.reduce((sum, project) => sum + parseFloat(project.totalBudget || '0'), 0);
    const spentBudget = userProjects.reduce((sum, project) => sum + parseFloat(project.spentBudget || '0'), 0);
    const budgetVariance = totalBudget > 0 ? ((spentBudget - totalBudget) / totalBudget) * 100 : 0;

    const averageCompletion = totalProjects > 0
      ? userProjects.reduce((sum, project) => sum + parseFloat(project.overallProgress?.toString() || '0'), 0) / totalProjects
      : 0;

    const statusCounts = userProjects.reduce((acc, project) => {
      const status = project.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const projectsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalProjects > 0 ? (count / totalProjects) * 100 : 0
    }));

    const typeCounts = userProjects.reduce((acc, project) => {
      const type = project.projectType || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const projectsByType = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count
    }));

    const upcomingMilestonesCount = (await this.getUpcomingMilestones(userId, 30)).length;
    const overdueTaskRecords = await db.select({
      dueDate: projectTasks.dueDate,
      status: projectTasks.status
    })
      .from(projectTasks)
      .where(eq(projectTasks.userId, userId));

    const overdueTasksCount = overdueTaskRecords.filter(task =>
      task.dueDate !== null &&
      task.dueDate < new Date() &&
      task.status !== 'completed'
    ).length;

    const teamUtilization = userProjects.length > 0
      ? userProjects.reduce((sum, project) => sum + (project.teamSize || 1), 0) / userProjects.length * 20
      : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      spentBudget,
      averageCompletion,
      projectsByStatus,
      projectsByType,
      upcomingMilestones: upcomingMilestonesCount,
      overdueTasks: overdueTasksCount,
      teamUtilization,
      budgetVariance
    };
  }

  async getPortfolioOverview(userId: string): Promise<{
    recentActivity: Array<{
      id: string;
      projectName: string;
      action: string;
      timestamp: string;
      actor: string;
    }>;
    criticalAlerts: Array<{
      id: string;
      type: 'budget' | 'timeline' | 'resource' | 'risk';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      projectId: string;
      projectName: string;
    }>;
    upcomingDeadlines: Array<{
      id: string;
      name: string;
      projectName: string;
      dueDate: string;
      type: 'milestone' | 'deliverable' | 'phase';
      status: string;
    }>;
  }> {
    const projects = await this.getUserProjects(userId);

    const recentActivity = projects.slice(0, 5).map((project, index) => ({
      id: `activity-${index}`,
      projectName: project.name,
      action: index % 2 === 0 ? 'Updated project status' : 'Milestone completed',
      timestamp: new Date(Date.now() - index * 3600000).toISOString(),
      actor: 'Current User'
    }));

    const criticalAlerts: Array<{
      id: string;
      type: 'budget' | 'timeline' | 'resource' | 'risk';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      projectId: string;
      projectName: string;
    }> = [];

    projects.forEach((project) => {
      const spentBudget = parseFloat(project.spentBudget || '0');
      const totalBudget = parseFloat(project.totalBudget || '0');

      if (totalBudget > 0 && spentBudget > totalBudget * 0.9) {
        criticalAlerts.push({
          id: `budget-${project.id}`,
          type: 'budget',
          message: `${project.name} is approaching budget limit`,
          severity: spentBudget > totalBudget ? 'critical' : 'high',
          projectId: project.id,
          projectName: project.name
        });
      }

      if (project.targetEndDate) {
        const daysRemaining = Math.ceil((new Date(project.targetEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 7 && daysRemaining > 0) {
          criticalAlerts.push({
            id: `timeline-${project.id}`,
            type: 'timeline',
            message: `${project.name} deadline approaching in ${daysRemaining} days`,
            severity: daysRemaining < 3 ? 'critical' : 'high',
            projectId: project.id,
            projectName: project.name
          });
        }
      }
    });

    const upcomingDeadlines: Array<{
      id: string;
      name: string;
      projectName: string;
      dueDate: string;
      type: 'milestone' | 'deliverable' | 'phase';
      status: string;
    }> = [];

    for (const project of projects.slice(0, 10)) {
      try {
        const milestones = await this.getProjectMilestones(project.id);
        milestones
          .filter(milestone => milestone.targetDate && new Date(milestone.targetDate) > new Date())
          .slice(0, 3)
          .forEach(milestone => {
            upcomingDeadlines.push({
              id: milestone.id,
              name: milestone.name,
              projectName: project.name,
              dueDate: milestone.targetDate!.toISOString(),
              type: 'milestone',
              status: milestone.status || 'pending'
            });
          });
      } catch (error) {
        console.error(`Failed to fetch milestones for project ${project.id}:`, error);
      }
    }

    return {
      recentActivity,
      criticalAlerts,
      upcomingDeadlines
    };
  }

  async optimizePortfolioResources(userId: string): Promise<{
    currentUtilization: number;
    optimizedUtilization: number;
    resourceReallocation: Array<{
      resourceId: string;
      currentProjects: string[];
      suggestedProjects: string[];
      efficiencyGain: number;
    }>;
    recommendations: string[];
  }> {
    const projects = await this.getUserProjects(userId);
    const projectResources = await Promise.all(projects.map(project => this.getProjectResources(project.id)));

    let utilizationSum = 0;
    let resourceCount = 0;

    projectResources.forEach(resources => {
      resources.forEach(resource => {
        const utilization = resource.utilizationRate
          ? parseFloat(resource.utilizationRate)
          : parseFloat(resource.allocationPercentage || '0');

        if (!Number.isNaN(utilization)) {
          utilizationSum += utilization;
          resourceCount += 1;
        }
      });
    });

    const currentUtilization = resourceCount > 0 ? utilizationSum / resourceCount : 0;

    const targetUtilization = 85;
    const optimizedUtilization = Math.min(targetUtilization, currentUtilization + 10);

    const resourceReallocation: Array<{
      resourceId: string;
      currentProjects: string[];
      suggestedProjects: string[];
      efficiencyGain: number;
    }> = [];

    const recommendations = [
      'Balance resource allocation across projects',
      'Consider skill development for underutilized resources',
      'Implement cross-functional teams for flexibility',
      'Regular resource capacity planning meetings',
      'Monitor and adjust allocations based on project priority changes'
    ];

    return {
      currentUtilization,
      optimizedUtilization,
      resourceReallocation,
      recommendations
    };
  }
}

export const storage = new DatabaseStorage();


