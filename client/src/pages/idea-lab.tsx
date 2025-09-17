import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wand2, Lightbulb, Star, Trash2, Loader2, Settings, Target, TrendingUp, Users, Building2, Brain, Info, CheckCircle, Calendar, DollarSign, Clock, Map, Workflow } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import RoadmapVisualization from "@/components/roadmap-visualization";
import { TaskGenerationModal } from "@/components/tasks";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SavedIdea, UserToolWithTool, UserAIContext, UserContextUpdate, EnhancedBusinessIdea, ContextualRecommendation, GeneratedTasksResponse } from "@shared/schema";

interface GeneratedIdea {
  title: string;
  description: string;
  monetization: string;
  tags: string[];
}

interface StackAnalysis {
  currentLevel: 'beginner' | 'intermediate' | 'expert';
  recommendations: string[];
  nextSteps: string[];
  maturityScore: number;
}

export default function IdeaLab() {
  const { toast } = useToast();
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [enhancedIdeas, setEnhancedIdeas] = useState<EnhancedBusinessIdea[]>([]);
  const [currentTab, setCurrentTab] = useState("generate");
  const [contextSetup, setContextSetup] = useState(false);
  const [taskGenerationModal, setTaskGenerationModal] = useState<{ isOpen: boolean; idea: SavedIdea | null }>({
    isOpen: false,
    idea: null
  });

  const { data: userTools = [], isLoading: userToolsLoading } = useQuery<UserToolWithTool[]>({
    queryKey: ["/api/user-tools"],
  });

  const { data: savedIdeas = [], isLoading: savedIdeasLoading } = useQuery<SavedIdea[]>({
    queryKey: ["/api/saved-ideas"],
  });

  const { data: userContext, isLoading: contextLoading } = useQuery<UserAIContext>({
    queryKey: ["/api/ai/context"],
  });

  const { data: stackAnalysis, isLoading: analysisLoading } = useQuery<StackAnalysis>({
    queryKey: ["/api/ai/stack-analysis"],
    enabled: !!userTools.length,
  });

  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<ContextualRecommendation[]>({
    queryKey: ["/api/ai/recommendations"],
    enabled: !!userTools.length && !!userContext?.teamSize,
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async ({ selectedTools, goals }: { selectedTools: string[]; goals?: string }) => {
      const response = await apiRequest("POST", "/api/generate-ideas", {
        selectedTools,
        goals,
      });
      return await response.json();
    },
    onSuccess: (ideas: GeneratedIdea[]) => {
      setGeneratedIdeas(ideas);
      toast({
        title: "Ideas generated",
        description: `Generated ${ideas.length} business ideas based on your selected tools.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateEnhancedIdeasMutation = useMutation({
    mutationFn: async ({ selectedTools, goals }: { selectedTools: string[]; goals?: string }) => {
      const response = await apiRequest("POST", "/api/ai/enhanced-ideas", {
        selectedTools,
        goals,
      });
      return await response.json();
    },
    onSuccess: (ideas: EnhancedBusinessIdea[]) => {
      setEnhancedIdeas(ideas);
      toast({
        title: "Enhanced ideas generated",
        description: `Generated ${ideas.length} context-aware business ideas tailored to your profile.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContextMutation = useMutation({
    mutationFn: async (context: Partial<UserAIContext>) => {
      await apiRequest("POST", "/api/ai/context", context);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/context"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/stack-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/recommendations"] });
      toast({
        title: "Context updated",
        description: "Your AI context has been updated successfully.",
      });
      setContextSetup(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveIdeaMutation = useMutation({
    mutationFn: async (idea: Omit<SavedIdea, "id" | "userId" | "createdAt">) => {
      await apiRequest("POST", "/api/saved-ideas", idea);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-ideas"] });
      toast({
        title: "Idea saved",
        description: "Idea has been saved to your collection.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      await apiRequest("DELETE", `/api/saved-ideas/${ideaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-ideas"] });
      toast({
        title: "Idea deleted",
        description: "Idea has been removed from your collection.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToolSelection = (toolName: string, checked: boolean) => {
    setSelectedTools(prev => 
      checked 
        ? [...prev, toolName]
        : prev.filter(name => name !== toolName)
    );
  };

  const handleGenerateIdeas = (enhanced: boolean = false) => {
    if (selectedTools.length === 0) {
      toast({
        title: "No tools selected",
        description: "Please select at least one tool from your stack.",
        variant: "destructive",
      });
      return;
    }

    if (enhanced && !userContext?.teamSize) {
      toast({
        title: "Context required",
        description: "Please set up your AI context first for enhanced recommendations.",
        variant: "destructive",
      });
      setContextSetup(true);
      return;
    }

    if (enhanced) {
      generateEnhancedIdeasMutation.mutate({
        selectedTools,
        goals: goals.trim() || undefined,
      });
    } else {
      generateIdeasMutation.mutate({
        selectedTools,
        goals: goals.trim() || undefined,
      });
    }
  };

  const handleSaveIdea = (idea: GeneratedIdea) => {
    saveIdeaMutation.mutate({
      title: idea.title,
      description: idea.description,
      toolsUsed: selectedTools,
      monetization: idea.monetization,
      tags: idea.tags,
      targetAudience: null,
      implementationComplexity: null,
      estimatedCost: null,
      timeToMarket: null,
    });
  };

  const handleDeleteIdea = (ideaId: string) => {
    if (confirm("Are you sure you want to delete this saved idea?")) {
      deleteIdeaMutation.mutate(ideaId);
    }
  };

  const handleContextSubmit = (formData: FormData) => {
    const teamSizeRaw = formData.get("teamSize");
    const technicalLevelRaw = formData.get("technicalLevel");
    const companyStageRaw = formData.get("companyStage");

    const teamSize = typeof teamSizeRaw === "string" && ["solo", "small", "medium", "large", "enterprise"].includes(teamSizeRaw)
      ? (teamSizeRaw as UserAIContext["teamSize"])
      : undefined;

    const technicalLevel = typeof technicalLevelRaw === "string" && ["beginner", "intermediate", "expert"].includes(technicalLevelRaw)
      ? (technicalLevelRaw as UserAIContext["technicalLevel"])
      : undefined;

    const companyStage = typeof companyStageRaw === "string" && ["idea", "startup", "growth", "mature"].includes(companyStageRaw)
      ? (companyStageRaw as UserAIContext["companyStage"])
      : undefined;

    const primaryGoalsValue = formData.get("primaryGoals");
    const primaryGoals = typeof primaryGoalsValue === "string"
      ? primaryGoalsValue.split(",").map((goal) => goal.trim()).filter(Boolean)
      : undefined;

    const context: UserContextUpdate = {
      teamSize,
      industry: (formData.get("industry") as string | null) || undefined,
      technicalLevel,
      companyStage,
      primaryGoals,
    };

    updateContextMutation.mutate(context);
  };

  // Check if context needs setup on mount
  useEffect(() => {
    if (userContext && !userContext.teamSize && currentTab === "enhanced") {
      setContextSetup(true);
    }
  }, [userContext, currentTab]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">AI Idea Lab</h2>
            <p className="text-muted-foreground">Generate contextual business ideas and get intelligent recommendations</p>
          </div>

          {/* Context Setup Modal */}
          {contextSetup && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Set Up Your AI Context
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Help us provide better recommendations by sharing some context about your team and goals.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleContextSubmit(formData);
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="teamSize">Team Size</Label>
                      <Select name="teamSize" defaultValue={userContext?.teamSize || ""}>
                        <SelectTrigger data-testid="select-team-size">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo (Just me)</SelectItem>
                          <SelectItem value="small">Small (2-5 people)</SelectItem>
                          <SelectItem value="medium">Medium (6-20 people)</SelectItem>
                          <SelectItem value="large">Large (21-100 people)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (100+ people)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select name="industry" defaultValue={userContext?.industry || ""}>
                        <SelectTrigger data-testid="select-industry">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fintech">Fintech</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="saas">SaaS</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="media">Media & Entertainment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="technicalLevel">Technical Level</Label>
                      <Select name="technicalLevel" defaultValue={userContext?.technicalLevel || ""}>
                        <SelectTrigger data-testid="select-technical-level">
                          <SelectValue placeholder="Select technical level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyStage">Company Stage</Label>
                      <Select name="companyStage" defaultValue={userContext?.companyStage || ""}>
                        <SelectTrigger data-testid="select-company-stage">
                          <SelectValue placeholder="Select company stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idea">Idea Stage</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="growth">Growth Stage</SelectItem>
                          <SelectItem value="mature">Mature Company</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="primaryGoals">Primary Goals (comma-separated)</Label>
                      <Textarea
                        name="primaryGoals"
                        placeholder="e.g., build MVP, scale product, reduce costs, improve security"
                        defaultValue={userContext?.primaryGoals?.join(", ") || ""}
                        data-testid="textarea-primary-goals"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setContextSetup(false)}
                      data-testid="button-cancel-context"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateContextMutation.isPending}
                      data-testid="button-save-context"
                    >
                      {updateContextMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Save Context
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Stack Analysis Card */}
          {stackAnalysis && userTools.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Stack Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stackAnalysis.currentLevel.charAt(0).toUpperCase() + stackAnalysis.currentLevel.slice(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stackAnalysis.maturityScore}/100
                    </div>
                    <div className="text-sm text-muted-foreground">Maturity Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {userTools.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Tools in Stack</div>
                  </div>
                </div>
                {stackAnalysis.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Quick Recommendations:</h4>
                    <div className="space-y-1">
                      {stackAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                        <p key={index} className="text-sm text-muted-foreground flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                          {rec}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate" data-testid="tab-generate">Generate Ideas</TabsTrigger>
              <TabsTrigger value="enhanced" data-testid="tab-enhanced">AI Enhanced</TabsTrigger>
              <TabsTrigger value="recommendations" data-testid="tab-recommendations">Smart Recommendations</TabsTrigger>
              <TabsTrigger value="roadmap" data-testid="tab-roadmap">Tech Roadmap</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-8">
              {/* Basic Idea Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Business Ideas
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Generate basic business ideas using your selected tools and goals.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tool Selection */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">
                      Select Tools from Your Stack
                    </Label>
                    {userToolsLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
                              <div className="w-4 h-4 bg-muted-foreground/20 rounded"></div>
                              <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : userTools.length === 0 ? (
                      <div className="text-center py-8">
                        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No tools in your stack</h3>
                        <p className="text-muted-foreground mb-4">
                          Add tools to your stack first to generate ideas
                        </p>
                        <Button asChild>
                          <a href="/discover">Discover Tools</a>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {userTools.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/80 transition-colors"
                          >
                            <Checkbox
                              checked={selectedTools.includes(item.tool.name)}
                              onCheckedChange={(checked) => 
                                handleToolSelection(item.tool.name, checked as boolean)
                              }
                              data-testid={`checkbox-tool-${item.tool.id}`}
                            />
                            <span className="text-sm font-medium">{item.tool.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Goals Input */}
                  <div>
                    <Label htmlFor="goals" className="text-base font-medium">
                      Goals (Optional)
                    </Label>
                    <Textarea
                      id="goals"
                      data-testid="textarea-goals"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      rows={3}
                      placeholder="e.g., Build a SaaS product for developers, Create a marketplace, Focus on AI integration..."
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={() => handleGenerateIdeas(false)}
                    disabled={generateIdeasMutation.isPending || selectedTools.length === 0}
                    data-testid="button-generate-ideas"
                  >
                    {generateIdeasMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Generate Basic Ideas
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Ideas */}
              {generatedIdeas.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-6">Generated Ideas</h3>
                  <div className="space-y-6">
                    {generatedIdeas.map((idea, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Lightbulb className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground" data-testid={`text-idea-title-${index}`}>
                                  {idea.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Using {selectedTools.join(" + ")}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveIdea(idea)}
                              disabled={saveIdeaMutation.isPending}
                              data-testid={`button-save-idea-${index}`}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <p className="text-muted-foreground mb-4" data-testid={`text-idea-description-${index}`}>
                            {idea.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {idea.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <strong>Monetization:</strong> {idea.monetization}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="enhanced" className="space-y-8">
              {!userContext?.teamSize ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Setup Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Set up your AI context to get personalized, enhanced business ideas.
                    </p>
                    <Button onClick={() => setContextSetup(true)} data-testid="button-setup-context">
                      <Settings className="h-4 w-4 mr-2" />
                      Set Up Context
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Context Summary */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Target className="h-5 w-5 mr-2" />
                          Your Profile
                        </CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setContextSetup(true)}
                          data-testid="button-edit-context"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{userContext.teamSize}</span>
                        </div>
                        {userContext.industry && (
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{userContext.industry}</span>
                          </div>
                        )}
                        {userContext.technicalLevel && (
                          <div className="flex items-center space-x-2">
                            <Brain className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{userContext.technicalLevel}</span>
                          </div>
                        )}
                        {userContext.companyStage && (
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{userContext.companyStage}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Idea Generation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brain className="h-5 w-5 mr-2" />
                        Generate Enhanced Ideas
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        AI-powered ideas tailored to your team size, industry, and technical level.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Tool Selection */}
                      <div>
                        <Label className="text-base font-medium mb-3 block">
                          Select Tools from Your Stack
                        </Label>
                        {userToolsLoading ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="animate-pulse">
                                <div className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
                                  <div className="w-4 h-4 bg-muted-foreground/20 rounded"></div>
                                  <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : userTools.length === 0 ? (
                          <div className="text-center py-8">
                            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No tools in your stack</h3>
                            <p className="text-muted-foreground mb-4">
                              Add tools to your stack first to generate ideas
                            </p>
                            <Button asChild>
                              <a href="/discover">Discover Tools</a>
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {userTools.map((item) => (
                              <label
                                key={item.id}
                                className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/80 transition-colors"
                              >
                                <Checkbox
                                  checked={selectedTools.includes(item.tool.name)}
                                  onCheckedChange={(checked) => 
                                    handleToolSelection(item.tool.name, checked as boolean)
                                  }
                                  data-testid={`checkbox-enhanced-tool-${item.tool.id}`}
                                />
                                <span className="text-sm font-medium">{item.tool.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Goals Input */}
                      <div>
                        <Label htmlFor="enhanced-goals" className="text-base font-medium">
                          Goals (Optional)
                        </Label>
                        <Textarea
                          id="enhanced-goals"
                          data-testid="textarea-enhanced-goals"
                          value={goals}
                          onChange={(e) => setGoals(e.target.value)}
                          rows={3}
                          placeholder="e.g., Build a SaaS product for developers, Create a marketplace, Focus on AI integration..."
                          className="mt-2"
                        />
                      </div>

                      <Button
                        onClick={() => handleGenerateIdeas(true)}
                        disabled={generateEnhancedIdeasMutation.isPending || selectedTools.length === 0}
                        data-testid="button-generate-enhanced-ideas"
                      >
                        {generateEnhancedIdeasMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4 mr-2" />
                        )}
                        Generate Enhanced Ideas
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Enhanced Generated Ideas */}
                  {enhancedIdeas.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-6">Enhanced Ideas</h3>
                      <div className="space-y-6">
                        {enhancedIdeas.map((idea, index) => (
                          <Card key={index} className="border-l-4 border-l-primary">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                                    <Brain className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground" data-testid={`text-enhanced-idea-title-${index}`}>
                                      {idea.title}
                                    </h4>
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                      <span className="flex items-center"><Target className="h-3 w-3 mr-1" />Complexity: {idea.implementationComplexity}</span>
                                      <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{idea.timeToMarket}</span>
                                      <span className="flex items-center"><TrendingUp className="h-3 w-3 mr-1" />Fit: {idea.industryFit}/10</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {idea.budgetFriendly && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                      Budget Friendly
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSaveIdea({
                                      title: idea.title,
                                      description: idea.description,
                                      monetization: idea.monetization,
                                      tags: idea.tags
                                    })}
                                    disabled={saveIdeaMutation.isPending}
                                    data-testid={`button-save-enhanced-idea-${index}`}
                                  >
                                    <Star className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground mb-4" data-testid={`text-enhanced-idea-description-${index}`}>
                                {idea.description}
                              </p>
                              
                              {idea.targetAudience && (
                                <div className="mb-4">
                                  <h5 className="font-medium text-sm mb-2 flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    Target Audience:
                                  </h5>
                                  <p className="text-sm text-muted-foreground">{idea.targetAudience}</p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Monetization Strategy:
                                  </h5>
                                  <p className="text-sm text-muted-foreground">{idea.monetization}</p>
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    Team Suitability:
                                  </h5>
                                  <p className="text-sm text-muted-foreground">{idea.teamSuitability}</p>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {idea.tags.map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="secondary">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              {idea.estimatedCost && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <strong>Estimated Cost:</strong>&nbsp;${idea.estimatedCost.toLocaleString()}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-8">
              {recommendationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="h-5 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !userContext?.teamSize ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Setup Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Set up your AI context to get personalized recommendations.
                    </p>
                    <Button onClick={() => setContextSetup(true)} data-testid="button-setup-recommendations">
                      <Settings className="h-4 w-4 mr-2" />
                      Set Up Context
                    </Button>
                  </CardContent>
                </Card>
              ) : recommendations.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No recommendations available</h3>
                    <p className="text-muted-foreground mb-4">
                      Add some tools to your stack to get personalized recommendations.
                    </p>
                    <Button asChild>
                      <a href="/discover">Discover Tools</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-6">Smart Recommendations</h3>
                  <div className="space-y-6">
                    {recommendations.map((rec, index) => (
                      <Card key={index} className={`${
                        rec.priority === 'high' ? 'border-l-4 border-l-red-500' :
                        rec.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                        'border-l-4 border-l-green-500'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                rec.type === 'tool' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                                rec.type === 'process' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                                rec.type === 'architecture' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' :
                                'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {rec.type === 'tool' ? <Target className="h-6 w-6" /> :
                                 rec.type === 'process' ? <TrendingUp className="h-6 w-6" /> :
                                 rec.type === 'architecture' ? <Building2 className="h-6 w-6" /> :
                                 <Info className="h-6 w-6" />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground" data-testid={`text-recommendation-title-${index}`}>
                                  {rec.title}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                    {rec.priority} priority
                                  </Badge>
                                  <span>Effort: {rec.implementationEffort}</span>
                                  <span>Time to value: {rec.timeToValue}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-4">
                            {rec.description}
                          </p>
                          
                          <div className="mb-4">
                            <h5 className="font-medium text-sm mb-2">Why this fits:</h5>
                            <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-primary">
                                {rec.teamSuitability}/10
                              </div>
                              <div className="text-xs text-muted-foreground">Team Fit</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-primary">
                                {rec.industryRelevance}/10
                              </div>
                              <div className="text-xs text-muted-foreground">Industry Relevance</div>
                            </div>
                            {rec.budgetImpact && (
                              <div className="text-center">
                                <div className="text-lg font-semibold text-primary">
                                  ${rec.budgetImpact}
                                </div>
                                <div className="text-xs text-muted-foreground">Monthly Cost</div>
                              </div>
                            )}
                          </div>
                          
                          {rec.suggestedTools && rec.suggestedTools.length > 0 && (
                            <div className="mb-4">
                              <h5 className="font-medium text-sm mb-2">Suggested Tools:</h5>
                              <div className="flex flex-wrap gap-2">
                                {rec.suggestedTools.map((tool, toolIndex) => (
                                  <Badge key={toolIndex} variant="outline">
                                    {tool.name ?? tool.id}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {(rec.dependencies?.length || rec.alternatives?.length) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {rec.dependencies && rec.dependencies.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-1">Dependencies:</h5>
                                  <p className="text-muted-foreground">{rec.dependencies.join(", ")}</p>
                                </div>
                              )}
                              {rec.alternatives && rec.alternatives.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-1">Alternatives:</h5>
                                  <p className="text-muted-foreground">{rec.alternatives.join(", ")}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="roadmap" className="space-y-8">
              <RoadmapVisualization userTools={userTools} />
            </TabsContent>
          </Tabs>

          {/* Saved Ideas */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-foreground mb-6">Saved Ideas</h3>
            
            {savedIdeasLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                        <div className="flex gap-1">
                          <div className="h-6 bg-muted rounded w-16"></div>
                          <div className="h-6 bg-muted rounded w-20"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : savedIdeas.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-foreground mb-2">No saved ideas yet</h4>
                  <p className="text-muted-foreground">
                    Generate some ideas and save your favorites to see them here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedIdeas.map((idea) => (
                  <Card key={idea.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-foreground" data-testid={`text-saved-idea-title-${idea.id}`}>
                          {idea.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIdea(idea.id)}
                          disabled={deleteIdeaMutation.isPending}
                          data-testid={`button-delete-saved-idea-${idea.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {idea.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {idea.toolsUsed?.slice(0, 3).map((tool, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {idea.toolsUsed && idea.toolsUsed.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{idea.toolsUsed.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {idea.tags?.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTaskGenerationModal({ isOpen: true, idea })}
                          className="flex-1"
                          data-testid={`button-generate-tasks-${idea.id}`}
                        >
                          <Workflow className="h-4 w-4 mr-2" />
                          Generate Tasks
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Task Generation Modal */}
      {taskGenerationModal.idea && (
        <TaskGenerationModal
          isOpen={taskGenerationModal.isOpen}
          onClose={() => setTaskGenerationModal({ isOpen: false, idea: null })}
          idea={taskGenerationModal.idea}
          onTasksGenerated={(data: GeneratedTasksResponse) => {
            toast({
              title: "Tasks Generated Successfully!",
              description: `Generated ${data.tasks.length} tasks for "${taskGenerationModal.idea?.title}"`,
            });
            // Optionally navigate to the project tasks page
            // window.location.href = `/projects/${data.generation.id}`;
          }}
        />
      )}
    </div>
  );
}