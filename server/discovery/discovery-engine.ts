import {
  DiscoveryAPIManager,
  NPMClient,
  PyPIClient,
  GitHubClient,
  DockerHubClient
} from './api-clients';
import { randomUUID } from 'node:crypto';
import {
  type InsertDiscoveredTool,
  type InsertToolDiscoverySession,
  type InsertToolPopularityMetric,
  type InsertExternalToolData,
  type ToolPopularityMetric,
  type DiscoveredToolEvaluation,
  type DiscoveryToolDto,
  type TrendingToolsResponse,
  type ToolRecommendationsResponse,
  type DiscoverySessionStatus
} from '@shared/schema';

// Discovery configuration
export interface DiscoveryConfig {
  enabledSources: string[];
  maxToolsPerSource: number;
  minPopularityThreshold: number;
  includePrerelease: boolean;
  cacheExpiry: number;
  batchSize: number;
}

// Tool scoring weights
export interface ScoringWeights {
  popularity: number;
  recency: number;
  quality: number;
  community: number;
  documentation: number;
  maintenance: number;
}

// Category classification rules
export interface CategoryRule {
  name: string;
  keywords: string[];
  patterns: RegExp[];
  languages: string[];
  weight: number;
  priority: number;
}

export type DiscoveryToolSource = Omit<InsertDiscoveredTool, 'id'> & {
  metrics?: ToolPopularityMetric | null;
  evaluation?: DiscoveredToolEvaluation | null;
};

export function mapToDiscoveryToolDto(tool: DiscoveryToolSource): DiscoveryToolDto {
  const toNumber = (value: unknown, fallback = 0): number => {
    if (value === null || value === undefined) return fallback;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  };

  const toNullableNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const toIsoString = (value: unknown): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  const toStringOrNull = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return null;
  };

  const languages = Array.isArray(tool.languages) ? tool.languages.filter(Boolean) as string[] : [];
  const frameworks = Array.isArray(tool.frameworks) ? tool.frameworks.filter(Boolean) as string[] : [];
  const tags = Array.isArray(tool.tags) ? tool.tags.filter(Boolean) as string[] : [];
  const keywords = Array.isArray(tool.keywords) ? tool.keywords.filter(Boolean) as string[] : [];

  const rawSourceId = toStringOrNull(tool.sourceId) ?? tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sourceId = rawSourceId && rawSourceId !== '-' ? rawSourceId : randomUUID();
  const syntheticId = ${tool.sourceType}:;

  const extended = tool as Record<string, unknown>;

  return {
    id: syntheticId,
    name: tool.name,
    description: toStringOrNull(tool.description),
    category: tool.category,
    subCategory: toStringOrNull(extended.subCategory),
    sourceType: tool.sourceType,
    sourceId,
    sourceUrl: toStringOrNull(tool.sourceUrl),
    repositoryUrl: toStringOrNull(tool.repositoryUrl),
    documentationUrl: toStringOrNull(tool.documentationUrl),
    homepageUrl: toStringOrNull(tool.homepageUrl),
    languages,
    frameworks,
    tags,
    keywords,
    pricingModel: toStringOrNull(tool.pricingModel) ?? 'free',
    costCategory: toStringOrNull(tool.costCategory) ?? 'free',
    estimatedMonthlyCost: toNullableNumber(extended.estimatedMonthlyCost),
    difficultyLevel: toStringOrNull(extended.difficultyLevel),
    popularityScore: toNumber(extended.popularityScore),
    trendingScore: toNumber(extended.trendingScore),
    qualityScore: toNumber(extended.qualityScore),
    githubStars: toNullableNumber(tool.githubStars),
    githubForks: toNullableNumber(tool.githubForks),
    npmWeeklyDownloads: toNullableNumber(tool.npmWeeklyDownloads),
    dockerPulls: toNullableNumber(tool.dockerPulls),
    packageDownloads: toNullableNumber(tool.packageDownloads),
    discoveredAt: toIsoString(extended.discoveredAt),
    lastUpdated: toIsoString(extended.lastUpdated ?? tool.lastUpdated),
    lastScanned: toIsoString(extended.lastScanned),
    metrics: tool.metrics ?? null,
    evaluation: tool.evaluation ?? null,
  };
}\nexport class DiscoveryEngine {
  private apiManager: DiscoveryAPIManager;
  private defaultConfig: DiscoveryConfig;
  private scoringWeights: ScoringWeights;
  private categoryRules: CategoryRule[];

  constructor(githubApiKey?: string) {
    this.apiManager = new DiscoveryAPIManager(githubApiKey);
    this.defaultConfig = {
      enabledSources: ['npm', 'pypi', 'github', 'docker'],
      maxToolsPerSource: 100,
      minPopularityThreshold: 0,
      includePrerelease: false,
      cacheExpiry: 3600000, // 1 hour
      batchSize: 50,
    };
    
    this.scoringWeights = {
      popularity: 0.3,
      recency: 0.15,
      quality: 0.2,
      community: 0.15,
      documentation: 0.1,
      maintenance: 0.1,
    };

    this.categoryRules = this.initializeCategoryRules();
  }

  private toNumber(value: string | number | null | undefined, fallback = 0): number {
    if (value === null || value === undefined) {
      return fallback;
    }
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  private toDate(value: unknown, fallback: Date = new Date()): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return fallback;
  }

  private toStringValue(value: string | number | null | undefined, fallback = '0'): string {
    if (value === null || value === undefined) {
      return fallback;
    }
    return typeof value === 'number' ? value.toString() : value;
  }

  /**
   * Discover trending tools across all platforms
   */
  async discoverTrendingTools(
    config: Partial<DiscoveryConfig> = {},
    categories?: string[]
  ): Promise<Omit<InsertDiscoveredTool, 'id'>[]> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    console.log('Starting trending tool discovery...', { categories, config: finalConfig });

    const discoveredTools = await this.apiManager.discoverTrendingTools(categories);
    
    // Apply intelligent filtering and scoring
    const enrichedTools = await this.enrichAndScoreTools(discoveredTools);
    
    // Apply minimum threshold filtering
    const filteredTools = enrichedTools.filter(tool => 
      this.toNumber(tool.popularityScore) >= finalConfig.minPopularityThreshold
    );

    // Sort by combined score and limit results
    const sortedTools = this.sortToolsByScore(filteredTools)
      .slice(0, finalConfig.maxToolsPerSource);

    console.log(`Discovered ${sortedTools.length} trending tools`);
    return sortedTools;
  }

  /**
   * Search for tools across platforms
   */
  async searchTools(
    query: string,
    sourceTypes?: string[],
    config: Partial<DiscoveryConfig> = {}
  ): Promise<Omit<InsertDiscoveredTool, 'id'>[]> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    console.log('Searching tools...', { query, sourceTypes, config: finalConfig });

    const discoveredTools = await this.apiManager.searchTools(query, sourceTypes);
    
    // Apply intelligent filtering and scoring
    const enrichedTools = await this.enrichAndScoreTools(discoveredTools);
    
    // Calculate relevance scores for search
    const searchScoredTools = this.calculateSearchRelevance(enrichedTools, query);
    
    // Sort by relevance and combined score
    const sortedTools = searchScoredTools
      .sort((a, b) => {
        const aRelevance = this.calculateRelevanceScore(a, query);
        const bRelevance = this.calculateRelevanceScore(b, query);
        if (aRelevance !== bRelevance) return bRelevance - aRelevance;
        return this.toNumber(b.popularityScore) - this.toNumber(a.popularityScore);
      })
      .slice(0, finalConfig.maxToolsPerSource);

    console.log(`Found ${sortedTools.length} tools for query: ${query}`);
    return sortedTools;
  }

  /**
   * Generate personalized tool recommendations
   */
  async generateRecommendations(
    userStack: string[],
    userCategories: string[],
    userLanguages: string[],
    teamSize?: string,
    industry?: string
  ): Promise<ToolRecommendationsResponse> {
    console.log('Generating personalized recommendations...', {
      userStack,
      userCategories,
      userLanguages,
      teamSize,
      industry
    });

    // Discover tools in user's preferred categories
    const categoryTools = await this.discoverTrendingTools({}, userCategories);
    
    // Find complementary tools based on current stack
    const complementaryTools = await this.findComplementaryTools(userStack, userLanguages);
    
    // Combine and deduplicate
    const allCandidates = this.deduplicateTools([...categoryTools, ...complementaryTools]);
    
    // Score based on user context
    const contextScoredTools = this.scoreToolsForUser(
      allCandidates,
      userStack,
      userCategories,
      userLanguages,
      teamSize,
      industry
    );

    // Generate reasoning
    const reasoning = this.generateRecommendationReasoning(
      contextScoredTools.slice(0, 10),
      userStack,
      userCategories
    );

    const topTools = contextScoredTools.slice(0, 15);

    return {
      recommendations: topTools.map(tool => mapToDiscoveryToolDto(tool)),
      reasoning,
      basedOnStack: userStack,
      confidenceScore: this.calculateConfidenceScore(contextScoredTools, userStack),
      categories: [...new Set(topTools.map(t => t.category))],
    };
  }

  /**
   * Enrich tools with additional metadata and scoring
   */
  private async enrichAndScoreTools(
    tools: Omit<InsertDiscoveredTool, 'id'>[]
  ): Promise<Omit<InsertDiscoveredTool, 'id'>[]> {
    return Promise.all(tools.map(async (tool) => {
      // Enhanced categorization
      const enhancedCategory = this.enhanceToolCategory(tool);
      
      // Calculate comprehensive popularity score
      const enhancedPopularityScore = this.calculateComprehensivePopularityScore(tool);
      
      // Assess quality score
      const qualityScore = this.calculateQualityScore(tool);
      
      // Determine difficulty level
      const difficultyLevel = this.assessDifficultyLevel(tool);
      
      // Estimate costs
      const costEstimation = this.estimateToolCost(tool);

      return {
        ...tool,
        category: enhancedCategory,
        popularityScore: enhancedPopularityScore,
        qualityScore,
        difficultyLevel,
        ...costEstimation,
        lastUpdated: tool.lastUpdated instanceof Date ? tool.lastUpdated : new Date(),
      };
    }));
  }

  /**
   * Enhanced tool categorization using multiple signals
   */
  private enhanceToolCategory(tool: Omit<InsertDiscoveredTool, 'id'>): string {
    const name = tool.name.toLowerCase();
    const description = (tool.description || '').toLowerCase();
    const keywords = tool.keywords || [];
    const languages = tool.languages || [];
    const frameworks = tool.frameworks || [];

    // Calculate scores for each category
    const categoryScores: Record<string, number> = {};

    for (const rule of this.categoryRules) {
      let score = 0;

      // Check keywords
      const keywordMatches = rule.keywords.filter(keyword => 
        keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase())) ||
        name.includes(keyword.toLowerCase()) ||
        description.includes(keyword.toLowerCase())
      );
      score += keywordMatches.length * rule.weight;

      // Check patterns
      const patternMatches = rule.patterns.filter(pattern =>
        pattern.test(name) || pattern.test(description)
      );
      score += patternMatches.length * rule.weight * 1.5;

      // Check languages
      const languageMatches = rule.languages.filter(lang =>
        languages.some(l => l.toLowerCase() === lang.toLowerCase())
      );
      score += languageMatches.length * rule.weight * 0.8;

      // Apply priority multiplier
      score *= (1 + rule.priority * 0.1);

      categoryScores[rule.name] = score;
    }

    // Return the category with the highest score, or keep original if no matches
    const bestCategory = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .find(([, score]) => score > 0);

    return bestCategory?.[0] || tool.category;
  }

  /**
   * Calculate comprehensive popularity score
   */
  private calculateComprehensivePopularityScore(tool: Omit<InsertDiscoveredTool, 'id'>): string {
    let score = 0;
    let maxPossibleScore = 0;

    // GitHub metrics (if available)
    if (tool.githubStars && tool.githubStars > 0) {
      const starScore = Math.min(50, Math.log10(tool.githubStars + 1) * 10);
      score += starScore * this.scoringWeights.popularity;
      maxPossibleScore += 50 * this.scoringWeights.popularity;
    }

    if (tool.githubForks && tool.githubForks > 0) {
      const forkScore = Math.min(25, Math.log10(tool.githubForks + 1) * 8);
      score += forkScore * this.scoringWeights.community;
      maxPossibleScore += 25 * this.scoringWeights.community;
    }

    // Package download metrics
    const downloads = tool.npmWeeklyDownloads || tool.packageDownloads || tool.dockerPulls || 0;
    if (downloads > 0) {
      const downloadScore = Math.min(40, Math.log10(downloads + 1) * 8);
      score += downloadScore * this.scoringWeights.popularity;
      maxPossibleScore += 40 * this.scoringWeights.popularity;
    }

    // Recency score
    const lastUpdated = new Date(tool.lastUpdated || Date.now());
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 20 - (daysSinceUpdate / 7)); // Decreases over weeks
    score += recencyScore * this.scoringWeights.recency;
    maxPossibleScore += 20 * this.scoringWeights.recency;

    // Documentation score
    const hasDocumentation = !!(tool.documentationUrl || tool.homepageUrl);
    const docScore = hasDocumentation ? 15 : 0;
    score += docScore * this.scoringWeights.documentation;
    maxPossibleScore += 15 * this.scoringWeights.documentation;

    // Quality indicators
    const qualityIndicators = [
      tool.license ? 5 : 0, // Has license
      tool.version ? 5 : 0, // Has version
      (tool.keywords?.length || 0) > 0 ? 5 : 0, // Has keywords
      tool.description && tool.description.length > 50 ? 5 : 0, // Good description
    ];
    const qualityScore = qualityIndicators.reduce((sum, val) => sum + val, 0);
    score += qualityScore * this.scoringWeights.quality;
    maxPossibleScore += 20 * this.scoringWeights.quality;

    // Normalize to 0-100 scale
    const normalizedScore = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;
    return Math.min(100, Math.max(0, normalizedScore)).toFixed(1);
  }

  /**
   * Calculate quality score based on various indicators
   */
  private calculateQualityScore(tool: Omit<InsertDiscoveredTool, 'id'>): string {
    let score = 0;
    let indicators = 0;

    // License indicator
    if (tool.license) {
      const preferredLicenses = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'];
      score += preferredLicenses.includes(tool.license) ? 0.2 : 0.1;
    }
    indicators++;

    // Documentation quality
    if (tool.documentationUrl && tool.documentationUrl !== tool.repositoryUrl) {
      score += 0.2; // Dedicated documentation
    } else if (tool.documentationUrl) {
      score += 0.1; // Some documentation
    }
    indicators++;

    // Description quality
    const descLength = (tool.description || '').length;
    if (descLength > 100) score += 0.2;
    else if (descLength > 50) score += 0.15;
    else if (descLength > 0) score += 0.1;
    indicators++;

    // Keyword richness
    const keywordCount = tool.keywords?.length || 0;
    if (keywordCount > 5) score += 0.15;
    else if (keywordCount > 2) score += 0.1;
    else if (keywordCount > 0) score += 0.05;
    indicators++;

    // Version information
    if (tool.version && tool.version.match(/^\d+\.\d+\.\d+/)) {
      score += 0.1; // Semantic versioning
    } else if (tool.version) {
      score += 0.05;
    }
    indicators++;

    // Normalize score
    const normalizedScore = indicators > 0 ? (score / indicators) : 0;
    return (normalizedScore * 100).toFixed(1);
  }

  /**
   * Assess difficulty level based on tool characteristics
   */
  private assessDifficultyLevel(tool: Omit<InsertDiscoveredTool, 'id'>): 'beginner' | 'intermediate' | 'expert' {
    const name = tool.name.toLowerCase();
    const description = (tool.description || '').toLowerCase();
    const keywords = tool.keywords || [];

    // Expert level indicators
    const expertIndicators = [
      'advanced', 'complex', 'low-level', 'kernel', 'compiler', 
      'distributed', 'microservices', 'kubernetes', 'webpack'
    ];
    
    // Beginner level indicators  
    const beginnerIndicators = [
      'simple', 'easy', 'starter', 'tutorial', 'beginner',
      'basic', 'minimal', 'lightweight', 'quick'
    ];

    const expertScore = expertIndicators.reduce((score, indicator) => {
      if (name.includes(indicator) || description.includes(indicator) ||
          keywords.some(k => k.toLowerCase().includes(indicator))) {
        return score + 1;
      }
      return score;
    }, 0);

    const beginnerScore = beginnerIndicators.reduce((score, indicator) => {
      if (name.includes(indicator) || description.includes(indicator) ||
          keywords.some(k => k.toLowerCase().includes(indicator))) {
        return score + 1;
      }
      return score;
    }, 0);

    if (expertScore > beginnerScore && expertScore >= 2) return 'expert';
    if (beginnerScore > expertScore && beginnerScore >= 2) return 'beginner';
    return 'intermediate';
  }

  /**
   * Estimate tool cost and pricing model
   */
  private estimateToolCost(tool: Omit<InsertDiscoveredTool, 'id'>): {
    pricingModel: string;
    estimatedMonthlyCost: string;
    costCategory: string;
  } {
    const name = tool.name.toLowerCase();
    const description = (tool.description || '').toLowerCase();

    // Check for pricing indicators in name/description
    if (description.includes('free') || description.includes('open source') ||
        tool.license && ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL'].includes(tool.license)) {
      return {
        pricingModel: 'free',
        estimatedMonthlyCost: '0',
        costCategory: 'free',
      };
    }

    if (description.includes('enterprise') || name.includes('enterprise')) {
      return {
        pricingModel: 'enterprise',
        estimatedMonthlyCost: '500',
        costCategory: 'enterprise',
      };
    }

    if (description.includes('premium') || description.includes('pro') ||
        description.includes('paid')) {
      return {
        pricingModel: 'paid',
        estimatedMonthlyCost: '50',
        costCategory: 'medium',
      };
    }

    if (description.includes('freemium') || 
        (description.includes('free') && description.includes('paid'))) {
      return {
        pricingModel: 'freemium',
        estimatedMonthlyCost: '25',
        costCategory: 'low',
      };
    }

    // Default to free for open source tools
    return {
      pricingModel: 'free',
      estimatedMonthlyCost: '0',
      costCategory: 'free',
    };
  }

  /**
   * Find complementary tools based on user's current stack
   */
  private async findComplementaryTools(
    userStack: string[],
    userLanguages: string[]
  ): Promise<Omit<InsertDiscoveredTool, 'id'>[]> {
    const complementaryCategories = this.getComplementaryCategories(userStack);
    const tools: Omit<InsertDiscoveredTool, 'id'>[] = [];

    for (const category of complementaryCategories) {
      try {
        const categoryTools = await this.discoverTrendingTools({ maxToolsPerSource: 20 }, [category]);
        
        // Filter by user languages if specified
        const languageFilteredTools = userLanguages.length > 0 
          ? categoryTools.filter(tool => 
              tool.languages?.some(lang => 
                userLanguages.some(userLang => 
                  lang.toLowerCase().includes(userLang.toLowerCase())
                )
              )
            )
          : categoryTools;

        tools.push(...languageFilteredTools);
      } catch (error) {
        console.error(`Error finding tools for category ${category}:`, error);
      }
    }

    return tools;
  }

  /**
   * Get complementary categories based on user's stack
   */
  private getComplementaryCategories(userStack: string[]): string[] {
    const stackCategories = userStack.map(tool => this.inferToolCategory(tool));
    const complementaryMap: Record<string, string[]> = {
      'frontend': ['testing', 'devops', 'monitoring'],
      'backend': ['database', 'cache', 'monitoring', 'devops'],
      'database': ['backup', 'monitoring', 'analytics'],
      'devops': ['monitoring', 'security', 'testing'],
      'testing': ['monitoring', 'devops'],
      'monitoring': ['analytics', 'alerting'],
    };

    const complementaryCategories = new Set<string>();
    
    for (const category of stackCategories) {
      const complements = complementaryMap[category] || [];
      complements.forEach(cat => complementaryCategories.add(cat));
    }

    return Array.from(complementaryCategories);
  }

  /**
   * Infer tool category from tool name/description
   */
  private inferToolCategory(toolName: string): string {
    const name = toolName.toLowerCase();
    
    // Simple category inference based on common tool names
    if (['react', 'vue', 'angular', 'svelte'].some(fw => name.includes(fw))) return 'frontend';
    if (['express', 'fastify', 'koa', 'django', 'flask'].some(fw => name.includes(fw))) return 'backend';
    if (['postgres', 'mysql', 'mongo', 'redis'].some(db => name.includes(db))) return 'database';
    if (['docker', 'kubernetes', 'jenkins', 'github'].some(tool => name.includes(tool))) return 'devops';
    if (['jest', 'cypress', 'mocha', 'pytest'].some(tool => name.includes(tool))) return 'testing';
    
    return 'library';
  }


  /**
   * Score tools based on user context
   */
  private scoreToolsForUser(
    tools: Omit<InsertDiscoveredTool, 'id'>[],
    userStack: string[],
    userCategories: string[],
    userLanguages: string[],
    teamSize?: string,
    industry?: string
  ): Omit<InsertDiscoveredTool, 'id'>[] {
    return tools.map(tool => {
      let contextScore = this.toNumber(tool.popularityScore);
      
      // Category preference boost
      if (userCategories.includes(tool.category)) {
        contextScore *= 1.3;
      }

      // Language preference boost
      if (tool.languages?.some(lang => 
        userLanguages.some(userLang => 
          lang.toLowerCase().includes(userLang.toLowerCase())
        )
      )) {
        contextScore *= 1.2;
      }

      // Team size considerations
      if (teamSize === 'enterprise' && tool.difficultyLevel === 'expert') {
        contextScore *= 1.1;
      } else if (teamSize === 'solo' && tool.difficultyLevel === 'beginner') {
        contextScore *= 1.1;
      }

      // Industry-specific boosts (simplified)
      if (industry === 'fintech' && tool.keywords?.some(k => 
        ['security', 'crypto', 'payment', 'financial'].includes(k.toLowerCase())
      )) {
        contextScore *= 1.15;
      }

      return {
        ...tool,
        popularityScore: Math.min(100, contextScore).toFixed(1),
      };
    }).sort((a, b) => this.toNumber(b.popularityScore) - this.toNumber(a.popularityScore));
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(tool: Omit<InsertDiscoveredTool, 'id'>, query: string): number {
    const queryLower = query.toLowerCase();
    let relevanceScore = 0;

    // Exact name match
    if (tool.name.toLowerCase() === queryLower) relevanceScore += 100;
    else if (tool.name.toLowerCase().includes(queryLower)) relevanceScore += 50;
    else if (queryLower.includes(tool.name.toLowerCase())) relevanceScore += 30;

    // Description match
    if (tool.description?.toLowerCase().includes(queryLower)) relevanceScore += 20;

    // Keywords match
    const keywordMatches = tool.keywords?.filter(k => 
      k.toLowerCase().includes(queryLower) || queryLower.includes(k.toLowerCase())
    ).length || 0;
    relevanceScore += keywordMatches * 10;

    // Category match
    if (tool.category.toLowerCase().includes(queryLower)) relevanceScore += 15;

    return relevanceScore;
  }

  /**
   * Calculate search relevance scores
   */
  private calculateSearchRelevance(
    tools: Omit<InsertDiscoveredTool, 'id'>[],
    query: string
  ): Omit<InsertDiscoveredTool, 'id'>[] {
    return tools.map(tool => ({
      ...tool,
      // Store relevance score in a way that can be used for sorting
      trendingScore: this.calculateRelevanceScore(tool, query).toString(),
    }));
  }

  /**
   * Sort tools by their combined score
   */
  private sortToolsByScore(tools: Omit<InsertDiscoveredTool, 'id'>[]): Omit<InsertDiscoveredTool, 'id'>[] {
    return tools.sort((a, b) => {
      const aScore = this.toNumber(a.popularityScore) + (this.toNumber(a.qualityScore) * 0.3);
      const bScore = this.toNumber(b.popularityScore) + (this.toNumber(b.qualityScore) * 0.3);
      return bScore - aScore;
    });
  }

  /**
   * Remove duplicate tools across different sources
   */
  private deduplicateTools(tools: Omit<InsertDiscoveredTool, 'id'>[]): Omit<InsertDiscoveredTool, 'id'>[] {
    const seen = new Set<string>();
    const uniqueTools: Omit<InsertDiscoveredTool, 'id'>[] = [];

    for (const tool of tools) {
      const key = `${tool.name.toLowerCase()}-${tool.sourceType}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTools.push(tool);
      }
    }

    return uniqueTools;
  }

  /**
   * Generate reasoning for recommendations
   */
  private generateRecommendationReasoning(
    tools: Omit<InsertDiscoveredTool, 'id'>[],
    userStack: string[],
    userCategories: string[]
  ): string[] {
    const reasoning: string[] = [];

    if (tools.length > 0) {
      const topTool = tools[0];
      reasoning.push(
        `${topTool.name} is trending in ${topTool.category} with a popularity score of ${topTool.popularityScore}`
      );
    }

    const categoryCounts: Record<string, number> = {};
    tools.forEach(tool => {
      categoryCounts[tool.category] = (categoryCounts[tool.category] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (topCategory) {
      reasoning.push(
        `${topCategory[1]} tools recommended in ${topCategory[0]} category based on your preferences`
      );
    }

    if (userStack.length > 0) {
      reasoning.push(
        `Recommendations complement your existing stack: ${userStack.slice(0, 3).join(', ')}`
      );
    }

    return reasoning;
  }

  /**
   * Calculate confidence score for recommendations
   */
  private calculateConfidenceScore(
    tools: Omit<InsertDiscoveredTool, 'id'>[],
    userStack: string[]
  ): number {
    if (tools.length === 0) return 0;

    let confidence = 50; // Base confidence

    // Higher confidence if we have many high-quality tools
    const highQualityTools = tools.filter(t => this.toNumber(t.popularityScore) > 70).length;
    confidence += Math.min(30, highQualityTools * 3);

    // Higher confidence if tools are well-distributed across categories
    const uniqueCategories = new Set(tools.map(t => t.category)).size;
    confidence += Math.min(20, uniqueCategories * 2);

    // Higher confidence if user has an established stack
    if (userStack.length > 3) confidence += 10;

    return Math.min(100, confidence);
  }

  /**
   * Initialize category classification rules
   */
  private initializeCategoryRules(): CategoryRule[] {
    return [
      {
        name: 'frontend',
        keywords: ['react', 'vue', 'angular', 'svelte', 'ui', 'component', 'frontend', 'client', 'browser', 'dom'],
        patterns: [/^react-/, /^vue-/, /^@angular/, /-ui$/, /-component$/],
        languages: ['javascript', 'typescript', 'html', 'css'],
        weight: 1.0,
        priority: 1,
      },
      {
        name: 'backend',
        keywords: ['api', 'server', 'backend', 'express', 'fastify', 'koa', 'django', 'flask', 'gin'],
        patterns: [/^express-/, /-server$/, /-api$/],
        languages: ['javascript', 'python', 'go', 'java', 'rust', 'php'],
        weight: 1.0,
        priority: 1,
      },
      {
        name: 'database',
        keywords: ['database', 'db', 'sql', 'nosql', 'orm', 'mongodb', 'postgres', 'mysql', 'redis'],
        patterns: [/-db$/, /-orm$/, /^pg-/, /^mongo-/],
        languages: ['sql', 'javascript', 'python'],
        weight: 1.0,
        priority: 1,
      },
      {
        name: 'devops',
        keywords: ['docker', 'kubernetes', 'deploy', 'ci', 'cd', 'jenkins', 'github-actions', 'terraform'],
        patterns: [/^docker-/, /-cli$/, /^k8s-/],
        languages: ['yaml', 'bash', 'shell'],
        weight: 1.0,
        priority: 1,
      },
      {
        name: 'testing',
        keywords: ['test', 'testing', 'jest', 'mocha', 'cypress', 'playwright', 'selenium', 'pytest'],
        patterns: [/^jest-/, /-test$/, /^test-/],
        languages: ['javascript', 'python', 'java'],
        weight: 1.0,
        priority: 1,
      },
      {
        name: 'monitoring',
        keywords: ['monitor', 'logging', 'metrics', 'observability', 'analytics', 'telemetry'],
        patterns: [/-monitor$/, /^log-/, /-metrics$/],
        languages: ['javascript', 'python', 'go'],
        weight: 0.9,
        priority: 1,
      },
      {
        name: 'security',
        keywords: ['security', 'auth', 'authentication', 'authorization', 'crypto', 'encryption'],
        patterns: [/^auth-/, /-security$/, /^crypto-/],
        languages: ['javascript', 'python', 'go', 'rust'],
        weight: 0.9,
        priority: 1,
      },
      {
        name: 'machine-learning',
        keywords: ['ml', 'ai', 'machine-learning', 'neural', 'tensorflow', 'pytorch', 'scikit'],
        patterns: [/^ml-/, /-ai$/, /^tf-/],
        languages: ['python', 'r', 'julia'],
        weight: 0.8,
        priority: 1,
      },
      {
        name: 'data-science',
        keywords: ['data', 'analytics', 'visualization', 'pandas', 'numpy', 'chart', 'graph'],
        patterns: [/^data-/, /-chart$/, /-viz$/],
        languages: ['python', 'r', 'javascript'],
        weight: 0.8,
        priority: 1,
      },
      {
        name: 'library',
        keywords: ['util', 'utility', 'helper', 'tool', 'common', 'shared'],
        patterns: [/^util-/, /-utils$/, /-helpers$/],
        languages: [],
        weight: 0.5,
        priority: 0,
      },
    ];
  }
}











