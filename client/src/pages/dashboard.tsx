import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Bolt, Layers, Lightbulb, Plus, Edit, Trash2, AlertTriangle, Target, TrendingUp, Clock, Power, AlertCircle, BarChart3, ArrowUp, ArrowDown, Minus, Brain, Shield } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import { CategoryChart } from "@/components/charts/category-chart";
import { PopularityChart } from "@/components/charts/popularity-chart";
import { CostTrendsChart } from "@/components/charts/cost-trends-chart";
import type { UserToolWithTool, UserBudgetResponse, BudgetStatusResponse, CostTrendsResponse, StackAnalysisResponse, StackRedundanciesResponse, CompatibilityIssuesResponse } from "@shared/schema";


export default function Dashboard() {
  const [budgetInput, setBudgetInput] = useState("");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [costTrendsPeriod, setCostTrendsPeriod] = useState(30);
  const { toast } = useToast();

  const { data: userTools = [], isLoading: userToolsLoading } = useQuery<UserToolWithTool[]>({
    queryKey: ["/api/user-tools"],
  });

  const { data: savedIdeas = [] } = useQuery({
    queryKey: ["/api/saved-ideas"],
  });

  const { data: userBudget } = useQuery<UserBudgetResponse>({
    queryKey: ["/api/user/budget"],
  });

  const { data: budgetStatus } = useQuery<BudgetStatusResponse>({
    queryKey: ["/api/budget/status"],
  });

  const { data: dormantTools = [] } = useQuery<UserToolWithTool[]>({
    queryKey: ["/api/user-tools/dormant", { days: 30 }],
  });

  const { data: costTrends, isLoading: costTrendsLoading } = useQuery<CostTrendsResponse>({
    queryKey: ["/api/cost-trends", { days: costTrendsPeriod }],
  });

  // Stack Intelligence queries
  const { data: stackAnalysis } = useQuery<StackAnalysisResponse>({
    queryKey: ["/api/stack/analysis"],
  });

  const { data: redundancies } = useQuery<StackRedundanciesResponse>({
    queryKey: ["/api/stack/redundancies"],
  });

  const { data: compatibility } = useQuery<CompatibilityIssuesResponse>({
    queryKey: ["/api/stack/compatibility"],
  });

  // Use server-calculated total from budgetStatus for consistency
  const totalCost = budgetStatus?.currentSpend || 0;

  // Budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (monthlyBudget: string | null) => {
      return apiRequest("PUT", "/api/user/budget", { monthlyBudget });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/budget"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/redundancies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/compatibility"] });
      setIsEditingBudget(false);
      setBudgetInput("");
      toast({
        title: "Budget updated",
        description: "Your monthly budget has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update budget. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleBudgetSave = () => {
    const budget = budgetInput.trim() === "" ? null : budgetInput;
    if (budget !== null && (isNaN(Number(budget)) || Number(budget) < 0)) {
      toast({
        title: "Invalid budget",
        description: "Please enter a valid budget amount.",
        variant: "destructive",
      });
      return;
    }
    updateBudgetMutation.mutate(budget);
  };

  const handleBudgetEdit = () => {
    setIsEditingBudget(true);
    setBudgetInput(userBudget?.monthlyBudget || "");
  };

  const handleBudgetCancel = () => {
    setIsEditingBudget(false);
    setBudgetInput("");
  };

  const activeTools = userTools.filter(tool => tool.isActive).length;
  const inactiveTools = userTools.filter(tool => !tool.isActive).length;
  const dormantCount = dormantTools.length;
  const dormantCostSavings = dormantTools.reduce((sum, tool) => sum + parseFloat(tool.monthlyCost || "0"), 0);

  const categories = Array.from(new Set(userTools.map(item => item.tool.category)));
  const categoriesCount = categories.length;

  const savedIdeasCount = Array.isArray(savedIdeas) ? savedIdeas.length : 0;

  // Recent activity (last 5 added tools)
  const recentActivity = userTools
    .filter(item => item.addedAt)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
            <p className="text-muted-foreground">Monitor your tech stack value and composition</p>
          </div>

          {/* Dormant Tools Alert */}
          {dormantCount > 0 && (
            <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950" data-testid="alert-dormant-tools">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>{dormantCount} Dormant Tool{dormantCount > 1 ? 's' : ''} Found!</strong> You have {dormantCount} tool{dormantCount > 1 ? 's' : ''} that haven't been used recently, potentially wasting <strong>${dormantCostSavings.toFixed(2)}/month</strong>. <a href="/my-stack" className="underline">Review your stack →</a>
              </AlertDescription>
            </Alert>
          )}

          {/* Budget Alert */}
          {budgetStatus?.status === "exceeded" && (
            <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950" data-testid="alert-budget-optimization">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Budget Optimization Opportunity!</strong> You're spending ${budgetStatus.currentSpend.toFixed(2)}, which is ${(budgetStatus.currentSpend - (budgetStatus.monthlyBudget || 0)).toFixed(2)} over your ${(budgetStatus.monthlyBudget || 0).toFixed(2)} monthly budget. <a href="/my-stack" className="underline">Review your stack for cost savings →</a>
              </AlertDescription>
            </Alert>
          )}

          {budgetStatus?.status === "warning" && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950" data-testid="alert-budget-warning">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Budget Warning!</strong> You're using {budgetStatus.percentage.toFixed(0)}% of your monthly budget. Consider reviewing your spending.
              </AlertDescription>
            </Alert>
          )}

          {/* Stack Intelligence Overview */}
          {stackAnalysis && (
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-blue-800" data-testid="card-stack-intelligence">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Brain className="h-5 w-5" />
                  Stack Intelligence Overview
                  <a 
                    href="/intelligence" 
                    className="ml-auto text-sm font-normal text-blue-600 dark:text-blue-400 hover:underline"
                    data-testid="link-detailed-analysis"
                  >
                    View detailed analysis →
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Stack Health Score */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Stack Health</p>
                      <p className={`text-lg font-bold ${
                        stackAnalysis.stackHealthScore >= 80 ? 'text-green-600 dark:text-green-400' :
                        stackAnalysis.stackHealthScore >= 60 ? 'text-orange-600 dark:text-orange-400' :
                        'text-red-600 dark:text-red-400'
                      }`} data-testid="text-health-score">
                        {stackAnalysis.stackHealthScore}/100
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stackAnalysis.stackHealthScore >= 80 ? 'Well optimized' :
                         stackAnalysis.stackHealthScore >= 60 ? 'Room for improvement' : 'Optimization potential'}
                      </p>
                    </div>
                  </div>

                  {/* Optimization Score */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Optimization Score</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="text-optimization-score">
                        {stackAnalysis.optimizationScore || 75}/100
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Efficiency rating
                      </p>
                    </div>
                  </div>

                  {/* Potential Savings */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Potential Savings</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-potential-savings">
                        ${redundancies?.totalPotentialSavings.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Per month
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Recommendations */}
                {stackAnalysis.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-foreground mb-3">Top Recommendations:</h4>
                    <div className="space-y-2">
                      {stackAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/40 dark:bg-gray-900/20" data-testid={`recommendation-${index}`}>
                          <Badge 
                            className={
                              rec.priority === 'critical' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' :
                              rec.priority === 'optimization' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' :
                              rec.priority === 'suggestion' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' :
                              'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800'
                            }
                          >
                            {rec.priority === 'critical' ? 'Critical' :
                             rec.priority === 'optimization' ? 'Optimize' :
                             rec.priority === 'suggestion' ? 'Suggestion' : 'Note'}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{rec.title || rec.description}</p>
                            <p className="text-xs text-muted-foreground">{rec.benefits || rec.reasoning}</p>
                          </div>
                          {rec.potentialSavings && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              ${rec.potentialSavings.toFixed(2)}/mo
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Budget Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Monthly Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingBudget ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter monthly budget"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      data-testid="input-budget"
                    />
                    <Button
                      onClick={handleBudgetSave}
                      disabled={updateBudgetMutation.isPending}
                      data-testid="button-save-budget"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleBudgetCancel}
                      disabled={updateBudgetMutation.isPending}
                      data-testid="button-cancel-budget"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-budget-amount">
                        {userBudget?.monthlyBudget ? `$${parseFloat(userBudget.monthlyBudget).toFixed(2)}` : "No budget set"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current spend: ${totalCost.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBudgetEdit}
                      data-testid="button-edit-budget"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {userBudget?.monthlyBudget ? "Edit" : "Set Budget"}
                    </Button>
                  </div>
                  
                  {budgetStatus?.monthlyBudget && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Budget Usage</span>
                        <span className={`font-medium ${
                          budgetStatus.status === "exceeded" ? "text-red-600 dark:text-red-400" :
                          budgetStatus.status === "warning" ? "text-yellow-600 dark:text-yellow-400" :
                          "text-green-600 dark:text-green-400"
                        }`}>
                          {budgetStatus.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(budgetStatus.percentage, 100)}
                        className={`h-2 ${
                          budgetStatus.status === "exceeded" ? "[&>div]:bg-red-500" :
                          budgetStatus.status === "warning" ? "[&>div]:bg-yellow-500" :
                          "[&>div]:bg-green-500"
                        }`}
                        data-testid="progress-budget"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Monthly Cost</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-foreground" data-testid="text-total-cost">
                        ${totalCost.toFixed(2)}
                      </p>
                      {budgetStatus?.monthlyBudget && (
                        <p className="text-sm text-muted-foreground" data-testid="text-budget-context">
                          of ${budgetStatus.monthlyBudget.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {budgetStatus?.monthlyBudget && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            budgetStatus.status === "exceeded" ? "bg-red-500" :
                            budgetStatus.status === "warning" ? "bg-yellow-500" :
                            "bg-green-500"
                          }`}></div>
                          <p className={`text-xs font-medium ${
                            budgetStatus.status === "exceeded" ? "text-red-600 dark:text-red-400" :
                            budgetStatus.status === "warning" ? "text-yellow-600 dark:text-yellow-400" :
                            "text-green-600 dark:text-green-400"
                          }`} data-testid="text-budget-status">
                            {budgetStatus.percentage.toFixed(0)}% of budget used
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Tools</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-active-tools">
                      {activeTools}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {inactiveTools + dormantCount} inactive/dormant
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Power className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-categories">
                      {categoriesCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Layers className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Saved Ideas</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-saved-ideas">
                      {savedIdeasCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Trends Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cost Trends Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={costTrendsPeriod === 7 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCostTrendsPeriod(7)}
                    data-testid="button-trends-7d"
                  >
                    7 Days
                  </Button>
                  <Button
                    variant={costTrendsPeriod === 30 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCostTrendsPeriod(30)}
                    data-testid="button-trends-30d"
                  >
                    30 Days
                  </Button>
                  <Button
                    variant={costTrendsPeriod === 90 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCostTrendsPeriod(90)}
                    data-testid="button-trends-90d"
                  >
                    90 Days
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Trend Summary Metrics */}
              {costTrends && !costTrendsLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {costTrends.summary.trend === 'up' ? (
                        <ArrowUp className="h-4 w-4 text-red-500" />
                      ) : costTrends.summary.trend === 'down' ? (
                        <ArrowDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm font-medium text-muted-foreground">Trend</span>
                    </div>
                    <p className="text-lg font-bold" data-testid="text-trend-direction">
                      {costTrends.summary.changePercentage >= 0 ? '+' : ''}
                      {costTrends.summary.changePercentage.toFixed(1)}%
                    </p>
                    <Badge 
                      variant={
                        costTrends.summary.trend === 'up' ? 'destructive' :
                        costTrends.summary.trend === 'down' ? 'default' : 
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {costTrends.summary.trend === 'up' ? 'Increasing' :
                       costTrends.summary.trend === 'down' ? 'Decreasing' : 
                       'Stable'}
                    </Badge>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current</p>
                    <p className="text-lg font-bold" data-testid="text-current-cost">
                      ${costTrends.summary.currentCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Average</p>
                    <p className="text-lg font-bold" data-testid="text-average-cost">
                      ${costTrends.summary.averageCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">over {costTrendsPeriod} days</p>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Peak Cost</p>
                    <p className="text-lg font-bold" data-testid="text-peak-cost">
                      ${costTrends.summary.highestCost.toFixed(2)}
                    </p>
                    {costTrends.summary.changeAmount !== 0 && (
                      <p className={`text-xs font-medium ${
                        costTrends.summary.changeAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {costTrends.summary.changeAmount >= 0 ? '+' : ''}
                        ${costTrends.summary.changeAmount.toFixed(2)} this period
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cost Trends Chart */}
              <div className="mt-4">
                <CostTrendsChart 
                  trendsData={costTrends || { data: [], summary: { currentCost: 0, previousCost: 0, changeAmount: 0, changePercentage: 0, trend: 'stable', averageCost: 0, highestCost: 0, lowestCost: 0, totalDays: 0 } }} 
                  isLoading={costTrendsLoading} 
                />
              </div>

              {/* Trend Insights */}
              {costTrends && !costTrendsLoading && costTrends.data.length > 1 && (
                <div className="mt-6 p-4 rounded-lg border bg-card">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Insights
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {costTrends.summary.trend === 'up' && (
                      <p data-testid="text-insight-increasing">
                        📈 Your costs have increased by ${Math.abs(costTrends.summary.changeAmount).toFixed(2)} ({Math.abs(costTrends.summary.changePercentage).toFixed(1)}%) over the last {costTrendsPeriod} days. Consider reviewing recently added tools or subscriptions.
                      </p>
                    )}
                    {costTrends.summary.trend === 'down' && (
                      <p data-testid="text-insight-decreasing">
                        📉 Great job! You've reduced costs by ${Math.abs(costTrends.summary.changeAmount).toFixed(2)} ({Math.abs(costTrends.summary.changePercentage).toFixed(1)}%) over the last {costTrendsPeriod} days.
                      </p>
                    )}
                    {costTrends.summary.trend === 'stable' && (
                      <p data-testid="text-insight-stable">
                        📊 Your costs have remained stable over the last {costTrendsPeriod} days, showing good cost control.
                      </p>
                    )}
                    {costTrends.summary.totalDays > 0 && (
                      <p data-testid="text-insight-datapoints">
                        📋 Analysis based on {costTrends.summary.totalDays} data points over {costTrendsPeriod} days.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryChart userTools={userTools} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bolt by Popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <PopularityChart userTools={userTools} />
              </CardContent>
            </Card>
          </div>

          {/* Dormant Tools Section */}
          {dormantCount > 0 && (
            <Card className="mb-8 border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Dormant Tools - Optimization Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    These tools haven't been used recently and may be wasting money:
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-orange-700 dark:text-orange-300">
                      {dormantCount} tools found
                    </span>
                    <span className="font-medium text-orange-700 dark:text-orange-300">
                      ${dormantCostSavings.toFixed(2)}/month potential savings
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {dormantTools.slice(0, 6).map((tool) => (
                    <div key={tool.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-200 dark:border-orange-800" data-testid={`dormant-tool-${tool.tool.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-foreground">{tool.tool.name}</h4>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                          ${tool.monthlyCost || "0"}/mo
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {tool.lastUsedAt 
                          ? `Last used ${Math.floor((new Date().getTime() - new Date(tool.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                          : "Never used"
                        }
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {dormantCount > 6 && `Showing 6 of ${dormantCount} dormant tools`}
                  </p>
                  <Button asChild size="sm" data-testid="button-review-stack">
                    <a href="/my-stack">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Review Stack
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {userToolsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                        <div className="w-10 h-10 bg-muted-foreground/20 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Plus className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          Added {item.tool.name} to {item.tool.category}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.addedAt).toLocaleDateString()} • 
                          ${item.monthlyCost || "Free"}
                          {item.monthlyCost && "/month"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bolt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">Start by adding tools to your stack to see activity here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
