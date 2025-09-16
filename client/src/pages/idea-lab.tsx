import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, Lightbulb, Star, Trash2, Loader2 } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SavedIdea } from "@shared/schema";

interface GeneratedIdea {
  title: string;
  description: string;
  monetization: string;
  tags: string[];
}

interface UserToolWithTool {
  user_tools: {
    id: string;
    toolId: string;
  };
  tool: {
    id: string;
    name: string;
    category: string;
  };
}

export default function IdeaLab() {
  const { toast } = useToast();
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);

  const { data: userTools = [], isLoading: userToolsLoading } = useQuery<UserToolWithTool[]>({
    queryKey: ["/api/user-tools"],
  });

  const { data: savedIdeas = [], isLoading: savedIdeasLoading } = useQuery<SavedIdea[]>({
    queryKey: ["/api/saved-ideas"],
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

  const handleGenerateIdeas = () => {
    if (selectedTools.length === 0) {
      toast({
        title: "No tools selected",
        description: "Please select at least one tool from your stack.",
        variant: "destructive",
      });
      return;
    }

    generateIdeasMutation.mutate({
      selectedTools,
      goals: goals.trim() || undefined,
    });
  };

  const handleSaveIdea = (idea: GeneratedIdea) => {
    saveIdeaMutation.mutate({
      title: idea.title,
      description: idea.description,
      toolsUsed: selectedTools,
      monetization: idea.monetization,
      tags: idea.tags,
    });
  };

  const handleDeleteIdea = (ideaId: string) => {
    if (confirm("Are you sure you want to delete this saved idea?")) {
      deleteIdeaMutation.mutate(ideaId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">AI Idea Lab</h2>
            <p className="text-muted-foreground">Generate business ideas based on your tech stack</p>
          </div>

          {/* Idea Generation Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2" />
                Generate New Ideas
              </CardTitle>
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
                        key={item.user_tools.id}
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
                onClick={handleGenerateIdeas}
                disabled={generateIdeasMutation.isPending || selectedTools.length === 0}
                data-testid="button-generate-ideas"
              >
                {generateIdeasMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Generate Ideas
              </Button>
            </CardContent>
          </Card>

          {/* Generated Ideas */}
          {generatedIdeas.length > 0 && (
            <div className="mb-12">
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

          {/* Saved Ideas */}
          <div>
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
                      
                      <div className="flex flex-wrap gap-1">
                        {idea.tags?.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
