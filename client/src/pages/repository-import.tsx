import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Github, 
  Loader2, 
  ExternalLink, 
  DollarSign, 
  Star,
  Package,
  Database,
  Cloud,
  Code,
  Shield,
  Monitor,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DetectedTool {
  id: string;
  name: string;
  category: string;
  confidenceScore: number;
  estimatedMonthlyCost: string;
  detectionSource: string[];
  description?: string;
  toolId?: string;
  suggestedTool?: string;
  tool?: {
    id: string;
    name: string;
    description: string;
    category: string;
    pricing: string;
  };
  suggestedToolRef?: {
    id: string;
    name: string;
    description: string;
    category: string;
    pricing: string;
  };
}

interface AnalysisResult {
  analysis: {
    id: string;
    repositoryUrl: string;
    repositoryName: string;
    repositoryOwner: string;
    status: string;
    totalDetectedTools: number;
    estimatedMonthlyCost: string;
    confidenceScore: string;
    completedAt: string;
  };
  detectedTools: DetectedTool[];
  summary: {
    totalTools: number;
    totalEstimatedCost: number;
    confidenceScore: number;
    categories: string[];
  };
}

interface SelectedTool {
  detectedToolId: string;
  monthlyCost?: string;
  quantity?: number;
  isActive?: boolean;
}

// Category normalization for UI consistency (matches server-side normalization)
const normalizeCategoryForUI = (analyzerCategory: string): string => {
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
};

const categoryIcons: Record<string, any> = {
  'Frontend': Code,
  'Backend': Package,
  'Database': Database,
  'DevOps': Cloud,
  'Security': Shield,
  'Monitoring': Monitor,
  'Testing': CheckCircle,
  'Analytics': Info,
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Frontend': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Backend': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Database': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'DevOps': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'Security': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'Monitoring': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Testing': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'Analytics': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
};

export function RepositoryImportPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedTools, setSelectedTools] = useState<Map<string, SelectedTool>>(new Map());
  const [importNotes, setImportNotes] = useState("");
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (data: { repositoryUrl: string; branch?: string }) => {
      const response = await apiRequest("POST", "/api/repositories/analyze", data);
      return await response.json();
    },
    onSuccess: (data: AnalysisResult) => {
      setAnalysisResult(data);
      // Pre-select high confidence tools
      const preSelected = new Map<string, SelectedTool>();
      data.detectedTools
        .filter((tool: DetectedTool) => tool.confidenceScore >= 0.8)
        .forEach((tool: DetectedTool) => {
          preSelected.set(tool.id, {
            detectedToolId: tool.id,
            monthlyCost: tool.estimatedMonthlyCost,
            quantity: 1,
            isActive: true
          });
        });
      setSelectedTools(preSelected);
      setStep(2);
      toast({
        title: "Repository Analyzed",
        description: `Found ${data.detectedTools.length} tools in the repository.`
      });
    },
    onError: (error: any) => {
      let title = "Analysis Failed";
      let description = "Failed to analyze repository";
      
      // Handle specific error types
      if (error.message?.includes("GitHub")) {
        title = "Invalid Repository URL";
        description = "Only GitHub repository URLs are supported for security reasons. Please use a valid GitHub repository URL.";
      } else if (error.message?.includes("security reasons")) {
        title = "URL Not Allowed"; 
        description = "For security reasons, only GitHub repositories can be analyzed. Please provide a GitHub repository URL.";
      } else if (error.message?.includes("rate limit")) {
        title = "Rate Limited";
        description = "GitHub API rate limit exceeded. Please try again later.";
      } else if (error.message?.includes("not found")) {
        title = "Repository Not Found";
        description = "The repository could not be found. Please check the URL and ensure it's publicly accessible.";
      } else {
        description = error.message || description;
      }
      
      toast({
        title,
        description,
        variant: "destructive"
      });
    }
  });

  const importMutation = useMutation({
    mutationFn: async (data: {
      analysisId: string;
      selectedTools: SelectedTool[];
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/repositories/import", data);
      return await response.json();
    },
    onSuccess: (data: { importedTools: number; totalCost: number }) => {
      toast({
        title: "Tools Imported Successfully",
        description: `Imported ${data.importedTools} tools with total monthly cost of $${data.totalCost.toFixed(2)}`
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import tools",
        variant: "destructive"
      });
    }
  });

  const handleAnalyze = () => {
    if (!repositoryUrl.trim()) {
      toast({
        title: "Repository URL Required",
        description: "Please enter a valid repository URL",
        variant: "destructive"
      });
      return;
    }

    analyzeMutation.mutate({ repositoryUrl: repositoryUrl.trim(), branch: branch.trim() || undefined });
  };

  const toggleToolSelection = (toolId: string, tool: DetectedTool) => {
    const newSelected = new Map(selectedTools);
    if (newSelected.has(toolId)) {
      newSelected.delete(toolId);
    } else {
      newSelected.set(toolId, {
        detectedToolId: toolId,
        monthlyCost: tool.estimatedMonthlyCost,
        quantity: 1,
        isActive: true
      });
    }
    setSelectedTools(newSelected);
  };

  const updateToolCost = (toolId: string, cost: string) => {
    const newSelected = new Map(selectedTools);
    const existing = newSelected.get(toolId);
    if (existing) {
      newSelected.set(toolId, { ...existing, monthlyCost: cost });
      setSelectedTools(newSelected);
    }
  };

  const calculateTotalCost = (): number => {
    return Array.from(selectedTools.values())
      .reduce((total, tool) => total + parseFloat(tool.monthlyCost || "0"), 0);
  };

  const handleImport = () => {
    if (!analysisResult || selectedTools.size === 0) {
      toast({
        title: "No Tools Selected",
        description: "Please select at least one tool to import",
        variant: "destructive"
      });
      return;
    }

    importMutation.mutate({
      analysisId: analysisResult.analysis.id,
      selectedTools: Array.from(selectedTools.values()),
      notes: importNotes.trim() || undefined
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          1
        </div>
        <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          2
        </div>
        <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          3
        </div>
      </div>
    </div>
  );

  const renderRepositoryInput = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Repository Analysis
        </CardTitle>
        <CardDescription>
          Enter your repository URL to automatically detect and import your tech stack tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="repository-url">Repository URL</Label>
          <Input
            id="repository-url"
            data-testid="input-repository-url"
            placeholder="https://github.com/username/repository"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            disabled={analyzeMutation.isPending}
          />
          <p className="text-sm text-muted-foreground">
            Supports GitHub, GitLab, and Bitbucket repositories (public and private)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="branch">Branch (Optional)</Label>
          <Input
            id="branch"
            data-testid="input-branch"
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={analyzeMutation.isPending}
          />
        </div>

        <Button 
          onClick={handleAnalyze} 
          disabled={analyzeMutation.isPending}
          className="w-full"
          data-testid="button-analyze"
        >
          {analyzeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Repository...
            </>
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" />
              Analyze Repository
            </>
          )}
        </Button>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            We'll analyze your repository files (package.json, requirements.txt, etc.) to detect tools and estimate costs. No code is stored or transmitted.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    const groupedTools = analysisResult.detectedTools.reduce((groups, tool) => {
      const category = normalizeCategoryForUI(tool.category || 'Frontend');
      if (!groups[category]) groups[category] = [];
      groups[category].push(tool);
      return groups;
    }, {} as Record<string, DetectedTool[]>);

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Analysis Complete</h2>
          <p className="text-muted-foreground">
            Found {analysisResult.summary.totalTools} tools in {analysisResult.analysis.repositoryName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tools Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-tools">
                {analysisResult.summary.totalTools}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estimated Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-estimated-cost">
                ${analysisResult.summary.totalEstimatedCost.toFixed(2)}/month
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Confidence Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-confidence-score">
                {Math.round(analysisResult.summary.confidenceScore * 100)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedTools).map(([category, tools]) => {
            const IconComponent = categoryIcons[category] || Package;
            
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {category}
                    <Badge variant="secondary">{tools.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tools.map((tool) => {
                      const isSelected = selectedTools.has(tool.id);
                      const toolData = tool.tool || tool.suggestedToolRef;
                      
                      return (
                        <div
                          key={tool.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => toggleToolSelection(tool.id, tool)}
                          data-testid={`card-tool-${tool.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Checkbox 
                                  checked={isSelected}
                                  onChange={() => {}}
                                  data-testid={`checkbox-tool-${tool.id}`}
                                />
                                <h4 className="font-medium">
                                  {toolData?.name || tool.name}
                                </h4>
                                <Badge className={getCategoryColor(normalizeCategoryForUI(tool.category))}>
                                  {Math.round(tool.confidenceScore * 100)}%
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3">
                                {toolData?.description || tool.description || "Detected from repository analysis"}
                              </p>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${tool.estimatedMonthlyCost}/month
                                </span>
                                <span className="text-muted-foreground">
                                  {tool.detectionSource.join(", ")}
                                </span>
                              </div>
                              
                              {isSelected && (
                                <div className="mt-3">
                                  <Label htmlFor={`cost-${tool.id}`} className="text-xs">
                                    Adjust Monthly Cost
                                  </Label>
                                  <Input
                                    id={`cost-${tool.id}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedTools.get(tool.id)?.monthlyCost || tool.estimatedMonthlyCost}
                                    onChange={(e) => updateToolCost(tool.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-1"
                                    data-testid={`input-cost-${tool.id}`}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import Summary</CardTitle>
            <CardDescription>
              Review your selection before importing to your tech stack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-lg font-medium">
              <span>Selected Tools:</span>
              <span data-testid="text-selected-count">{selectedTools.size}</span>
            </div>
            <div className="flex justify-between text-lg font-medium">
              <span>Total Monthly Cost:</span>
              <span data-testid="text-total-cost">${calculateTotalCost().toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="import-notes">Notes (Optional)</Label>
              <Textarea
                id="import-notes"
                placeholder="Add any notes about this import..."
                value={importNotes}
                onChange={(e) => setImportNotes(e.target.value)}
                data-testid="textarea-import-notes"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Analysis
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedTools.size === 0 || importMutation.isPending}
                className="flex-1"
                data-testid="button-import"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Import Tools
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" data-testid="link-back-dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {renderStepIndicator()}

      {step === 1 && renderRepositoryInput()}
      {step === 2 && renderAnalysisResults()}
    </div>
  );
}