import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Code, Database, Palette, Server, CreditCard, Wrench, Power, Clock, CheckCircle, AlertCircle, TrendingUp, TrendingDown, ArrowUp, ArrowDown, BarChart3, Brain, Shield, DollarSign } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import type { UserToolWithTool, BudgetStatusResponse, CostTrendsResponse, StackRedundanciesResponse, CompatibilityIssuesResponse } from "@shared/schema";


const getCategoryIcon = (category: string) => {
  switch (category) {
    case "AI Coding Tools":
    case "IDE/Development":
      return Code;
    case "Frontend/Design":
      return Palette;
    case "Backend/Database":
      return Database;
    case "DevOps/Deployment":
      return Server;
    case "Payment Platforms":
      return CreditCard;
    default:
      return Wrench;
  }
};

const getToolPopularityScore = (tool: any): number => {
  const raw = tool?.metrics?.popularity ?? tool?.popularityScore ?? tool?.popularity?.score ?? null;
  const numeric = typeof raw === 'number' ? raw : raw !== null && raw !== undefined ? parseFloat(raw) : NaN;
  return Number.isFinite(numeric) ? numeric : 0;
};

const getToolPopularityLabel = (tool: any): string => {
  const score = getToolPopularityScore(tool);
  return score > 0 ? score.toFixed(1) : 'N/A';
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "AI Coding Tools":
    case "IDE/Development":
      return "text-primary bg-primary/10";
    case "Frontend/Design":
      return "text-secondary bg-secondary/10";
    case "Backend/Database":
      return "text-accent bg-accent/10";
    case "DevOps/Deployment":
      return "text-blue-600 bg-blue-100";
    case "Payment Platforms":
      return "text-orange-600 bg-orange-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export default function MyStack() {
  const { toast } = useToast();
  const [editingTool, setEditingTool] = useState<UserToolWithTool | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: userTools = [], isLoading } = useQuery<UserToolWithTool[]>({
    queryKey: ["/api/user-tools"],
  });

  const { data: budgetStatus } = useQuery<BudgetStatusResponse>({
    queryKey: ["/api/budget/status"],
  });

  const { data: costTrends } = useQuery<CostTrendsResponse>({
    queryKey: ["/api/cost-trends", { days: 30 }], // Focus on last 30 days for recent changes
  });

  // Stack Intelligence queries
  const { data: redundancies } = useQuery<StackRedundanciesResponse>({
    queryKey: ["/api/stack/redundancies"],
  });

  const { data: compatibility } = useQuery<CompatibilityIssuesResponse>({
    queryKey: ["/api/stack/compatibility"],
  });

  const editForm = useForm({
    defaultValues: {
      monthlyCost: "",
      quantity: 1,
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      await apiRequest("PUT", `/api/user-tools/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/redundancies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/compatibility"] });
      setIsEditDialogOpen(false);
      setEditingTool(null);
      toast({
        title: "Tool updated",
        description: "Your tool has been updated successfully.",
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

  const removeToolMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/user-tools/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/redundancies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/compatibility"] });
      toast({
        title: "Tool removed",
        description: "Tool has been removed from your stack.",
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

  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PUT", `/api/user-tools/${id}/usage`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/redundancies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/compatibility"] });
      toast({
        title: "Tool status updated",
        description: "Tool status has been updated successfully.",
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

  const markAsUsedMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/user-tools/${id}/mark-used`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/redundancies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/compatibility"] });
      toast({
        title: "Marked as used",
        description: "Tool has been marked as recently used.",
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

  const handleEditTool = (tool: UserToolWithTool) => {
    setEditingTool(tool);
    editForm.reset({
      monthlyCost: tool.monthlyCost || "",
      quantity: tool.quantity || 1,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTool = (data: any) => {
    if (editingTool) {
      updateToolMutation.mutate({
        id: editingTool.id,
        updates: {
          monthlyCost: data.monthlyCost || "0",
          quantity: parseInt(data.quantity) || 1,
        },
      });
    }
  };

  const handleRemoveTool = (id: string) => {
    if (confirm("Are you sure you want to remove this tool from your stack?")) {
      removeToolMutation.mutate(id);
    }
  };

  const handleToggleActiveStatus = (id: string, currentStatus: boolean) => {
    toggleActiveStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleMarkAsUsed = (id: string) => {
    markAsUsedMutation.mutate(id);
  };

  const formatLastUsed = (lastUsedAt: string | null) => {
    if (!lastUsedAt) return "Never used";
    const lastUsed = new Date(lastUsedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Intelligence helper functions
  const getToolRedundancy = (toolId: string) => {
    if (!redundancies) return null;
    return redundancies.redundancies.find(r => 
      r.tools.some(t => t.toolId === toolId)
    );
  };

  const getToolCompatibilityIssues = (toolId: string) => {
    if (!compatibility) return [];
    return compatibility.issues.filter(issue => 
      issue.toolIds.includes(toolId)
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300';
      case 'optimization': return 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300';
      case 'suggestion': return 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'note': return 'border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300';
      // Legacy support for old severity levels
      case 'high': return 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300';
      case 'medium': return 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300';
      case 'low': return 'border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
      default: return 'border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const isDormant = (tool: UserToolWithTool) => {
    if (!tool.isActive) return true;
    if (!tool.lastUsedAt) return true;
    const lastUsed = new Date(tool.lastUsedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  };

  // Use server-calculated total from budgetStatus for consistency
  const totalCost = budgetStatus?.currentSpend || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">My Tech Stack</h2>
              <p className="text-muted-foreground">
                Manage your current tools and subscriptions • Total: ${totalCost.toFixed(2)}/month
              </p>
            </div>
          </div>

          {/* Intelligence Alerts */}
          {redundancies && redundancies.totalPotentialSavings > 0 && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" data-testid="alert-cost-optimization">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Savings Opportunity:</strong> You could save <strong>${redundancies.totalPotentialSavings.toFixed(2)}/month</strong> by optimizing {redundancies.redundancies.length} tool categor{redundancies.redundancies.length > 1 ? 'ies' : 'y'}. 
                <a href="/intelligence" className="underline ml-1">View optimization details →</a>
              </AlertDescription>
            </Alert>
          )}

          {compatibility && compatibility.issues.filter(i => i.severity === 'critical').length > 0 && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" data-testid="alert-critical-security">
              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Security Notice:</strong> {compatibility.issues.filter(i => i.severity === 'critical').length} critical item{compatibility.issues.filter(i => i.severity === 'critical').length > 1 ? 's' : ''} need{compatibility.issues.filter(i => i.severity === 'critical').length === 1 ? 's' : ''} attention in your stack. 
                <a href="/intelligence" className="underline ml-1">Review security items →</a>
              </AlertDescription>
            </Alert>
          )}

          {/* Cost Trends Context - Show how recent changes affected spending */}
          {costTrends && costTrends.data.length > 1 && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <BarChart3 className="h-5 w-5" />
                  Recent Spending Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Trend Direction */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
                    <div className={`p-2 rounded-full ${
                      costTrends.summary.trend === 'up' ? 'bg-red-100 dark:bg-red-900/30' :
                      costTrends.summary.trend === 'down' ? 'bg-green-100 dark:bg-green-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {costTrends.summary.trend === 'up' ? (
                        <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                      ) : costTrends.summary.trend === 'down' ? (
                        <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">30-Day Trend</p>
                      <p className={`text-lg font-bold ${
                        costTrends.summary.trend === 'up' ? 'text-red-600 dark:text-red-400' :
                        costTrends.summary.trend === 'down' ? 'text-green-600 dark:text-green-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} data-testid="text-stack-trend">
                        {costTrends.summary.changePercentage >= 0 ? '+' : ''}
                        {costTrends.summary.changePercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {costTrends.summary.trend === 'up' ? 'Increasing' :
                         costTrends.summary.trend === 'down' ? 'Decreasing' : 'Stable'}
                      </p>
                    </div>
                  </div>

                  {/* Cost Change */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      {costTrends.summary.changeAmount >= 0 ? (
                        <ArrowUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cost Change</p>
                      <p className="text-lg font-bold text-foreground" data-testid="text-cost-change">
                        {costTrends.summary.changeAmount >= 0 ? '+' : ''}
                        ${Math.abs(costTrends.summary.changeAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs last period
                      </p>
                    </div>
                  </div>

                  {/* Average vs Current */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current vs Avg</p>
                      <p className="text-lg font-bold text-foreground" data-testid="text-current-vs-avg">
                        ${costTrends.summary.currentCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avg: ${costTrends.summary.averageCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actionable Insights */}
                <div className="mt-4 p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
                  <h4 className="text-sm font-medium mb-2 text-foreground">💡 Stack Optimization Tips</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {costTrends.summary.trend === 'up' && costTrends.summary.changePercentage > 10 && (
                      <p data-testid="text-tip-increasing">
                        📈 Your costs have increased significantly. Review recently added tools and consider if all are necessary.
                      </p>
                    )}
                    {costTrends.summary.trend === 'down' && (
                      <p data-testid="text-tip-decreasing">
                        📉 Great job reducing costs! Your stack optimization is working well.
                      </p>
                    )}
                    {costTrends.summary.trend === 'stable' && (
                      <p data-testid="text-tip-stable">
                        📊 Your costs are stable. Consider reviewing dormant tools for potential savings.
                      </p>
                    )}
                    {costTrends.summary.currentCost > costTrends.summary.averageCost * 1.1 && (
                      <p data-testid="text-tip-above-average">
                        ⚠️ Current spending is above your 30-day average. Consider deactivating unused tools.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-lg"></div>
                        <div>
                          <div className="h-5 bg-muted rounded w-24 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userTools.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tools in your stack</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your tech stack by discovering and adding tools
                </p>
                <Button data-testid="button-discover-tools" asChild>
                  <a href="/discover">
                    <Plus className="h-4 w-4 mr-2" />
                    Discover Tools
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stack Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {userTools.map((item) => {
                  const IconComponent = getCategoryIcon(item.tool.category);
                  const popularityScore = getToolPopularityScore(item.tool);
                  const popularityLabel = getToolPopularityLabel(item.tool);
                  const iconColorClass = getCategoryColor(item.tool.category);
                  
                  return (
                    <Card key={item.id} className={`hover:shadow-md transition-shadow ${isDormant(item) ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20' : item.isActive ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : 'border-gray-300 bg-gray-50/50 dark:border-gray-600 dark:bg-gray-800/20'}`}>
                      <CardContent className="p-6">
                        {/* Status indicators */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            {isDormant(item) && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-100 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950" data-testid={`badge-unused-${item.tool.id}`}>
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Unused
                              </Badge>
                            )}
                            {item.isActive ? (
                              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-800 dark:bg-green-950" data-testid={`badge-active-${item.tool.id}`}>
                                <Power className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 border-gray-300 bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800" data-testid={`badge-inactive-${item.tool.id}`}>
                                <Power className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                            
                            {/* Intelligence Badges */}
                            {(() => {
                              const redundancy = getToolRedundancy(item.toolId);
                              if (redundancy) {
                                return (
                                  <Badge variant="outline" className={getSeverityColor(redundancy.severity)} data-testid={`badge-savings-${item.tool.id}`}>
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Savings
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                            
                            {(() => {
                              const issues = getToolCompatibilityIssues(item.toolId);
                              const criticalIssues = issues.filter(i => i.severity === 'critical');
                              if (criticalIssues.length > 0) {
                                return (
                                  <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300" data-testid={`badge-security-${item.tool.id}`}>
                                    <Shield className="h-3 w-3 mr-1" />
                                    Security
                                  </Badge>
                                );
                              }
                              const optimizationIssues = issues.filter(i => i.severity === 'optimization');
                              if (optimizationIssues.length > 0) {
                                return (
                                  <Badge variant="outline" className="border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300" data-testid={`badge-optimization-${item.tool.id}`}>
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    Optimize
                                  </Badge>
                                );
                              }
                              const suggestionIssues = issues.filter(i => i.severity === 'suggestion');
                              if (suggestionIssues.length > 0) {
                                return (
                                  <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300" data-testid={`badge-suggestion-${item.tool.id}`}>
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Suggestion
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center" data-testid={`text-last-used-${item.tool.id}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {formatLastUsed(item.lastUsedAt)}
                          </span>
                        </div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClass}`}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground" data-testid={`text-tool-name-${item.tool.id}`}>
                                {item.tool.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {item.tool.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActiveStatus(item.id, item.isActive)}
                              data-testid={`button-toggle-active-${item.tool.id}`}
                              className={item.isActive ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-500"}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsUsed(item.id)}
                              data-testid={`button-mark-used-${item.tool.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTool(item)}
                              data-testid={`button-edit-${item.tool.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTool(item.id)}
                              data-testid={`button-remove-${item.tool.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Monthly Cost</span>
                            <span className={`text-sm font-medium ${!item.isActive ? 'text-muted-foreground line-through' : 'text-foreground'}`} data-testid={`text-cost-${item.tool.id}`}>
                              {item.monthlyCost ? `$${item.monthlyCost}` : "Free"}
                              {!item.isActive && <span className="text-xs ml-1">(inactive)</span>}
                            </span>
                          </div>
                          {popularityScore > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Popularity</span>
                              <div className="flex items-center">
                                <div className="w-16 bg-muted rounded-full h-2 mr-2">
                                  <div
                                    className="bg-secondary h-2 rounded-full"
                                    style={{ width: `${Math.min(popularityScore, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {popularityLabel}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Stack Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Stack Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tool</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Used</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cost</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {userTools.map((item) => {
                          const IconComponent = getCategoryIcon(item.tool.category);
                          const iconColorClass = getCategoryColor(item.tool.category);
                          
                          return (
                            <tr key={item.id} className={isDormant(item) ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''}>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${iconColorClass}`}>
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-foreground">{item.tool.name}</span>
                                    <span className="text-xs text-muted-foreground">{item.tool.category}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  {isDormant(item) && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-100 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Dormant
                                    </Badge>
                                  )}
                                  {item.isActive ? (
                                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-800 dark:bg-green-950">
                                      <Power className="h-3 w-3 mr-1" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500 border-gray-300 bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">
                                      <Power className="h-3 w-3 mr-1" />
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatLastUsed(item.lastUsedAt)}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-foreground">
                                <span className={!item.isActive ? 'line-through text-muted-foreground' : ''}>
                                  {item.monthlyCost ? `$${item.monthlyCost}/month` : "Free"}
                                </span>
                                {!item.isActive && <span className="text-xs ml-1">(inactive)</span>}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleActiveStatus(item.id, item.isActive)}
                                    data-testid={`button-table-toggle-active-${item.tool.id}`}
                                    className={item.isActive ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-500"}
                                    title={item.isActive ? "Mark as inactive" : "Mark as active"}
                                  >
                                    <Power className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsUsed(item.id)}
                                    data-testid={`button-table-mark-used-${item.tool.id}`}
                                    title="Mark as used today"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTool(item)}
                                    data-testid={`button-table-edit-${item.tool.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveTool(item.id)}
                                    data-testid={`button-table-remove-${item.tool.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Edit Tool Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent data-testid="dialog-edit-tool">
              <DialogHeader>
                <DialogTitle>Edit Tool</DialogTitle>
              </DialogHeader>
              {editingTool && (
                <form onSubmit={editForm.handleSubmit(handleUpdateTool)} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-tool-name">Tool Name</Label>
                    <Input
                      id="edit-tool-name"
                      value={editingTool.tool.name}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-monthly-cost">Monthly Cost ($)</Label>
                    <Input
                      id="edit-monthly-cost"
                      data-testid="input-edit-monthly-cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...editForm.register("monthlyCost")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-quantity">Quantity</Label>
                    <Input
                      id="edit-quantity"
                      data-testid="input-edit-quantity"
                      type="number"
                      min="1"
                      {...editForm.register("quantity")}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      data-testid="button-save-edit"
                      disabled={updateToolMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
