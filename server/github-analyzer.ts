import type { DetectionPattern, InsertDetectedTool, Tool } from "@shared/schema";

interface RepositoryFile {
  name: string;
  path: string;
  content: string;
  size: number;
}

interface AnalysisResult {
  detectedTools: InsertDetectedTool[];
  summary: {
    totalTools: number;
    totalEstimatedCost: number;
    confidenceScore: number;
    categories: string[];
  };
}

export class GitHubRepositoryAnalyzer {
  private detectionPatterns: DetectionPattern[] = [
    // Frontend Frameworks & Libraries
    {
      name: "React",
      category: "Frontend/Design",
      files: ["package.json"],
      patterns: [/"react":\s*"[^"]+"/],
      dependencies: ["react"],
      confidence: 0.95,
      costEstimate: 0, // Free
    },
    {
      name: "Next.js",
      category: "Frontend/Design",
      files: ["package.json", "next.config.js", "next.config.mjs", "next.config.ts"],
      patterns: [/"next":\s*"[^"]+"/, /next\.config\./],
      dependencies: ["next"],
      confidence: 0.98,
      costEstimate: 0, // Free
    },
    {
      name: "Vue.js",
      category: "Frontend/Design", 
      files: ["package.json", "vue.config.js"],
      patterns: [/"vue":\s*"[^"]+"/],
      dependencies: ["vue"],
      confidence: 0.95,
      costEstimate: 0,
    },
    {
      name: "Angular",
      category: "Frontend/Design",
      files: ["package.json", "angular.json"],
      patterns: [/"@angular\/core":\s*"[^"]+"/],
      dependencies: ["@angular/core"],
      confidence: 0.98,
      costEstimate: 0,
    },
    {
      name: "Tailwind CSS",
      category: "Frontend/Design",
      files: ["package.json", "tailwind.config.js", "tailwind.config.ts"],
      patterns: [/"tailwindcss":\s*"[^"]+"/],
      dependencies: ["tailwindcss"],
      confidence: 0.92,
      costEstimate: 0,
    },

    // Backend Frameworks
    {
      name: "Express.js",
      category: "Backend/Database",
      files: ["package.json"],
      patterns: [/"express":\s*"[^"]+"/],
      dependencies: ["express"],
      confidence: 0.95,
      costEstimate: 0,
    },
    {
      name: "FastAPI",
      category: "Backend/Database",
      files: ["requirements.txt", "pyproject.toml"],
      patterns: [/fastapi[>=<]/],
      confidence: 0.95,
      costEstimate: 0,
    },
    {
      name: "Django",
      category: "Backend/Database",
      files: ["requirements.txt", "manage.py", "settings.py"],
      patterns: [/Django[>=<]/, /django-/],
      confidence: 0.98,
      costEstimate: 0,
    },
    {
      name: "Flask",
      category: "Backend/Database", 
      files: ["requirements.txt"],
      patterns: [/Flask[>=<]/],
      confidence: 0.95,
      costEstimate: 0,
    },
    {
      name: "Ruby on Rails",
      category: "Backend/Database",
      files: ["Gemfile", "config/application.rb"],
      patterns: [/gem ['"]rails['"]/, /Rails\.application/],
      confidence: 0.98,
      costEstimate: 0,
    },
    {
      name: "Laravel",
      category: "Backend/Database",
      files: ["composer.json", "artisan"],
      patterns: [/"laravel\/framework"/, /Illuminate\\/],
      confidence: 0.98,
      costEstimate: 0,
    },

    // Databases
    {
      name: "PostgreSQL",
      category: "Backend/Database",
      files: ["package.json", "requirements.txt", "docker-compose.yml", ".env"],
      patterns: [/"pg":\s*"[^"]+"/, /psycopg2/, /postgres:/, /POSTGRES_/],
      confidence: 0.85,
      costEstimate: 15, // Estimated managed DB cost
    },
    {
      name: "MongoDB",
      category: "Backend/Database",
      files: ["package.json", "requirements.txt", "docker-compose.yml"],
      patterns: [/"mongoose":\s*"[^"]+"/, /pymongo/, /mongo:/, /mongodb:/],
      confidence: 0.85,
      costEstimate: 25,
    },
    {
      name: "Redis",
      category: "Backend/Database",
      files: ["package.json", "requirements.txt", "docker-compose.yml"],
      patterns: [/"redis":\s*"[^"]+"/, /redis[>=<]/, /redis:/],
      confidence: 0.85,
      costEstimate: 10,
    },
    {
      name: "MySQL",
      category: "Backend/Database",
      files: ["package.json", "requirements.txt", "docker-compose.yml"],
      patterns: [/"mysql":\s*"[^"]+"/, /PyMySQL/, /mysql:/],
      confidence: 0.85,
      costEstimate: 15,
    },

    // Cloud Services & Backend as a Service
    {
      name: "Supabase",
      category: "Backend/Database",
      files: ["package.json"],
      patterns: [/"@supabase\/supabase-js":\s*"[^"]+"/],
      dependencies: ["@supabase/supabase-js"],
      confidence: 0.98,
      costEstimate: 25,
    },
    {
      name: "Firebase",
      category: "Backend/Database",
      files: ["package.json", "firebase.json"],
      patterns: [/"firebase":\s*"[^"]+"/, /firebase\.initializeApp/],
      confidence: 0.95,
      costEstimate: 25,
    },
    {
      name: "AWS SDK",
      category: "Backend/Database",
      files: ["package.json", "requirements.txt"],
      patterns: [/"aws-sdk":\s*"[^"]+"/, /boto3[>=<]/],
      confidence: 0.90,
      costEstimate: 50,
    },

    // DevOps & Deployment
    {
      name: "Docker",
      category: "DevOps/Deployment",
      files: ["Dockerfile", "docker-compose.yml", ".dockerignore"],
      patterns: [/FROM /, /docker-compose/, /COPY|RUN|EXPOSE/],
      confidence: 0.98,
      costEstimate: 0,
    },
    {
      name: "Kubernetes",
      category: "DevOps/Deployment", 
      files: ["k8s/", "kubernetes/", "deployment.yaml", "service.yaml"],
      patterns: [/apiVersion:\s*apps\/v1/, /kind:\s*Deployment/, /kind:\s*Service/],
      confidence: 0.95,
      costEstimate: 100,
    },
    {
      name: "Terraform",
      category: "DevOps/Deployment",
      files: ["main.tf", "variables.tf", "terraform/"],
      patterns: [/resource "/, /provider "/, /terraform\s*{/],
      confidence: 0.98,
      costEstimate: 0,
    },
    {
      name: "GitHub Actions",
      category: "DevOps/Deployment",
      files: [".github/workflows/"],
      patterns: [/on:\s*(push|pull_request)/, /runs-on:/, /steps:/],
      confidence: 0.95,
      costEstimate: 0,
    },
    {
      name: "Vercel",
      category: "DevOps/Deployment",
      files: ["vercel.json", "package.json"],
      patterns: [/vercel/, /"@vercel\/[^"]+"/],
      confidence: 0.90,
      costEstimate: 20,
    },
    {
      name: "Netlify",
      category: "DevOps/Deployment",
      files: ["netlify.toml", "_redirects", "_headers"],
      patterns: [/\[build\]/, /command\s*=/, /publish\s*=/],
      confidence: 0.95,
      costEstimate: 15,
    },

    // Development Tools
    {
      name: "TypeScript",
      category: "IDE/Development",
      files: ["package.json", "tsconfig.json"],
      patterns: [/"typescript":\s*"[^"]+"/, /"@types\/[^"]+"/],
      confidence: 0.95,
      costEstimate: 0,
    },
    {
      name: "ESLint",
      category: "IDE/Development",
      files: ["package.json", ".eslintrc", ".eslintrc.js"],
      patterns: [/"eslint":\s*"[^"]+"/],
      confidence: 0.90,
      costEstimate: 0,
    },
    {
      name: "Prettier",
      category: "IDE/Development",
      files: ["package.json", ".prettierrc"],
      patterns: [/"prettier":\s*"[^"]+"/],
      confidence: 0.90,
      costEstimate: 0,
    },
    {
      name: "Jest",
      category: "IDE/Development",
      files: ["package.json", "jest.config.js"],
      patterns: [/"jest":\s*"[^"]+"/],
      confidence: 0.90,
      costEstimate: 0,
    },
    {
      name: "Cypress",
      category: "IDE/Development",
      files: ["package.json", "cypress.json", "cypress/"],
      patterns: [/"cypress":\s*"[^"]+"/],
      confidence: 0.95,
      costEstimate: 75,
    },

    // Payment & Communication
    {
      name: "Stripe",
      category: "Payment Platforms",
      files: ["package.json", ".env", "requirements.txt"],
      patterns: [/"stripe":\s*"[^"]+"/, /stripe[>=<]/, /STRIPE_/],
      confidence: 0.95,
      costEstimate: 0, // Transaction-based
    },

    // AI/ML Tools
    {
      name: "OpenAI",
      category: "AI Coding Tools",
      files: ["package.json", "requirements.txt", ".env"],
      patterns: [/"openai":\s*"[^"]+"/, /openai[>=<]/, /OPENAI_API_KEY/],
      confidence: 0.90,
      costEstimate: 50,
    },
  ];

  async analyzeRepository(repositoryUrl: string, branch: string = "main"): Promise<AnalysisResult> {
    try {
      // Extract repo info from URL
      const repoInfo = this.parseRepositoryUrl(repositoryUrl);
      if (!repoInfo) {
        throw new Error("Invalid repository URL format");
      }

      // Fetch repository files
      const files = await this.fetchRepositoryFiles(repoInfo.owner, repoInfo.repo, branch);
      
      // Analyze files for tool detection
      const detectedTools = await this.detectTools(files);

      // Calculate summary statistics
      const summary = this.calculateSummary(detectedTools);

      return {
        detectedTools,
        summary
      };
    } catch (error) {
      console.error("Repository analysis failed:", error);
      throw error;
    }
  }

  // Public method for parsing GitHub repository URLs with strict security validation
  public parseRepositoryUrl(url: string): { owner: string; repo: string; } | null {
    // Security: Only accept GitHub URLs to prevent SSRF attacks
    const githubMatch = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?\/?$/);
    if (githubMatch) {
      const owner = githubMatch[1];
      const repo = githubMatch[2];
      
      // Additional security checks for malicious patterns
      if (this.containsMaliciousPatterns(owner) || this.containsMaliciousPatterns(repo)) {
        console.warn(`Rejected potentially malicious repository URL: ${url}`);
        return null;
      }
      
      return { owner, repo };
    }

    return null;
  }

  // Security helper to detect malicious patterns in repository names
  private containsMaliciousPatterns(input: string): boolean {
    const maliciousPatterns = [
      /\.\./,           // Path traversal
      /[<>'"&]/,        // Injection characters
      /^-/,             // Leading dash (can cause command injection)
      /localhost/i,     // Localhost references
      /127\.0\.0\.1/,   // Local IP
      /192\.168\./,     // Private network
      /10\./,           // Private network
      /172\.16\./,      // Private network
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(input));
  }

  // Category normalization to map complex analyzer categories to UI standards
  public normalizeCategoryForUI(analyzerCategory: string): string {
    const categoryMapping: Record<string, string> = {
      'Frontend/Design': 'Frontend',
      'Backend/Database': 'Backend', 
      'DevOps/Deployment': 'DevOps',
      'IDE/Development': 'Testing',
      'AI Coding Tools': 'Analytics',
      'Payment Platforms': 'Backend',
      'Communication/Collaboration': 'Analytics',
      'Testing/QA': 'Testing',
      'Security/Monitoring': 'Security',
      'Analytics/Tracking': 'Analytics',
      'Data/Storage': 'Database',
    };
    
    return categoryMapping[analyzerCategory] || 'Frontend'; // Default fallback
  }

  private async fetchRepositoryFiles(owner: string, repo: string, branch: string): Promise<RepositoryFile[]> {
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const files: RepositoryFile[] = [];

    try {
      // Key files to check for analysis
      const keyFiles = [
        "package.json", "requirements.txt", "Gemfile", "composer.json",
        "go.mod", "Cargo.toml", "pom.xml", "build.gradle",
        "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
        "vercel.json", "netlify.toml", "railway.json", "render.yaml",
        "tailwind.config.js", "tailwind.config.ts", "next.config.js",
        "nuxt.config.js", "vue.config.js", "angular.json", "tsconfig.json",
        ".eslintrc", ".eslintrc.js", "jest.config.js", "cypress.json",
        "main.tf", "variables.tf", "terraform.tf"
      ];

      // Check workflows directory
      const workflowFiles = await this.fetchDirectoryContents(baseUrl, ".github/workflows", branch);
      files.push(...workflowFiles);

      // Check root level files
      for (const fileName of keyFiles) {
        try {
          const fileContent = await this.fetchFileContent(baseUrl, fileName, branch);
          if (fileContent) {
            files.push(fileContent);
          }
        } catch (error) {
          // File doesn't exist, continue
        }
      }

      return files;
    } catch (error) {
      console.error("Failed to fetch repository files:", error);
      throw new Error(`Failed to fetch repository contents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchDirectoryContents(baseUrl: string, directory: string, branch: string): Promise<RepositoryFile[]> {
    try {
      const response = await fetch(`${baseUrl}/${directory}?ref=${branch}`);
      if (!response.ok) return [];

      const contents = await response.json();
      if (!Array.isArray(contents)) return [];

      const files: RepositoryFile[] = [];
      for (const item of contents) {
        if (item.type === 'file' && item.download_url) {
          const fileResponse = await fetch(item.download_url);
          if (fileResponse.ok) {
            const content = await fileResponse.text();
            files.push({
              name: item.name,
              path: item.path,
              content,
              size: item.size || content.length
            });
          }
        }
      }

      return files;
    } catch (error) {
      return [];
    }
  }

  private async fetchFileContent(baseUrl: string, fileName: string, branch: string): Promise<RepositoryFile | null> {
    try {
      const response = await fetch(`${baseUrl}/${fileName}?ref=${branch}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.content) {
        // Decode base64 content
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return {
          name: data.name,
          path: data.path,
          content,
          size: data.size
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async detectTools(files: RepositoryFile[]): Promise<InsertDetectedTool[]> {
    const detectedTools: InsertDetectedTool[] = [];

    for (const pattern of this.detectionPatterns) {
      // Check if any relevant files exist
      const relevantFiles = files.filter(file => 
        pattern.files.some(patternFile => 
          file.path.includes(patternFile) || 
          file.name === patternFile ||
          (patternFile.endsWith('/') && file.path.startsWith(patternFile))
        )
      );

      if (relevantFiles.length === 0) continue;

      let isDetected = false;
      let confidence = pattern.confidence;
      let detectionDetails: any = {};
      let version: string | undefined;
      let filePaths: string[] = [];

      for (const file of relevantFiles) {
        filePaths.push(file.path);

        // Check pattern matches
        for (const regex of pattern.patterns) {
          const match = file.content.match(regex);
          if (match) {
            isDetected = true;
            detectionDetails.matchedPattern = match[0];
            detectionDetails.fileName = file.name;

            // Try to extract version if it's a package.json-like file
            if (file.name === 'package.json') {
              try {
                const packageData = JSON.parse(file.content);
                const deps = { ...packageData.dependencies, ...packageData.devDependencies };
                
                // Look for tool in dependencies
                if (pattern.dependencies) {
                  for (const dep of pattern.dependencies) {
                    if (deps[dep]) {
                      version = deps[dep].replace(/[\^~]/, '');
                      break;
                    }
                  }
                }
              } catch (e) {
                // Invalid JSON, continue
              }
            }
            break;
          }
        }

        if (isDetected) break;
      }

      if (isDetected) {
        // Adjust confidence based on detection quality
        if (version) confidence += 0.05;
        if (filePaths.length > 1) confidence += 0.02;
        
        detectedTools.push({
          analysisId: "", // Will be set by caller
          toolId: null, // Will be mapped to existing tools later
          detectedName: pattern.name,
          category: pattern.category,
          confidenceScore: Math.min(confidence, 1.0).toString(),
          detectionMethod: this.getDetectionMethod(filePaths),
          detectionDetails: {
            ...detectionDetails,
            files: filePaths,
            pattern: pattern.name
          },
          suggestedTool: null,
          estimatedMonthlyCost: pattern.costEstimate?.toString() || "0",
          version,
          filePath: filePaths[0],
          isImported: false
        });
      }
    }

    return detectedTools;
  }

  private getDetectionMethod(filePaths: string[]): string {
    if (filePaths.some(p => p.includes('package.json'))) return 'package.json';
    if (filePaths.some(p => p.includes('requirements.txt'))) return 'requirements.txt';
    if (filePaths.some(p => p.includes('Dockerfile'))) return 'dockerfile';
    if (filePaths.some(p => p.includes('docker-compose'))) return 'docker-compose';
    if (filePaths.some(p => p.includes('.github/workflows'))) return 'github-actions';
    if (filePaths.some(p => p.includes('.tf'))) return 'terraform';
    return 'config-file';
  }

  private calculateSummary(detectedTools: InsertDetectedTool[]) {
    const categories = [...new Set(detectedTools.map(tool => tool.category))];
    const totalEstimatedCost = detectedTools.reduce((sum, tool) => 
      sum + parseFloat(tool.estimatedMonthlyCost || "0"), 0
    );
    const averageConfidence = detectedTools.length > 0 
      ? detectedTools.reduce((sum, tool) => sum + parseFloat(tool.confidenceScore), 0) / detectedTools.length
      : 0;

    return {
      totalTools: detectedTools.length,
      totalEstimatedCost,
      confidenceScore: averageConfidence,
      categories
    };
  }

  // Method to match detected tools with existing tools in database
  async matchWithExistingTools(detectedTools: InsertDetectedTool[], existingTools: Tool[]): Promise<InsertDetectedTool[]> {
    return detectedTools.map(detectedTool => {
      // Try to find exact match by name
      let matchedTool = existingTools.find(tool => 
        tool.name.toLowerCase() === detectedTool.detectedName.toLowerCase()
      );

      // Try partial matches
      if (!matchedTool) {
        matchedTool = existingTools.find(tool => 
          tool.name.toLowerCase().includes(detectedTool.detectedName.toLowerCase()) ||
          detectedTool.detectedName.toLowerCase().includes(tool.name.toLowerCase())
        );
      }

      // Try category and framework matches
      if (!matchedTool) {
        matchedTool = existingTools.find(tool => 
          tool.category === detectedTool.category &&
          (tool.frameworks?.toLowerCase().includes(detectedTool.detectedName.toLowerCase()) ||
           tool.name.toLowerCase().includes(detectedTool.detectedName.toLowerCase()))
        );
      }

      if (matchedTool) {
        return {
          ...detectedTool,
          toolId: matchedTool.id,
          suggestedTool: matchedTool.id,
          // Use the matched tool's pricing info if available
          estimatedMonthlyCost: this.extractCostFromPricing(matchedTool.pricing) || detectedTool.estimatedMonthlyCost
        };
      }

      // Suggest similar tools if no exact match
      const suggestedTool = this.findSimilarTool(detectedTool, existingTools);
      return {
        ...detectedTool,
        suggestedTool: suggestedTool?.id || null
      };
    });
  }

  private extractCostFromPricing(pricing?: string | null): string | null {
    if (!pricing) return null;
    
    // Try to extract monthly cost from pricing string
    const monthlyMatch = pricing.match(/\$(\d+).*\/month/i);
    if (monthlyMatch) {
      return monthlyMatch[1];
    }

    // Check for free mentions
    if (pricing.toLowerCase().includes('free')) {
      return "0";
    }

    return null;
  }

  private findSimilarTool(detectedTool: InsertDetectedTool, existingTools: Tool[]): Tool | null {
    // Find tools in same category
    const categoryTools = existingTools.filter(tool => tool.category === detectedTool.category);
    
    if (categoryTools.length === 0) return null;

    // Simple similarity scoring
    return categoryTools.reduce((best, tool) => {
      const similarity = this.calculateSimilarity(detectedTool.detectedName, tool.name);
      const bestSimilarity = this.calculateSimilarity(detectedTool.detectedName, best?.name || '');
      
      return similarity > bestSimilarity ? tool : best;
    }, categoryTools[0]);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}