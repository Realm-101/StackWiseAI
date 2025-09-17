import { GoogleGenAI } from "@google/genai";
import type { 
  UserAIContext, 
  EnhancedBusinessIdea, 
  GeneratedTechRoadmap, 
  ContextualRecommendation, 
  TechRoadmapPhase, 
  Tool,
  SavedIdea,
  TaskGenerationParameters,
  GeneratedTasksResponse,
  ProjectTask,
  TaskDependency,
  TaskTimeline,
  TaskMetrics
} from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BusinessIdea {
  title: string;
  description: string;
  monetization: string;
  tags: string[];
}

interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function generateBusinessIdeas(
  selectedTools: string[],
  goals?: string
): Promise<BusinessIdea[]> {
  try {
    const toolsText = selectedTools.join(", ");
    const goalsText = goals ? `User goals: ${goals}\n\n` : "";
    
    const prompt = `You are a business strategy expert specializing in tech stack analysis and monetization opportunities.

${goalsText}Selected tech tools: ${toolsText}

Generate 3 creative and realistic business ideas that specifically leverage these tools. For each idea, provide:
1. A compelling title (max 50 characters)
2. A detailed description explaining how the tools work together (100-200 words)
3. A specific monetization strategy (50-100 words)
4. 3-5 relevant tags/keywords

Focus on practical, implementable ideas that showcase the unique capabilities of the selected tools. Consider current market trends and opportunities.

Respond with JSON in this exact format:
{
  "ideas": [
    {
      "title": "Business Idea Title",
      "description": "Detailed description of the business idea and how the tools are used...",
      "monetization": "Specific monetization strategy...",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  monetization: { type: "string" },
                  tags: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["title", "description", "monetization", "tags"]
              }
            }
          },
          required: ["ideas"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data.ideas || [];
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Failed to generate business ideas:", error);
    throw new Error(`Failed to generate business ideas: ${error}`);
  }
}

export async function generateEnhancedBusinessIdeas(
  selectedTools: string[],
  userContext: UserAIContext,
  goals?: string
): Promise<EnhancedBusinessIdea[]> {
  try {
    const toolsText = selectedTools.join(", ");
    const goalsText = goals ? `User goals: ${goals}\n\n` : "";
    const budgetText = userContext.monthlyBudget ? `Monthly budget: $${userContext.monthlyBudget}\n` : "";
    const teamText = userContext.teamSize ? `Team size: ${userContext.teamSize}\n` : "";
    const industryText = userContext.industry ? `Industry: ${userContext.industry}\n` : "";
    const levelText = userContext.technicalLevel ? `Technical level: ${userContext.technicalLevel}\n` : "";
    const stageText = userContext.companyStage ? `Company stage: ${userContext.companyStage}\n` : "";
    
    const prompt = `You are an expert business strategist and technology consultant specializing in context-aware recommendations.

User Context:
${teamText}${industryText}${levelText}${budgetText}${stageText}${goalsText}
Selected tech tools: ${toolsText}

Generate 3 highly contextual business ideas that specifically:
- Leverage the selected tools effectively
- Match the user's technical level and team size
- Fit within their budget constraints (if specified)
- Align with their industry and company stage
- Consider implementation complexity appropriate for their context

For each idea, provide:
1. Compelling title (max 50 characters)
2. Detailed description explaining tool integration (150-250 words)
3. Specific monetization strategy (75-125 words)
4. Target audience description (50-100 words)
5. Implementation complexity (low/medium/high) with justification
6. Estimated cost breakdown (development, monthly operations)
7. Time to market estimate
8. 4-6 relevant tags/keywords
9. Industry fit score (1-10) and team suitability explanation
10. Budget compatibility assessment

Focus on practical, achievable ideas that showcase realistic market opportunities within the user's constraints.

Respond with JSON in this exact format:
{
  "ideas": [
    {
      "title": "Business Idea Title",
      "description": "Detailed description...",
      "monetization": "Monetization strategy...",
      "targetAudience": "Target audience description...",
      "implementationComplexity": "low|medium|high",
      "estimatedCost": 5000,
      "timeToMarket": "3-6 months",
      "tags": ["tag1", "tag2", "tag3"],
      "budgetFriendly": true,
      "teamSuitability": "Explanation of why this fits the team size...",
      "industryFit": 8
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  monetization: { type: "string" },
                  targetAudience: { type: "string" },
                  implementationComplexity: { type: "string" },
                  estimatedCost: { type: "number" },
                  timeToMarket: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  budgetFriendly: { type: "boolean" },
                  teamSuitability: { type: "string" },
                  industryFit: { type: "number" }
                },
                required: ["title", "description", "monetization", "targetAudience", "implementationComplexity", "estimatedCost", "timeToMarket", "tags", "budgetFriendly", "teamSuitability", "industryFit"]
              }
            }
          },
          required: ["ideas"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data.ideas || [];
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Failed to generate enhanced business ideas:", error);
    throw new Error(`Failed to generate enhanced business ideas: ${error}`);
  }
}

export async function generateTechRoadmap(
  currentStack: string[],
  targetGoals: string[],
  userContext: UserAIContext,
  timeframe?: string
): Promise<GeneratedTechRoadmap> {
  try {
    const currentText = currentStack.join(", ");
    const goalsText = targetGoals.join(", ");
    const budgetText = userContext.monthlyBudget ? `Monthly budget: $${userContext.monthlyBudget}\n` : "No budget specified\n";
    const teamText = userContext.teamSize ? `Team size: ${userContext.teamSize}\n` : "";
    const industryText = userContext.industry ? `Industry: ${userContext.industry}\n` : "";
    const levelText = userContext.technicalLevel ? `Technical level: ${userContext.technicalLevel}\n` : "";
    const stageText = userContext.companyStage ? `Company stage: ${userContext.companyStage}\n` : "";
    const timeframeText = timeframe ? `Target timeframe: ${timeframe}\n` : "Flexible timeframe\n";
    
    const prompt = `You are a senior technology architect and strategic planning expert.

User Context:
${teamText}${industryText}${levelText}${budgetText}${stageText}${timeframeText}
Current tech stack: ${currentText}
Target goals: ${goalsText}

Create a comprehensive technology roadmap that:
- Builds upon the existing stack strategically
- Achieves the target goals efficiently
- Respects budget and team constraints
- Considers technical complexity appropriate for the team level
- Includes realistic timelines and milestones
- Addresses potential risks and dependencies

Provide a detailed roadmap with:
1. Clear title and description
2. 3-5 phases with specific tools and technologies
3. Duration estimates for each phase
4. Cost breakdown (immediate and ongoing)
5. Prerequisites and dependencies
6. Risk assessment
7. Learning resources for the team

Respond with JSON in this exact format:
{
  "title": "Technology Roadmap Title",
  "description": "Comprehensive roadmap description...",
  "currentStack": ["current", "tools"],
  "targetStack": ["target", "tools"],
  "timeline": [
    {
      "phase": 1,
      "title": "Phase Title",
      "description": "Phase description...",
      "tools": ["tool1", "tool2"],
      "duration": "4-6 weeks",
      "cost": 2500,
      "prerequisites": ["prereq1"],
      "deliverables": ["deliverable1"],
      "risks": ["risk1"],
      "learningResources": ["resource1"]
    }
  ],
  "totalDuration": "3-6 months",
  "estimatedCost": 10000,
  "complexity": "medium",
  "priority": "high",
  "budgetImpact": {
    "immediate": 5000,
    "monthly": 200,
    "savings": 1000
  },
  "prerequisites": ["overall prerequisites"],
  "riskAssessment": {
    "technical": "Technical risk assessment",
    "budget": "Budget risk assessment",
    "timeline": "Timeline risk assessment",
    "team": "Team capability assessment"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            currentStack: { type: "array", items: { type: "string" } },
            targetStack: { type: "array", items: { type: "string" } },
            timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "number" },
                  title: { type: "string" },
                  description: { type: "string" },
                  tools: { type: "array", items: { type: "string" } },
                  duration: { type: "string" },
                  cost: { type: "number" },
                  prerequisites: { type: "array", items: { type: "string" } },
                  deliverables: { type: "array", items: { type: "string" } },
                  risks: { type: "array", items: { type: "string" } },
                  learningResources: { type: "array", items: { type: "string" } }
                },
                required: ["phase", "title", "description", "tools", "duration", "cost"]
              }
            },
            totalDuration: { type: "string" },
            estimatedCost: { type: "number" },
            complexity: { type: "string" },
            priority: { type: "string" },
            budgetImpact: {
              type: "object",
              properties: {
                immediate: { type: "number" },
                monthly: { type: "number" },
                savings: { type: "number" }
              }
            },
            prerequisites: { type: "array", items: { type: "string" } },
            riskAssessment: {
              type: "object",
              properties: {
                technical: { type: "string" },
                budget: { type: "string" },
                timeline: { type: "string" },
                team: { type: "string" }
              }
            }
          },
          required: ["title", "description", "currentStack", "targetStack", "timeline", "totalDuration", "estimatedCost", "complexity", "priority"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Failed to generate tech roadmap:", error);
    throw new Error(`Failed to generate tech roadmap: ${error}`);
  }
}

export async function getContextualRecommendations(
  currentStack: string[],
  availableTools: Tool[],
  userContext: UserAIContext
): Promise<ContextualRecommendation[]> {
  try {
    const currentText = currentStack.join(", ");
    const toolsData = availableTools.slice(0, 50).map(t => `${t.name}: ${t.description || 'No description'} (Category: ${t.category})`).join("\n");
    const budgetText = userContext.monthlyBudget ? `Monthly budget: $${userContext.monthlyBudget}\n` : "";
    const teamText = userContext.teamSize ? `Team size: ${userContext.teamSize}\n` : "";
    const industryText = userContext.industry ? `Industry: ${userContext.industry}\n` : "";
    const levelText = userContext.technicalLevel ? `Technical level: ${userContext.technicalLevel}\n` : "";
    
    const prompt = `You are an expert technology consultant providing contextual recommendations.

User Context:
${teamText}${industryText}${levelText}${budgetText}Current stack: ${currentText}

Available tools to recommend:
${toolsData}

Analyze the user's current stack and context to provide 5-8 highly relevant recommendations that:
- Fill gaps in their current technology stack
- Match their technical level and team size
- Fit within budget constraints
- Address industry-specific needs
- Consider implementation effort and time to value
- Provide alternatives when appropriate

For each recommendation, provide:
1. Type (tool/process/architecture/security)
2. Priority level (low/medium/high/urgent)
3. Clear title and description
4. Reasoning for the recommendation
5. Suggested tools (if applicable)
6. Budget impact estimate
7. Implementation effort level
8. Team suitability score (1-10)
9. Industry relevance score (1-10)
10. Time to value estimate
11. Dependencies and alternatives

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "type": "tool",
      "priority": "high",
      "title": "Recommendation Title",
      "description": "Detailed description...",
      "reasoning": "Why this recommendation fits...",
      "suggestedTools": ["Tool Name 1", "Tool Name 2"],
      "budgetImpact": 150,
      "implementationEffort": "medium",
      "teamSuitability": 8,
      "industryRelevance": 9,
      "timeToValue": "2-4 weeks",
      "dependencies": ["dependency1"],
      "alternatives": ["alternative1"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  priority: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  reasoning: { type: "string" },
                  suggestedTools: { type: "array", items: { type: "string" } },
                  budgetImpact: { type: "number" },
                  implementationEffort: { type: "string" },
                  teamSuitability: { type: "number" },
                  industryRelevance: { type: "number" },
                  timeToValue: { type: "string" },
                  dependencies: { type: "array", items: { type: "string" } },
                  alternatives: { type: "array", items: { type: "string" } }
                },
                required: ["type", "priority", "title", "description", "reasoning", "implementationEffort", "teamSuitability", "industryRelevance", "timeToValue"]
              }
            }
          },
          required: ["recommendations"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data.recommendations || [];
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Failed to get contextual recommendations:", error);
    throw new Error(`Failed to get contextual recommendations: ${error}`);
  }
}

// Task Generation AI Functions

export interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  complexity: "low" | "medium" | "high";
  estimatedHours: number;
  estimatedDays: number;
  technicalRequirements: string[];
  acceptanceCriteria: string[];
  suggestedTools: string[];
  requiredTools: string[];
  costEstimate: number;
  resourceRequirements: {
    skillsNeeded: string[];
    teamMembers?: number;
    externalResources?: string[];
  };
  dependencies: string[];
}

export interface TaskGenerationResult {
  tasks: GeneratedTask[];
  projectMetadata: {
    totalDuration: string;
    estimatedCost: number;
    complexity: "low" | "medium" | "high";
    keyMilestones: string[];
    criticalPath: string[];
    riskAssessment: {
      technical: string;
      budget: string;
      timeline: string;
      team: string;
    };
  };
  stackAnalysis: {
    toolsInStack: number;
    toolsNeeded: number;
    missingTools: string[];
    additionalCosts: number;
  };
}

export async function generateProjectTasks(
  idea: SavedIdea,
  userContext: UserAIContext,
  userStack: Tool[],
  parameters: TaskGenerationParameters
): Promise<TaskGenerationResult> {
  try {
    const stackText = userStack.map(t => `${t.name} (${t.category})`).join(", ");
    const budgetText = userContext.monthlyBudget ? `Monthly budget: $${userContext.monthlyBudget}\n` : "";
    const teamText = userContext.teamSize ? `Team size: ${userContext.teamSize}\n` : "";
    const industryText = userContext.industry ? `Industry: ${userContext.industry}\n` : "";
    const levelText = userContext.technicalLevel ? `Technical level: ${userContext.technicalLevel}\n` : "";
    const timeframeText = parameters.targetTimeframe ? `Target timeframe: ${parameters.targetTimeframe}\n` : "";
    const complexityText = parameters.complexityLevel ? `Complexity level: ${parameters.complexityLevel}\n` : "";
    const focusAreasText = parameters.focusAreas ? `Focus areas: ${parameters.focusAreas.join(", ")}\n` : "";
    
    const prompt = `You are an expert project manager and technical architect specializing in breaking down business ideas into detailed, actionable project tasks.

Business Idea:
Title: ${idea.title}
Description: ${idea.description}
Monetization: ${idea.monetization}
Target Audience: ${idea.targetAudience || "Not specified"}
Implementation Complexity: ${idea.implementationComplexity || "medium"}
Estimated Cost: $${idea.estimatedCost || 0}
Time to Market: ${idea.timeToMarket || "Not specified"}

User Context:
${teamText}${industryText}${levelText}${budgetText}${timeframeText}${complexityText}${focusAreasText}

Current Tech Stack: ${stackText}

Task Generation Parameters:
- Include DevOps: ${parameters.includeDevOps !== false}
- Include Testing: ${parameters.includeTesting !== false}
- Include Documentation: ${parameters.includeDocumentation !== false}

Generate a comprehensive project breakdown with 15-25 detailed tasks that transform this business idea into an implementable project. Each task should:
1. Be specific and actionable with clear deliverables
2. Include realistic time estimates based on team size and technical level
3. Align with the user's tech stack and suggest specific tools
4. Have clear acceptance criteria and technical requirements
5. Be properly categorized and prioritized
6. Include dependencies on other tasks

Task Categories to use:
- setup (project initialization, environment setup)
- frontend (UI/UX, components, pages, styling)
- backend (APIs, business logic, server setup)
- database (schema design, migrations, data modeling)
- auth (authentication, authorization, user management)
- testing (unit tests, integration tests, QA)
- docs (technical documentation, user guides)
- devops (deployment, CI/CD, monitoring)
- integration (third-party APIs, payment systems)

For each task, provide:
1. Title (clear, action-oriented)
2. Detailed description (what exactly needs to be done)
3. Category (from the list above)
4. Priority (low/medium/high/urgent)
5. Complexity (low/medium/high)
6. Estimated hours (realistic based on user's technical level)
7. Estimated days (accounting for part-time work)
8. Technical requirements (specific technologies, patterns)
9. Acceptance criteria (clear success criteria)
10. Suggested tools (from user's current stack)
11. Required tools (new tools that must be added)
12. Cost estimate (additional costs for tools/services)
13. Resource requirements (skills, team members needed)
14. Dependencies (task titles this depends on)

Also provide project-level analysis:
1. Total project duration and cost
2. Overall complexity assessment
3. Key milestones and critical path
4. Risk assessment
5. Stack analysis and tool gaps

Respond with JSON in this exact format:
{
  "tasks": [
    {
      "title": "Task Title",
      "description": "Detailed task description...",
      "category": "setup",
      "priority": "high",
      "complexity": "medium",
      "estimatedHours": 8,
      "estimatedDays": 1,
      "technicalRequirements": ["requirement1", "requirement2"],
      "acceptanceCriteria": ["criteria1", "criteria2"],
      "suggestedTools": ["tool1", "tool2"],
      "requiredTools": ["new_tool1"],
      "costEstimate": 50,
      "resourceRequirements": {
        "skillsNeeded": ["skill1", "skill2"],
        "teamMembers": 1,
        "externalResources": ["resource1"]
      },
      "dependencies": ["prerequisite_task_title"]
    }
  ],
  "projectMetadata": {
    "totalDuration": "3-4 months",
    "estimatedCost": 5000,
    "complexity": "medium",
    "keyMilestones": ["milestone1", "milestone2"],
    "criticalPath": ["task1", "task2"],
    "riskAssessment": {
      "technical": "Medium risk assessment...",
      "budget": "Budget risk assessment...",
      "timeline": "Timeline risk assessment...",
      "team": "Team risk assessment..."
    }
  },
  "stackAnalysis": {
    "toolsInStack": 8,
    "toolsNeeded": 12,
    "missingTools": ["tool1", "tool2"],
    "additionalCosts": 200
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string" },
                  complexity: { type: "string" },
                  estimatedHours: { type: "number" },
                  estimatedDays: { type: "number" },
                  technicalRequirements: { type: "array", items: { type: "string" } },
                  acceptanceCriteria: { type: "array", items: { type: "string" } },
                  suggestedTools: { type: "array", items: { type: "string" } },
                  requiredTools: { type: "array", items: { type: "string" } },
                  costEstimate: { type: "number" },
                  resourceRequirements: {
                    type: "object",
                    properties: {
                      skillsNeeded: { type: "array", items: { type: "string" } },
                      teamMembers: { type: "number" },
                      externalResources: { type: "array", items: { type: "string" } }
                    }
                  },
                  dependencies: { type: "array", items: { type: "string" } }
                },
                required: ["title", "description", "category", "priority", "complexity", "estimatedHours", "estimatedDays", "technicalRequirements", "acceptanceCriteria", "suggestedTools", "requiredTools", "costEstimate", "resourceRequirements", "dependencies"]
              }
            },
            projectMetadata: {
              type: "object",
              properties: {
                totalDuration: { type: "string" },
                estimatedCost: { type: "number" },
                complexity: { type: "string" },
                keyMilestones: { type: "array", items: { type: "string" } },
                criticalPath: { type: "array", items: { type: "string" } },
                riskAssessment: {
                  type: "object",
                  properties: {
                    technical: { type: "string" },
                    budget: { type: "string" },
                    timeline: { type: "string" },
                    team: { type: "string" }
                  }
                }
              }
            },
            stackAnalysis: {
              type: "object",
              properties: {
                toolsInStack: { type: "number" },
                toolsNeeded: { type: "number" },
                missingTools: { type: "array", items: { type: "string" } },
                additionalCosts: { type: "number" }
              }
            }
          },
          required: ["tasks", "projectMetadata", "stackAnalysis"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Failed to generate project tasks:", error);
    throw new Error(`Failed to generate project tasks: ${error}`);
  }
}

export async function optimizeTaskSequencing(
  tasks: GeneratedTask[],
  userContext: UserAIContext
): Promise<{
  optimizedOrder: string[];
  timeline: TaskTimeline;
  recommendations: string[];
}> {
  try {
    const tasksData = tasks.map(t => ({
      title: t.title,
      category: t.category,
      priority: t.priority,
      complexity: t.complexity,
      estimatedDays: t.estimatedDays,
      dependencies: t.dependencies
    }));
    
    const teamText = userContext.teamSize ? `Team size: ${userContext.teamSize}\n` : "";
    const levelText = userContext.technicalLevel ? `Technical level: ${userContext.technicalLevel}\n` : "";
    
    const prompt = `You are an expert project manager specializing in task sequencing and timeline optimization.

User Context:
${teamText}${levelText}

Tasks to sequence:
${JSON.stringify(tasksData, null, 2)}

Analyze these tasks and create an optimized implementation sequence that:
1. Respects all dependencies between tasks
2. Maximizes parallel work opportunities
3. Prioritizes high-impact tasks and critical path items
4. Groups related tasks for efficiency
5. Considers team capacity and skill distribution
6. Balances workload across project phases
7. Identifies potential bottlenecks and risks

Provide:
1. Optimized task order (array of task titles)
2. Project timeline with phases and parallel tracks
3. Recommendations for improving the sequence

Respond with JSON in this exact format:
{
  "optimizedOrder": ["task_title_1", "task_title_2"],
  "timeline": {
    "phases": [
      {
        "name": "Phase 1: Setup",
        "duration": "2 weeks",
        "tasks": ["task1", "task2"],
        "parallelTracks": [
          {
            "name": "Track A",
            "tasks": ["task1"]
          }
        ]
      }
    ],
    "criticalPath": ["task1", "task2"],
    "totalDuration": "12 weeks",
    "milestones": [
      {
        "name": "MVP Complete",
        "tasks": ["task1", "task2"]
      }
    ]
  },
  "recommendations": [
    "Consider parallelizing tasks X and Y",
    "Critical bottleneck at task Z"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            optimizedOrder: { type: "array", items: { type: "string" } },
            timeline: {
              type: "object",
              properties: {
                phases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      duration: { type: "string" },
                      tasks: { type: "array", items: { type: "string" } },
                      parallelTracks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            tasks: { type: "array", items: { type: "string" } }
                          }
                        }
                      }
                    }
                  }
                },
                criticalPath: { type: "array", items: { type: "string" } },
                totalDuration: { type: "string" },
                milestones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      tasks: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          },
          required: ["optimizedOrder", "timeline", "recommendations"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Failed to optimize task sequencing:", error);
    throw new Error(`Failed to optimize task sequencing: ${error}`);
  }
}

export async function generateTaskRefinements(
  tasks: GeneratedTask[],
  feedback: string,
  userContext: UserAIContext
): Promise<{
  refinedTasks: GeneratedTask[];
  changes: Array<{
    taskTitle: string;
    changeType: "modified" | "added" | "removed" | "split" | "merged";
    description: string;
  }>;
}> {
  try {
    const teamText = userContext.teamSize ? `Team size: ${userContext.teamSize}\n` : "";
    const levelText = userContext.technicalLevel ? `Technical level: ${userContext.technicalLevel}\n` : "";
    
    const prompt = `You are an expert project manager specializing in task refinement and optimization.

User Context:
${teamText}${levelText}

Current Tasks:
${JSON.stringify(tasks, null, 2)}

User Feedback:
${feedback}

Based on the user feedback, refine the task list by:
1. Modifying existing tasks to better meet requirements
2. Adding missing tasks that were identified
3. Removing unnecessary or redundant tasks
4. Splitting complex tasks into smaller, manageable pieces
5. Merging related tasks that can be done together
6. Adjusting estimates, priorities, or dependencies
7. Improving task descriptions and acceptance criteria

Provide:
1. Complete refined task list
2. Summary of all changes made

Respond with JSON in this exact format:
{
  "refinedTasks": [
    {
      "title": "Task Title",
      "description": "Detailed task description...",
      "category": "setup",
      "priority": "high",
      "complexity": "medium",
      "estimatedHours": 8,
      "estimatedDays": 1,
      "technicalRequirements": ["requirement1"],
      "acceptanceCriteria": ["criteria1"],
      "suggestedTools": ["tool1"],
      "requiredTools": ["new_tool1"],
      "costEstimate": 50,
      "resourceRequirements": {
        "skillsNeeded": ["skill1"],
        "teamMembers": 1,
        "externalResources": ["resource1"]
      },
      "dependencies": ["prerequisite_task"]
    }
  ],
  "changes": [
    {
      "taskTitle": "Task Name",
      "changeType": "modified",
      "description": "Updated estimates based on feedback"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            refinedTasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string" },
                  complexity: { type: "string" },
                  estimatedHours: { type: "number" },
                  estimatedDays: { type: "number" },
                  technicalRequirements: { type: "array", items: { type: "string" } },
                  acceptanceCriteria: { type: "array", items: { type: "string" } },
                  suggestedTools: { type: "array", items: { type: "string" } },
                  requiredTools: { type: "array", items: { type: "string" } },
                  costEstimate: { type: "number" },
                  resourceRequirements: {
                    type: "object",
                    properties: {
                      skillsNeeded: { type: "array", items: { type: "string" } },
                      teamMembers: { type: "number" },
                      externalResources: { type: "array", items: { type: "string" } }
                    }
                  },
                  dependencies: { type: "array", items: { type: "string" } }
                }
              }
            },
            changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  taskTitle: { type: "string" },
                  changeType: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          },
          required: ["refinedTasks", "changes"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Failed to generate task refinements:", error);
    throw new Error(`Failed to generate task refinements: ${error}`);
  }
}
