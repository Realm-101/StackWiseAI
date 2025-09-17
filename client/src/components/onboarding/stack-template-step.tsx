import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Check, Layers, DollarSign, Zap, Star } from "lucide-react";
import { useOnboarding } from "./onboarding-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OnboardingStackTemplate } from "@shared/schema";

interface StackTemplateStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function StackTemplateStep({ onNext, onBack }: StackTemplateStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState(false);
  const { toast } = useToast();

  // Fetch available templates
  const { data: templates, isLoading } = useQuery<OnboardingStackTemplate[]>({
    queryKey: ["/api/onboarding/templates"],
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await apiRequest("POST", "/api/onboarding/select-template", {
        templateId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Stack Template Applied!",
        description: data.message,
      });
      onNext();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setCustomStart(false);
  };

  const handleCustomStart = () => {
    setCustomStart(true);
    setSelectedTemplate(null);
  };

  const handleNext = async () => {
    if (selectedTemplate) {
      await applyTemplateMutation.mutateAsync(selectedTemplate);
    } else {
      // Skip template selection
      onNext();
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" data-testid="container-stack-template-step">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/20">
            <Layers className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-stack-template-title">
          Choose Your Starting Point
        </h1>
        <p className="text-gray-600 dark:text-gray-300" data-testid="text-stack-template-description">
          Jump-start your tech stack with pre-configured templates, or start fresh and build your own.
        </p>
      </div>

      {/* Custom Start Option */}
      <Card
        className={`cursor-pointer transition-all ${customStart ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'hover:shadow-md'}`}
        onClick={handleCustomStart}
        data-testid="card-custom-start"
      >
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start from scratch</h3>
              <p className="text-gray-600 dark:text-gray-300">Build your tech stack tool by tool</p>
            </div>
          </div>
          {customStart && (
            <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Templates Grid */}
      {templates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-stack-templates">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                selectedTemplate === template.id 
                  ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/10' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleSelectTemplate(template.id)}
              data-testid={`card-template-${template.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {template.recommended && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full ml-2">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={getComplexityColor(template.complexity)}>
                      {template.complexity} complexity
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${template.estimatedCost}/mo
                    </Badge>
                  </div>

                  {/* Best For */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Best for:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.bestFor.slice(0, 3).map((use, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tools Count */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{template.tools.length} tools included</span>
                    {template.recommended && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>

                  {/* Tools Preview */}
                  {template.tools.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Includes:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.tools.slice(0, 4).map((tool, index) => (
                          <span key={tool.id} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {tool.name}
                          </span>
                        ))}
                        {template.tools.length > 4 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{template.tools.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          data-testid="button-back"
          disabled={applyTemplateMutation.isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={applyTemplateMutation.isPending && selectedTemplate !== null}
          data-testid="button-continue-with-selection"
          className="min-w-[120px]"
        >
          {applyTemplateMutation.isPending ? (
            "Setting up..."
          ) : selectedTemplate || customStart ? (
            <>Continue</>
          ) : (
            "Skip Templates"
          )}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}