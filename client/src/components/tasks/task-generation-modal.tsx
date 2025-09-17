import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Target, 
  Users, 
  DollarSign,
  Settings,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SavedIdea, GeneratedTasksResponse, TaskGenerationParameters } from "@shared/schema";

interface TaskGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: SavedIdea;
  onTasksGenerated: (tasks: GeneratedTasksResponse) => void;
}

const timeframeOptions = [
  { value: "1-3 months", label: "1-3 months (MVP Focus)" },
  { value: "3-6 months", label: "3-6 months (Balanced)" },
  { value: "6-12 months", label: "6-12 months (Full Featured)" },
  { value: "12+ months", label: "12+ months (Enterprise)" }
];

const focusAreaOptions = [
  { value: "mvp", label: "MVP Development", description: "Minimal viable product focused on core features" },
  { value: "full_featured", label: "Full Featured", description: "Complete product with all planned features" },
  { value: "scalable", label: "Scalable Architecture", description: "Focus on scalability and performance" },
  { value: "cost_optimized", label: "Cost Optimized", description: "Minimize development and operational costs" }
];

const complexityOptions = [
  { value: "simple", label: "Simple", description: "Basic implementation with essential features" },
  { value: "moderate", label: "Moderate", description: "Balanced approach with good practices" },
  { value: "comprehensive", label: "Comprehensive", description: "Full enterprise-grade implementation" }
];

export function TaskGenerationModal({ isOpen, onClose, idea, onTasksGenerated }: TaskGenerationModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [parameters, setParameters] = useState<TaskGenerationParameters>({
    targetTimeframe: "3-6 months",
    focusAreas: ["mvp"],
    includeDevOps: true,
    includeTesting: true,
    includeDocumentation: true,
    complexityLevel: "moderate"
  });

  const { data: userContext } = useQuery({
    queryKey: ["/api/ai/context"]
  });

  const generateTasksMutation = useMutation({
    mutationFn: async (generationParams: { ideaId: string; generationParameters: TaskGenerationParameters }) => {
      const response = await apiRequest("POST", `/api/ideas/${generationParams.ideaId}/generate-tasks`, {
        ideaId: generationParams.ideaId,
        generationParameters: generationParams.generationParameters
      });
      return await response.json();
    },
    onSuccess: (data: GeneratedTasksResponse) => {
      toast({
        title: "Tasks Generated Successfully!",
        description: `Generated ${data.tasks.length} tasks for your project`,
      });
      onTasksGenerated(data);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/task-generations"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Task Generation Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
      console.error("Task generation error:", error);
    },
  });

  const steps = [
    {
      id: "overview",
      title: "Project Overview",
      description: "Review your business idea details"
    },
    {
      id: "parameters",
      title: "Generation Parameters",
      description: "Configure task generation settings"
    },
    {
      id: "confirmation",
      title: "Confirmation",
      description: "Review and confirm generation"
    },
    {
      id: "generating",
      title: "Generating Tasks",
      description: "AI is creating your project tasks"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = () => {
    setCurrentStep(3); // Go to generating step
    generateTasksMutation.mutate({
      ideaId: idea.id,
      generationParameters: parameters
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Lightbulb className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-idea-title">
                {idea.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4" data-testid="text-idea-description">
                {idea.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Target Audience</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {idea.targetAudience || "Not specified"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Monetization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {idea.monetization || "Not specified"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Complexity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={idea.implementationComplexity === "high" ? "destructive" : 
                    idea.implementationComplexity === "medium" ? "default" : "secondary"}>
                    {idea.implementationComplexity || "Medium"}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Estimated Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ${idea.estimatedCost || "Not specified"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {idea.tags && idea.tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">Project Timeline</Label>
              <Select 
                value={parameters.targetTimeframe} 
                onValueChange={(value) => setParameters(prev => ({ ...prev, targetTimeframe: value as any }))}
              >
                <SelectTrigger data-testid="select-timeframe">
                  <SelectValue placeholder="Select target timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">Focus Areas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {focusAreaOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={option.value}
                      checked={parameters.focusAreas?.includes(option.value as any)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setParameters(prev => ({
                            ...prev,
                            focusAreas: [...(prev.focusAreas || []), option.value as any]
                          }));
                        } else {
                          setParameters(prev => ({
                            ...prev,
                            focusAreas: prev.focusAreas?.filter(area => area !== option.value)
                          }));
                        }
                      }}
                      data-testid={`checkbox-focus-${option.value}`}
                    />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">Implementation Complexity</Label>
              <Select 
                value={parameters.complexityLevel} 
                onValueChange={(value) => setParameters(prev => ({ ...prev, complexityLevel: value as any }))}
              >
                <SelectTrigger data-testid="select-complexity">
                  <SelectValue placeholder="Select complexity level" />
                </SelectTrigger>
                <SelectContent>
                  {complexityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium mb-4 block">Additional Components</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="include-devops"
                    checked={parameters.includeDevOps}
                    onCheckedChange={(checked) => setParameters(prev => ({ ...prev, includeDevOps: !!checked }))}
                    data-testid="checkbox-include-devops"
                  />
                  <Label htmlFor="include-devops" className="cursor-pointer">
                    Include DevOps & Deployment tasks
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="include-testing"
                    checked={parameters.includeTesting}
                    onCheckedChange={(checked) => setParameters(prev => ({ ...prev, includeTesting: !!checked }))}
                    data-testid="checkbox-include-testing"
                  />
                  <Label htmlFor="include-testing" className="cursor-pointer">
                    Include Testing & QA tasks
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="include-documentation"
                    checked={parameters.includeDocumentation}
                    onCheckedChange={(checked) => setParameters(prev => ({ ...prev, includeDocumentation: !!checked }))}
                    data-testid="checkbox-include-documentation"
                  />
                  <Label htmlFor="include-documentation" className="cursor-pointer">
                    Include Documentation tasks
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Generate Tasks</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Review your configuration and generate project tasks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{parameters.targetTimeframe}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Complexity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">{parameters.complexityLevel}</Badge>
                </CardContent>
              </Card>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Focus Areas</Label>
              <div className="flex flex-wrap gap-2">
                {parameters.focusAreas?.map((area) => (
                  <Badge key={area} variant="secondary">
                    {focusAreaOptions.find(opt => opt.value === area)?.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Additional Components</Label>
              <div className="flex flex-wrap gap-2">
                {parameters.includeDevOps && <Badge variant="outline">DevOps</Badge>}
                {parameters.includeTesting && <Badge variant="outline">Testing</Badge>}
                {parameters.includeDocumentation && <Badge variant="outline">Documentation</Badge>}
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                The AI will generate 15-25 detailed tasks based on your configuration and current tech stack.
                This may take 30-60 seconds to complete.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <div>
              <Wand2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Generating Your Project Tasks</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our AI is analyzing your business idea and creating detailed project tasks...
              </p>
              
              <Progress value={generateTasksMutation.isLoading ? 50 : 100} className="w-full mb-4" />
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>✓ Analyzing business requirements</p>
                <p>✓ Reviewing your tech stack</p>
                <p className={generateTasksMutation.isLoading ? "text-blue-500" : "text-green-500"}>
                  {generateTasksMutation.isLoading ? "→ Generating tasks..." : "✓ Tasks generated successfully!"}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return parameters.focusAreas && parameters.focusAreas.length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-task-generation">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-semibold">
            Generate Project Tasks
          </DialogTitle>
          
          {/* Step indicator */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`w-16 h-1 mx-2 ${
                      index < currentStep ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-2">
            <h4 className="font-medium">{steps[currentStep].title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{steps[currentStep].description}</p>
          </div>
        </DialogHeader>

        <div className="py-6">
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || generateTasksMutation.isLoading}
            data-testid="button-back"
          >
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={generateTasksMutation.isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>

            {currentStep < 2 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                data-testid="button-next"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : currentStep === 2 ? (
              <Button
                onClick={handleGenerate}
                disabled={!canProceed() || generateTasksMutation.isLoading}
                data-testid="button-generate"
              >
                {generateTasksMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Tasks
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}