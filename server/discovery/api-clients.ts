import { type DiscoveredTool, type InsertDiscoveredTool } from "@shared/schema";

// Rate limiting configuration for each API
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfter?: number;
}

export interface APIClientConfig {
  baseUrl: string;
  rateLimit: RateLimitConfig;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout: number;
}

// Base API client with rate limiting and caching
export class BaseAPIClient {
  private requestTimestamps: Map<string, number[]> = new Map();
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  protected config: APIClientConfig;

  constructor(config: APIClientConfig) {
    this.config = config;
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string,
    cacheDurationMs = 300000 // 5 minutes default
  ): Promise<T> {
    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() < cached.expiresAt) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Rate limiting check
    await this.checkRateLimit();

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'User-Agent': 'StackFlow-Discovery/1.0',
      'Accept': 'application/json',
      ...this.config.headers,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          throw new Error(`Rate limited. Retry after: ${retryAfter || 'unknown'}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the result
      if (cacheKey) {
        this.cache.set(cacheKey, {
          data,
          expiresAt: Date.now() + cacheDurationMs,
        });
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const clientKey = this.constructor.name;
    
    if (!this.requestTimestamps.has(clientKey)) {
      this.requestTimestamps.set(clientKey, []);
    }

    const timestamps = this.requestTimestamps.get(clientKey)!;
    const windowStart = now - this.config.rateLimit.windowMs;
    
    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter(ts => ts > windowStart);
    this.requestTimestamps.set(clientKey, recentTimestamps);

    if (recentTimestamps.length >= this.config.rateLimit.maxRequests) {
      const waitTime = recentTimestamps[0] + this.config.rateLimit.windowMs - now;
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${clientKey}, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    timestamps.push(now);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// NPM Registry API Client
export class NPMClient extends BaseAPIClient {
  constructor() {
    super({
      baseUrl: 'https://registry.npmjs.org',
      rateLimit: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
      timeout: 10000,
    });
  }

  async getPackageInfo(packageName: string): Promise<any> {
    return this.makeRequest(
      `/${packageName}`,
      {},
      `npm-${packageName}`,
      600000 // 10 minutes cache
    );
  }

  async getPackageDownloads(packageName: string, period = 'last-week'): Promise<any> {
    return this.makeRequest(
      `https://api.npmjs.org/downloads/point/${period}/${packageName}`,
      {},
      `npm-downloads-${packageName}-${period}`,
      3600000 // 1 hour cache
    );
  }

  async searchPackages(query: string, size = 20, from = 0): Promise<any> {
    return this.makeRequest(
      `/-/v1/search?text=${encodeURIComponent(query)}&size=${size}&from=${from}`,
      {},
      `npm-search-${query}-${size}-${from}`,
      1800000 // 30 minutes cache
    );
  }

  async getTrendingPackages(timeframe = 'week'): Promise<any[]> {
    // NPM doesn't have a direct trending API, so we'll search for popular packages
    const trendingQueries = [
      'react', 'vue', 'angular', 'typescript', 'nodejs', 'webpack', 'babel',
      'express', 'lodash', 'axios', 'jest', 'eslint', 'prettier', 'vite'
    ];

    const results: any[] = [];
    for (const query of trendingQueries) {
      try {
        const searchResult = await this.searchPackages(query, 5);
        if (searchResult.objects) {
          results.push(...searchResult.objects.map((obj: any) => obj.package));
        }
      } catch (error) {
        console.error(`Failed to fetch trending for query ${query}:`, error);
      }
    }

    return results.slice(0, 50); // Return top 50
  }

  transformToDiscoveredTool(npmPackage: any, downloads?: any): Omit<InsertDiscoveredTool, 'id'> {
    return {
      name: npmPackage.name,
      description: npmPackage.description || '',
      category: this.categorizePackage(npmPackage),
      sourceType: 'npm',
      sourceId: npmPackage.name,
      sourceUrl: `https://www.npmjs.com/package/${npmPackage.name}`,
      repositoryUrl: npmPackage.repository?.url || npmPackage.homepage,
      documentationUrl: npmPackage.homepage,
      homepageUrl: npmPackage.homepage,
      npmWeeklyDownloads: downloads?.downloads || 0,
      packageDownloads: downloads?.downloads || 0,
      version: npmPackage.version || npmPackage['dist-tags']?.latest,
      license: typeof npmPackage.license === 'string' ? npmPackage.license : npmPackage.license?.type,
      languages: ['javascript', 'typescript'],
      frameworks: this.detectFrameworks(npmPackage),
      tags: npmPackage.keywords || [],
      keywords: npmPackage.keywords || [],
      popularityScore: this.calculatePopularityScore(npmPackage, downloads),
      difficultyLevel: this.assessDifficulty(npmPackage),
      pricingModel: 'free',
      costCategory: 'free',
    };
  }

  private categorizePackage(npmPackage: any): string {
    const name = npmPackage.name.toLowerCase();
    const description = (npmPackage.description || '').toLowerCase();
    const keywords = npmPackage.keywords || [];

    // Frontend frameworks/libraries
    if (keywords.some((k: string) => ['react', 'vue', 'angular', 'frontend', 'ui', 'component'].includes(k.toLowerCase())) ||
        name.includes('react') || name.includes('vue') || name.includes('angular')) {
      return 'frontend';
    }

    // Backend/API
    if (keywords.some((k: string) => ['express', 'api', 'server', 'backend', 'koa', 'fastify'].includes(k.toLowerCase())) ||
        name.includes('express') || name.includes('api') || description.includes('server')) {
      return 'backend';
    }

    // Database
    if (keywords.some((k: string) => ['database', 'db', 'mongo', 'sql', 'orm'].includes(k.toLowerCase())) ||
        name.includes('mongo') || name.includes('sql') || description.includes('database')) {
      return 'database';
    }

    // DevOps/Build tools
    if (keywords.some((k: string) => ['build', 'webpack', 'vite', 'rollup', 'babel', 'eslint'].includes(k.toLowerCase())) ||
        name.includes('webpack') || name.includes('build') || description.includes('build')) {
      return 'devops';
    }

    // Testing
    if (keywords.some((k: string) => ['test', 'testing', 'jest', 'mocha', 'cypress'].includes(k.toLowerCase())) ||
        name.includes('test') || description.includes('test')) {
      return 'testing';
    }

    return 'library';
  }

  private detectFrameworks(npmPackage: any): string[] {
    const frameworks: string[] = [];
    const name = npmPackage.name.toLowerCase();
    const keywords = npmPackage.keywords || [];

    if (name.includes('react') || keywords.some((k: string) => k.toLowerCase().includes('react'))) {
      frameworks.push('react');
    }
    if (name.includes('vue') || keywords.some((k: string) => k.toLowerCase().includes('vue'))) {
      frameworks.push('vue');
    }
    if (name.includes('angular') || keywords.some((k: string) => k.toLowerCase().includes('angular'))) {
      frameworks.push('angular');
    }
    if (name.includes('node') || keywords.some((k: string) => k.toLowerCase().includes('nodejs'))) {
      frameworks.push('nodejs');
    }

    return frameworks;
  }

  private calculatePopularityScore(npmPackage: any, downloads?: any): string {
    let score = 0;

    // Base score from downloads (if available)
    if (downloads?.downloads) {
      if (downloads.downloads > 1000000) score += 50;
      else if (downloads.downloads > 100000) score += 30;
      else if (downloads.downloads > 10000) score += 20;
      else if (downloads.downloads > 1000) score += 10;
    }

    // GitHub stars (if repository is GitHub)
    const repoUrl = npmPackage.repository?.url || '';
    if (repoUrl.includes('github.com')) {
      // This would need a separate GitHub API call
      score += 10; // Placeholder
    }

    // Recent activity
    const lastPublish = new Date(npmPackage.time?.modified || npmPackage.time?.created);
    const daysSinceLastPublish = (Date.now() - lastPublish.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPublish < 30) score += 10;
    else if (daysSinceLastPublish < 90) score += 5;

    return Math.min(100, score).toString();
  }

  private assessDifficulty(npmPackage: any): 'beginner' | 'intermediate' | 'expert' {
    const name = npmPackage.name.toLowerCase();
    const description = (npmPackage.description || '').toLowerCase();

    // Expert-level tools
    if (name.includes('webpack') || name.includes('babel') || 
        description.includes('advanced') || description.includes('complex')) {
      return 'expert';
    }

    // Beginner-friendly tools
    if (description.includes('simple') || description.includes('easy') || 
        description.includes('beginner') || name.includes('starter')) {
      return 'beginner';
    }

    return 'intermediate';
  }
}

// PyPI API Client
export class PyPIClient extends BaseAPIClient {
  constructor() {
    super({
      baseUrl: 'https://pypi.org/pypi',
      rateLimit: { maxRequests: 60, windowMs: 60000 }, // 60 requests per minute
      timeout: 10000,
    });
  }

  async getPackageInfo(packageName: string): Promise<any> {
    return this.makeRequest(
      `/${packageName}/json`,
      {},
      `pypi-${packageName}`,
      600000 // 10 minutes cache
    );
  }

  async searchPackages(query: string): Promise<any> {
    // PyPI doesn't have a built-in search API, using alternative approach
    const response = await fetch(`https://pypi.org/simple/`, {
      headers: { 'Accept': 'application/vnd.pypi.simple.v1+json' }
    });
    
    if (!response.ok) {
      throw new Error(`PyPI search failed: ${response.statusText}`);
    }

    // This is a simplified implementation - in production, you'd want a more sophisticated search
    return { projects: [] };
  }

  async getTrendingPackages(): Promise<any[]> {
    // PyPI trending packages based on popular categories
    const popularPackages = [
      'requests', 'numpy', 'pandas', 'flask', 'django', 'tensorflow',
      'scikit-learn', 'matplotlib', 'selenium', 'beautifulsoup4',
      'pillow', 'opencv-python', 'jupyter', 'fastapi', 'pydantic'
    ];

    const results: any[] = [];
    for (const packageName of popularPackages) {
      try {
        const packageInfo = await this.getPackageInfo(packageName);
        results.push(packageInfo);
      } catch (error) {
        console.error(`Failed to fetch PyPI package ${packageName}:`, error);
      }
    }

    return results;
  }

  transformToDiscoveredTool(pypiPackage: any): Omit<InsertDiscoveredTool, 'id'> {
    const info = pypiPackage.info;
    return {
      name: info.name,
      description: info.summary || '',
      category: this.categorizePackage(info),
      sourceType: 'pypi',
      sourceId: info.name,
      sourceUrl: `https://pypi.org/project/${info.name}/`,
      repositoryUrl: info.home_page || info.project_url,
      documentationUrl: info.docs_url || info.home_page,
      homepageUrl: info.home_page,
      version: info.version,
      license: info.license,
      languages: ['python'],
      tags: info.keywords ? info.keywords.split(',').map((k: string) => k.trim()) : [],
      keywords: info.keywords ? info.keywords.split(',').map((k: string) => k.trim()) : [],
      popularityScore: this.calculatePopularityScore(pypiPackage),
      difficultyLevel: this.assessDifficulty(info),
      pricingModel: 'free',
      costCategory: 'free',
    };
  }

  private categorizePackage(info: any): string {
    const name = info.name.toLowerCase();
    const summary = (info.summary || '').toLowerCase();
    const classifiers = info.classifiers || [];

    // Machine Learning
    if (name.includes('ml') || name.includes('tensorflow') || name.includes('torch') ||
        summary.includes('machine learning') || summary.includes('neural')) {
      return 'machine-learning';
    }

    // Web frameworks
    if (name.includes('django') || name.includes('flask') || name.includes('fastapi') ||
        classifiers.some((c: string) => c.includes('Web'))) {
      return 'backend';
    }

    // Data science
    if (name.includes('pandas') || name.includes('numpy') || name.includes('scipy') ||
        summary.includes('data') || summary.includes('analysis')) {
      return 'data-science';
    }

    // Testing
    if (name.includes('test') || name.includes('pytest') || summary.includes('test')) {
      return 'testing';
    }

    return 'library';
  }

  private calculatePopularityScore(pypiPackage: any): string {
    // PyPI doesn't provide download stats in the API, so we use other metrics
    let score = 20; // Base score

    const info = pypiPackage.info;
    
    // Check if it's a popular package by name recognition
    const popularPackages = ['requests', 'numpy', 'pandas', 'flask', 'django'];
    if (popularPackages.includes(info.name.toLowerCase())) {
      score += 50;
    }

    // Recent activity
    const releaseDate = new Date(pypiPackage.releases[info.version]?.[0]?.upload_time_iso_8601 || 0);
    const daysSinceRelease = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease < 30) score += 10;
    else if (daysSinceRelease < 90) score += 5;

    return Math.min(100, score).toString();
  }

  private assessDifficulty(info: any): 'beginner' | 'intermediate' | 'expert' {
    const name = info.name.toLowerCase();
    const summary = (info.summary || '').toLowerCase();

    if (name.includes('tensorflow') || name.includes('torch') || 
        summary.includes('advanced') || summary.includes('low-level')) {
      return 'expert';
    }

    if (summary.includes('simple') || summary.includes('easy') || 
        name.includes('simple') || name.includes('easy')) {
      return 'beginner';
    }

    return 'intermediate';
  }
}

// GitHub API Client
export class GitHubClient extends BaseAPIClient {
  constructor(apiKey?: string) {
    super({
      baseUrl: 'https://api.github.com',
      rateLimit: { maxRequests: apiKey ? 5000 : 60, windowMs: 3600000 }, // Per hour
      headers: apiKey ? { 'Authorization': `token ${apiKey}` } : {},
      timeout: 15000,
    });
  }

  async getTrendingRepositories(language?: string, since = 'weekly'): Promise<any> {
    const query = `created:>${this.getDateString(since)}${language ? ` language:${language}` : ''}`;
    return this.makeRequest(
      `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`,
      {},
      `github-trending-${language || 'all'}-${since}`,
      1800000 // 30 minutes cache
    );
  }

  async getRepositoryInfo(owner: string, repo: string): Promise<any> {
    return this.makeRequest(
      `/repos/${owner}/${repo}`,
      {},
      `github-repo-${owner}-${repo}`,
      600000 // 10 minutes cache
    );
  }

  async searchRepositories(query: string, language?: string, sort = 'stars'): Promise<any> {
    const searchQuery = `${query}${language ? ` language:${language}` : ''}`;
    return this.makeRequest(
      `/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=${sort}&order=desc&per_page=30`,
      {},
      `github-search-${query}-${language || 'all'}`,
      1800000 // 30 minutes cache
    );
  }

  async getAwesomeLists(): Promise<any[]> {
    const awesomeQuery = 'awesome in:name topic:awesome';
    const result = await this.makeRequest<{ items?: any[] }>(
      `/search/repositories?q=${encodeURIComponent(awesomeQuery)}&sort=stars&order=desc&per_page=50`,
      {},
      'github-awesome-lists',
      3600000 // 1 hour cache
    );
    return result.items ?? [];
  }

  transformToDiscoveredTool(repo: any): Omit<InsertDiscoveredTool, 'id'> {
    return {
      name: repo.name,
      description: repo.description || '',
      category: this.categorizeRepository(repo),
      sourceType: 'github',
      sourceId: repo.full_name,
      sourceUrl: repo.html_url,
      repositoryUrl: repo.html_url,
      documentationUrl: repo.homepage || repo.html_url,
      homepageUrl: repo.homepage,
      githubStars: repo.stargazers_count || 0,
      githubForks: repo.forks_count || 0,
      version: repo.default_branch,
      license: repo.license?.name,
      languages: repo.language ? [repo.language.toLowerCase()] : [],
      tags: repo.topics || [],
      keywords: repo.topics || [],
      popularityScore: this.calculatePopularityScore(repo),
      difficultyLevel: this.assessDifficulty(repo),
      pricingModel: 'free',
      costCategory: 'free',
    };
  }

  private getDateString(since: string): string {
    const date = new Date();
    switch (since) {
      case 'daily':
        date.setDate(date.getDate() - 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() - 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() - 1);
        break;
      default:
        date.setDate(date.getDate() - 7);
    }
    return date.toISOString().split('T')[0];
  }

  private categorizeRepository(repo: any): string {
    const name = repo.name.toLowerCase();
    const description = (repo.description || '').toLowerCase();
    const topics = repo.topics || [];
    const language = (repo.language || '').toLowerCase();

    // Frontend
    if (topics.includes('react') || topics.includes('vue') || topics.includes('angular') ||
        name.includes('ui') || description.includes('frontend')) {
      return 'frontend';
    }

    // Backend/API
    if (topics.includes('api') || topics.includes('backend') || 
        language === 'go' || language === 'rust' || 
        description.includes('server') || description.includes('api')) {
      return 'backend';
    }

    // DevOps
    if (topics.includes('devops') || topics.includes('kubernetes') || topics.includes('docker') ||
        name.includes('deploy') || description.includes('deployment')) {
      return 'devops';
    }

    // Database
    if (topics.includes('database') || name.includes('db') || description.includes('database')) {
      return 'database';
    }

    // Machine Learning
    if (topics.includes('machine-learning') || topics.includes('ai') || 
        language === 'python' && description.includes('ml')) {
      return 'machine-learning';
    }

    return 'library';
  }

  private calculatePopularityScore(repo: any): string {
    let score = 0;

    // Stars
    const stars = repo.stargazers_count || 0;
    if (stars > 10000) score += 50;
    else if (stars > 1000) score += 30;
    else if (stars > 100) score += 20;
    else if (stars > 10) score += 10;

    // Forks
    const forks = repo.forks_count || 0;
    if (forks > 1000) score += 20;
    else if (forks > 100) score += 10;
    else if (forks > 10) score += 5;

    // Recent activity
    const lastUpdate = new Date(repo.updated_at);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) score += 10;
    else if (daysSinceUpdate < 30) score += 5;

    return Math.min(100, score).toString();
  }

  private assessDifficulty(repo: any): 'beginner' | 'intermediate' | 'expert' {
    const description = (repo.description || '').toLowerCase();
    const topics = repo.topics || [];

    if (topics.includes('advanced') || topics.includes('expert') ||
        description.includes('advanced') || description.includes('complex')) {
      return 'expert';
    }

    if (topics.includes('beginner') || topics.includes('starter') ||
        description.includes('simple') || description.includes('tutorial')) {
      return 'beginner';
    }

    return 'intermediate';
  }
}

// Docker Hub API Client
export class DockerHubClient extends BaseAPIClient {
  constructor() {
    super({
      baseUrl: 'https://hub.docker.com/v2',
      rateLimit: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
      timeout: 10000,
    });
  }

  async getRepositoryInfo(namespace: string, repository: string): Promise<any> {
    return this.makeRequest(
      `/repositories/${namespace}/${repository}/`,
      {},
      `docker-${namespace}-${repository}`,
      600000 // 10 minutes cache
    );
  }

  async searchRepositories(query: string, page_size = 25, page = 1): Promise<any> {
    return this.makeRequest(
      `/search/repositories/?query=${encodeURIComponent(query)}&page_size=${page_size}&page=${page}`,
      {},
      `docker-search-${query}-${page}`,
      1800000 // 30 minutes cache
    );
  }

  async getTrendingImages(): Promise<any[]> {
    const popularImages = [
      'nginx', 'postgres', 'redis', 'node', 'python', 'mysql',
      'mongo', 'elasticsearch', 'ubuntu', 'alpine'
    ];

    const results: any[] = [];
    for (const image of popularImages) {
      try {
        const searchResult = await this.searchRepositories(image, 5);
        if (searchResult.results) {
          results.push(...searchResult.results);
        }
      } catch (error) {
        console.error(`Failed to fetch Docker image ${image}:`, error);
      }
    }

    return results.slice(0, 50);
  }

  transformToDiscoveredTool(dockerImage: any): Omit<InsertDiscoveredTool, 'id'> {
    return {
      name: dockerImage.name,
      description: dockerImage.short_description || '',
      category: this.categorizeImage(dockerImage),
      sourceType: 'docker',
      sourceId: dockerImage.name,
      sourceUrl: `https://hub.docker.com/r/${dockerImage.name}`,
      repositoryUrl: dockerImage.source_url,
      homepageUrl: `https://hub.docker.com/r/${dockerImage.name}`,
      dockerPulls: dockerImage.pull_count || 0,
      popularityScore: this.calculatePopularityScore(dockerImage),
      difficultyLevel: this.assessDifficulty(dockerImage),
      pricingModel: 'free',
      costCategory: 'free',
    };
  }

  private categorizeImage(dockerImage: any): string {
    const name = dockerImage.name.toLowerCase();
    const description = (dockerImage.short_description || '').toLowerCase();

    if (name.includes('database') || name.includes('postgres') || name.includes('mysql') || 
        name.includes('mongo') || name.includes('redis')) {
      return 'database';
    }

    if (name.includes('web') || name.includes('nginx') || name.includes('apache') ||
        description.includes('web server')) {
      return 'infrastructure';
    }

    if (name.includes('node') || name.includes('python') || name.includes('java') ||
        description.includes('runtime')) {
      return 'runtime';
    }

    return 'container';
  }

  private calculatePopularityScore(dockerImage: any): string {
    let score = 0;

    const pulls = dockerImage.pull_count || 0;
    if (pulls > 1000000) score += 50;
    else if (pulls > 100000) score += 30;
    else if (pulls > 10000) score += 20;
    else if (pulls > 1000) score += 10;

    const stars = dockerImage.star_count || 0;
    if (stars > 100) score += 20;
    else if (stars > 10) score += 10;
    else if (stars > 1) score += 5;

    return Math.min(100, score).toString();
  }

  private assessDifficulty(dockerImage: any): 'beginner' | 'intermediate' | 'expert' {
    const name = dockerImage.name.toLowerCase();
    const description = (dockerImage.short_description || '').toLowerCase();

    if (name.includes('alpine') || description.includes('minimal') ||
        description.includes('advanced')) {
      return 'expert';
    }

    if (name.includes('latest') || description.includes('official') ||
        description.includes('simple')) {
      return 'beginner';
    }

    return 'intermediate';
  }
}

// Main Discovery API Client Manager
export class DiscoveryAPIManager {
  private npmClient: NPMClient;
  private pypiClient: PyPIClient;
  private githubClient: GitHubClient;
  private dockerClient: DockerHubClient;

  constructor(githubApiKey?: string) {
    this.npmClient = new NPMClient();
    this.pypiClient = new PyPIClient();
    this.githubClient = new GitHubClient(githubApiKey);
    this.dockerClient = new DockerHubClient();
  }

  async discoverTrendingTools(categories?: string[]): Promise<Omit<InsertDiscoveredTool, 'id'>[]> {
    const allTools: Omit<InsertDiscoveredTool, 'id'>[] = [];

    try {
      // NPM trending packages
      const npmPackages = await this.npmClient.getTrendingPackages();
      for (const pkg of npmPackages) {
        const downloads = await this.npmClient.getPackageDownloads(pkg.name).catch(() => null);
        allTools.push(this.npmClient.transformToDiscoveredTool(pkg, downloads));
      }

      // PyPI trending packages
      const pypiPackages = await this.pypiClient.getTrendingPackages();
      for (const pkg of pypiPackages) {
        allTools.push(this.pypiClient.transformToDiscoveredTool(pkg));
      }

      // GitHub trending repositories
      const githubRepos = await this.githubClient.getTrendingRepositories();
      for (const repo of githubRepos.items || []) {
        allTools.push(this.githubClient.transformToDiscoveredTool(repo));
      }

      // Docker trending images
      const dockerImages = await this.dockerClient.getTrendingImages();
      for (const image of dockerImages) {
        allTools.push(this.dockerClient.transformToDiscoveredTool(image));
      }

    } catch (error) {
      console.error('Error discovering trending tools:', error);
    }

    // Filter by categories if specified
    if (categories && categories.length > 0) {
      return allTools.filter(tool => categories.includes(tool.category));
    }

    return allTools;
  }

  async searchTools(query: string, sourceTypes?: string[]): Promise<Omit<InsertDiscoveredTool, 'id'>[]> {
    const allTools: Omit<InsertDiscoveredTool, 'id'>[] = [];

    try {
      // Search NPM if included
      if (!sourceTypes || sourceTypes.includes('npm')) {
        const npmResults = await this.npmClient.searchPackages(query, 20);
        for (const result of npmResults.objects || []) {
          const downloads = await this.npmClient.getPackageDownloads(result.package.name).catch(() => null);
          allTools.push(this.npmClient.transformToDiscoveredTool(result.package, downloads));
        }
      }

      // Search GitHub if included
      if (!sourceTypes || sourceTypes.includes('github')) {
        const githubResults = await this.githubClient.searchRepositories(query);
        for (const repo of githubResults.items || []) {
          allTools.push(this.githubClient.transformToDiscoveredTool(repo));
        }
      }

      // Search Docker Hub if included
      if (!sourceTypes || sourceTypes.includes('docker')) {
        const dockerResults = await this.dockerClient.searchRepositories(query, 20);
        for (const image of dockerResults.results || []) {
          allTools.push(this.dockerClient.transformToDiscoveredTool(image));
        }
      }

    } catch (error) {
      console.error('Error searching tools:', error);
    }

    return allTools;
  }

  clearAllCaches(): void {
    this.npmClient.clearCache();
    this.pypiClient.clearCache();
    this.githubClient.clearCache();
    this.dockerClient.clearCache();
  }
}