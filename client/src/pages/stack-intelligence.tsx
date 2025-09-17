import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, Target, TrendingUp, Brain, Lightbulb, AlertCircle, DollarSign, Plus, Trash2, RefreshCw, BookOpen } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import type { StackAnalysisResponse, StackRedundanciesResponse, MissingStackPiecesResponse, CompatibilityIssuesResponse } from "@shared/schema";

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    case 'optimization': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    case 'suggestion': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    case 'note': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    // Legacy support for old severity levels
    case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
  }
};

const getImportanceColor = (importance: 'critical' | 'important' | 'recommended' | 'essential' | 'beneficial' | 'optional') => {
  switch (importance) {
    case 'critical':
    case 'essential':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    case 'important':
    case 'beneficial':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    case 'recommended':
    case 'optional':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    case 'optimization': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    case 'suggestion': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    case 'note': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    // Legacy support for old priority levels
    case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
  }
};

const getToolPopularityDisplay = (tool: any): string => {
  const raw = tool?.metrics?.popularity ?? tool?.popularityScore ?? tool?.popularity?.score ?? null;
  const numeric = typeof raw === 'number' ? raw : raw !== null && raw !== undefined ? parseFloat(raw) : NaN;
  return Number.isFinite(numeric) ? numeric.toFixed(1) : 'N/A';
};

const getToolQualityDisplay = (tool: any): string => {
  const raw = tool?.metrics?.quality ?? tool?.qualityScore ?? tool?.maturityScore ?? null;
  const numeric = typeof raw === 'number' ? raw : raw !== null && raw !== undefined ? parseFloat(raw) : NaN;
  return Number.isFinite(numeric) ? numeric.toFixed(1) : 'N/A';
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'Critical';
    case 'optimization':
      return 'Optimization opportunity';
    case 'suggestion':
      return 'Suggestion';
    case 'note':
      return 'Note';
    case 'high':
      return 'High value';
    case 'medium':
      return 'Good value';
    case 'low':
      return 'Consider';
    case 'urgent':
      return 'Urgent';
    default:
      return priority;
  }
};

const getRedundancyImpactLabel = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'High savings';
    case 'optimization':
    case 'medium':
      return 'Medium savings';
    case 'suggestion':
    case 'low':
      return 'Optimization opportunity';
    case 'note':
      return 'Insight';
    default:
      return severity;
  }
};

export default function StackIntelligence() {
  const { data: analysis, isLoading: analysisLoading } = useQuery<StackAnalysisResponse>({
    queryKey: ["/api/stack/analysis"],
  });

  const { data: redundancies, isLoading: redundanciesLoading } = useQuery<StackRedundanciesResponse>({
    queryKey: ["/api/stack/redundancies"],
  });

  const { data: missing, isLoading: missingLoading } = useQuery<MissingStackPiecesResponse>({
    queryKey: ["/api/stack/missing"],
  });

  const { data: compatibility, isLoading: compatibilityLoading } = useQuery<CompatibilityIssuesResponse>({
    queryKey: ["/api/stack/compatibility"],
  });

  const isLoading = analysisLoading || redundanciesLoading || missingLoading || compatibilityLoading;

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getHealthScoreDescription = (score: number) => {
    if (score >= 80) return "Well optimized - Your tech stack performs efficiently";
    if (score >= 60) return "Room for improvement - Some optimization opportunities available";
    if (score >= 40) return "Optimization potential - Multiple enhancement opportunities identified";
    return "High optimization potential - Significant value improvements possible";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Stack Intelligence</h2>
            </div>
            <p className="text-muted-foreground">AI-powered optimization insights and value recommendations for your tech stack</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Analyzing your stack...</span>
            </div>
          ) : (
            <>
              {/* Stack Health Score Overview */}
              {analysis && (
                <Card className="mb-8" data-testid="card-stack-health">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Stack Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getHealthScoreColor(analysis.stackHealthScore)}`} data-testid="text-health-score">
                          {analysis.stackHealthScore}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                      </div>
                      <div className="flex-1">
                        <Progress 
                          value={analysis.stackHealthScore} 
                          className="h-3 mb-2" 
                          data-testid="progress-health-score"
                        />
                        <p className="text-sm text-muted-foreground">
                          {getHealthScoreDescription(analysis.stackHealthScore)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                  <TabsTrigger value="redundancies" data-testid="tab-redundancies">Cost Savings</TabsTrigger>
                  <TabsTrigger value="missing" data-testid="tab-missing">Recommendations</TabsTrigger>
                  <TabsTrigger value="compatibility" data-testid="tab-compatibility">Compatibility</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Optimization Opportunities */}
                      <Card data-testid="card-optimization-opportunities">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <TrendingUp className="h-5 w-5" />
                            Optimization Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2" data-testid="text-optimization-score">
                            {analysis.optimizationScore || Math.max(0, 100 - (analysis.recommendations.filter(r => r.priority === 'critical').length * 15))}/100
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Stack efficiency and value rating
                          </p>
                        </CardContent>
                      </Card>

                      {/* Cost Savings */}
                      <Card data-testid="card-cost-savings">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <DollarSign className="h-5 w-5" />
                            Potential Savings
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2" data-testid="text-potential-savings">
                            ${redundancies?.totalPotentialSavings.toFixed(2) || '0.00'}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Monthly savings from removing redundancies
                          </p>
                        </CardContent>
                      </Card>

                      {/* Stack Completeness */}
                      <Card data-testid="card-completeness">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <CheckCircle className="h-5 w-5" />
                            Completeness
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2" data-testid="text-completeness">
                            {missing?.stackCompleteness || 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Essential categories covered
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Top Recommendations */}
                  {analysis && analysis.recommendations.length > 0 && (
                    <Card data-testid="card-top-recommendations">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Top Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.recommendations.slice(0, 5).map((rec, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 border rounded-lg" data-testid={`recommendation-${index}`}>
                              <Badge className={getPriorityColor(rec.priority)}>{getPriorityLabel(rec.priority)}</Badge>
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">{rec.description}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{rec.reasoning}</p>
                                <Badge variant="outline">{rec.category}</Badge>
                                {rec.potentialSavings && (
                                  <Badge variant="outline" className="ml-2">
                                    ${rec.potentialSavings.toFixed(2)}/mo savings
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Redundancies Tab */}
                <TabsContent value="redundancies" className="space-y-6">
                  {redundancies && redundancies.redundancies.length > 0 ? (
                    redundancies.redundancies.map((redundancy, index) => (
                      <Card key={index} data-testid={`redundancy-${index}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{redundancy.category} Optimization</span>
                            <Badge className={getSeverityColor(redundancy.severity)}>
                              {getRedundancyImpactLabel(redundancy.severity)}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Alert data-testid={`alert-redundancy-${index}`}>
                              <DollarSign className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Potential Savings: ${redundancy.potentialSavings.toFixed(2)}/month</strong>
                                <br />
                                {redundancy.recommendation}
                              </AlertDescription>
                            </Alert>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {redundancy.tools.map((userTool, toolIndex) => (
                                <div key={toolIndex} className="border rounded-lg p-4" data-testid={`tool-${index}-${toolIndex}`}>
                                  <h4 className="font-medium">{userTool.tool.name}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    ${userTool.monthlyCost}/month
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline">
                                      Pop: {getToolPopularityDisplay(userTool.tool)}
                                    </Badge>
                                    <Badge variant="outline">
                                      Mat: {getToolQualityDisplay(userTool.tool)}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card data-testid="no-redundancies">
                      <CardContent className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Redundancies Found</h3>
                        <p className="text-muted-foreground">Your stack is well-optimized with no overlapping tools detected.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Missing Pieces Tab */}
                <TabsContent value="missing" className="space-y-6">
                  {missing && missing.missing.length > 0 ? (
                    missing.missing.map((gap, index) => (
                      <Card key={index} data-testid={`missing-${index}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Missing: {gap.category}</span>
                            <Badge className={getImportanceColor(gap.importance)}>
                              {gap.importance}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <p className="text-muted-foreground">{gap.reason}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {gap.suggestedTools.map((tool, toolIndex) => (
                                <div key={toolIndex} className="border rounded-lg p-4" data-testid={`suggested-tool-${index}-${toolIndex}`}>
                                  <h4 className="font-medium">{tool.name}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {tool.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline">
                                      Pop: {getToolPopularityDisplay(tool)}
                                    </Badge>
                                    <Badge variant="outline">
                                      Mat: {getToolQualityDisplay(tool)}
                                    </Badge>
                                  </div>
                                  <Button size="sm" className="w-full mt-3" data-testid={`button-add-tool-${index}-${toolIndex}`}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add to Stack
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card data-testid="no-missing">
                      <CardContent className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Complete Stack</h3>
                        <p className="text-muted-foreground">Your stack covers all essential categories for development.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Compatibility Tab */}
                <TabsContent value="compatibility" className="space-y-6">
                  {compatibility && compatibility.issues.length > 0 ? (
                    <>
                      <Card data-testid="card-compatibility-score">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Compatibility Health
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className={`text-3xl font-bold ${compatibility.riskScore > 50 ? 'text-orange-600 dark:text-orange-400' : compatibility.riskScore > 25 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`} data-testid="text-compatibility-score">
                                {Math.max(0, 100 - compatibility.riskScore)}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">Compatibility %</div>
                            </div>
                            <div className="flex-1">
                              <Progress 
                                value={Math.max(0, 100 - compatibility.riskScore)} 
                                className="h-3 mb-2" 
                                data-testid="progress-compatibility-score"
                              />
                              <p className="text-sm text-muted-foreground">
                                {compatibility.riskScore > 50 ? 'Optimization opportunities - Some tools could work better together' : 
                                 compatibility.riskScore > 25 ? 'Good compatibility - Minor alignment opportunities available' : 
                                 'Excellent compatibility - Tools work well together'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {compatibility.issues.map((issue, index) => (
                        <Card key={index} data-testid={`compatibility-issue-${index}`}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span className="capitalize">{issue.type.replace('_', ' ')}</span>
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity} severity
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <Alert data-testid={`alert-compatibility-${index}`}>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>{issue.description}</strong>
                                  <br />
                                  {issue.recommendation}
                                </AlertDescription>
                              </Alert>
                              
                              <div>
                                <h4 className="font-medium mb-2">Affected Tools:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {issue.toolNames.map((toolName, toolIndex) => (
                                    <Badge key={toolIndex} variant="outline" data-testid={`affected-tool-${index}-${toolIndex}`}>
                                      {toolName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Card data-testid="no-compatibility-issues">
                      <CardContent className="text-center py-8">
                        <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Compatibility Issues</h3>
                        <p className="text-muted-foreground">Your tools appear to be compatible with each other.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}