import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, BarChart3, DollarSign, Brain, Lightbulb, Zap, CheckCircle } from "lucide-react";
import { useOnboarding } from "./onboarding-context";

interface InteractiveTourProps {
  onComplete: () => void;
  onBack: () => void;
}

const tourSteps = [
  {
    id: "dashboard",
    title: "Your Command Center",
    description: "Monitor your entire tech stack, costs, and key metrics at a glance",
    icon: BarChart3,
    features: [
      "Real-time cost tracking and trends",
      "Tool usage analytics",
      "Quick action buttons",
      "Personalized insights"
    ],
    highlight: "See everything important in one place"
  },
  {
    id: "cost-tracking",
    title: "Smart Cost Management", 
    description: "Never lose track of your tool expenses again",
    icon: DollarSign,
    features: [
      "Automatic cost snapshots",
      "Budget alerts and warnings", 
      "Historical cost trends",
      "ROI analysis per tool"
    ],
    highlight: "Save up to 30% on tool costs"
  },
  {
    id: "stack-intelligence",
    title: "AI-Powered Insights",
    description: "Get intelligent recommendations to optimize your tech stack",
    icon: Brain,
    features: [
      "Identify redundant tools",
      "Find missing stack pieces",
      "Compatibility analysis",
      "Security recommendations"
    ],
    highlight: "AI analyzes 500+ tools to find perfect matches"
  },
  {
    id: "idea-generator",
    title: "Business Idea Lab",
    description: "Generate business ideas based on your selected tools",
    icon: Lightbulb,
    features: [
      "AI-powered idea generation",
      "Monetization strategies",
      "Implementation complexity analysis",
      "Save and organize ideas"
    ],
    highlight: "Turn your tech stack into business opportunities"
  }
];

export function InteractiveTour({ onComplete, onBack }: InteractiveTourProps) {
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const { handleComplete } = useOnboarding();

  const currentStep = tourSteps[currentTourStep];
  const isLastStep = currentTourStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentTourStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleFinish = async () => {
    await handleComplete();
    onComplete();
  };

  const handleSkipTour = async () => {
    await handleComplete();
    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-testid="container-interactive-tour">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-100 rounded-full dark:bg-indigo-900/20">
            <Zap className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-tour-title">
          Discover TechStack Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-300" data-testid="text-tour-description">
          Take a quick tour to see how TechStack Manager can help you build better, faster, and smarter.
        </p>
      </div>

      {/* Tour Progress */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {tourSteps.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-8 rounded-full transition-all ${
              index === currentTourStep 
                ? 'bg-indigo-600' 
                : index < currentTourStep 
                ? 'bg-indigo-300' 
                : 'bg-gray-300'
            }`}
            data-testid={`tour-progress-${index}`}
          />
        ))}
      </div>

      {/* Current Step Content */}
      <Card className="relative overflow-hidden" data-testid={`tour-step-${currentStep.id}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-lg dark:bg-indigo-900/20">
              <currentStep.icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-gray-900 dark:text-white">
                {currentStep.title}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                {currentStep.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Highlight Badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 text-sm px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              {currentStep.highlight}
            </Badge>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentStep.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                data-testid={`feature-${index}`}
              >
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          {/* Demo Placeholder */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-8 text-center border-2 border-dashed border-indigo-200 dark:border-indigo-700">
            <div className="space-y-2">
              <currentStep.icon className="h-12 w-12 text-indigo-400 mx-auto" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                {currentStep.title} Preview
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Interactive demo will be shown here in the actual application
              </p>
            </div>
          </div>

          {/* Step Counter */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentTourStep + 1} of {tourSteps.length}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          data-testid="button-tour-previous"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentTourStep === 0 ? "Back to Templates" : "Previous"}
        </Button>
        
        <div className="space-x-3">
          <Button
            variant="ghost"
            onClick={handleSkipTour}
            data-testid="button-skip-tour"
          >
            Skip Tour
          </Button>
          <Button
            onClick={handleNext}
            data-testid="button-tour-next"
            className="min-w-[120px]"
          >
            {isLastStep ? (
              <>
                Start Using App
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}