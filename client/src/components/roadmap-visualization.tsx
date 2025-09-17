import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { Calendar, Clock, DollarSign, Target, ArrowRight, CheckCircle, AlertTriangle, Users, Loader2, TrendingUp, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserToolWithTool } from "@shared/schema";

interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  technologies: string[];
  dependencies: string[];
  outcomes: string[];
  risks: string[];
  milestones: string[];
}

interface TechRoadmap {
  title: string;
  description: string;
  totalDuration: string;
  totalCost: number;
  phases: RoadmapPhase[];
  recommendations: string[];
  riskAssessment: {
    technical: string;
    business: string;
    timeline: string;
  };
  teamRequirements: {
    size: string;
    skills: string[];
    timeAllocation: string;
  };
}

interface RoadmapVisualizationProps {
  userTools: UserToolWithTool[];
}

export default function RoadmapVisualization({ userTools }: RoadmapVisualizationProps) {
  const { toast } = useToast();
  const [currentStack, setCurrentStack] = useState<string[]>([]);
  const [targetGoals, setTargetGoals] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<string>("");
  const [goalInput, setGoalInput] = useState("");
  const [generatedRoadmap, setGeneratedRoadmap] = useState<TechRoadmap | null>(null);

  const generateRoadmapMutation = useMutation({
    mutationFn: async ({
      currentStack,
      targetGoals,
      timeframe,
    }: {
      currentStack: string[];
      targetGoals: string[];
      timeframe?: string;
    }) => {
      const response = await apiRequest("POST", "/api/ai/roadmap/generate", {
        currentStack,
        targetGoals,
        timeframe,
      });
      return await response.json();
    },
    onSuccess: (roadmap: TechRoadmap) => {
      setGeneratedRoadmap(roadmap);
      toast({
        title: "Roadmap generated",
        description: "Your technology roadmap has been created successfully.",
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

  const handleStackToggle = (toolName: string) => {
    setCurrentStack(prev =>
      prev.includes(toolName)
        ? prev.filter(name => name !== toolName)
        : [...prev, toolName]
    );
  };

  const handleAddGoal = () => {
    if (goalInput.trim()) {
      setTargetGoals(prev => [...prev, goalInput.trim()]);
      setGoalInput("");
    }
  };

  const handleRemoveGoal = (goal: string) => {
    setTargetGoals(prev => prev.filter(g => g !== goal));
  };

  const handleGenerateRoadmap = () => {
    if (currentStack.length === 0) {
      toast({
        title: "No current stack selected",
        description: "Please select your current technologies.",
        variant: "destructive",
      });
      return;
    }

    if (targetGoals.length === 0) {
      toast({
        title: "No target goals specified",
        description: "Please add at least one target goal.",
        variant: "destructive",
      });
      return;
    }

    generateRoadmapMutation.mutate({
      currentStack,
      targetGoals,
      timeframe: timeframe || undefined,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-950';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default: return 'border-l-green-500 bg-green-50 dark:bg-green-950';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'default' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <div className="space-y-8">
      {/* Roadmap Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Generate Technology Roadmap
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create an intelligent development roadmap based on your current stack and target goals.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Stack Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Current Technology Stack
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {userTools.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center space-x-2 rounded-lg px-3 py-2 cursor-pointer transition-colors border ${
                    currentStack.includes(item.tool.name)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted border-muted hover:bg-muted/80'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={currentStack.includes(item.tool.name)}
                    onChange={() => handleStackToggle(item.tool.name)}
                    data-testid={`checkbox-roadmap-stack-${item.tool.id}`}
                  />
                  <span className="text-sm font-medium">{item.tool.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Goals */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Target Goals & Objectives
            </Label>
            <div className="flex space-x-2 mb-3">
              <Textarea
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="e.g., Build a mobile app, Add real-time features, Implement AI capabilities..."
                rows={2}
                className="flex-1"
                data-testid="textarea-roadmap-goal"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddGoal();
                  }
                }}
              />
              <Button 
                onClick={handleAddGoal} 
                disabled={!goalInput.trim()}
                data-testid="button-add-goal"
              >
                Add Goal
              </Button>
            </div>
            {targetGoals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {targetGoals.map((goal, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleRemoveGoal(goal)}
                    data-testid={`badge-goal-${index}`}
                  >
                    {goal} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe */}
          <div>
            <Label className="text-base font-medium mb-2 block">
              Target Timeframe (Optional)
            </Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger data-testid="select-roadmap-timeframe">
                <SelectValue placeholder="Select target timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 months</SelectItem>
                <SelectItem value="6months">6 months</SelectItem>
                <SelectItem value="1year">1 year</SelectItem>
                <SelectItem value="2years">2 years</SelectItem>
                <SelectItem value="flexible">Flexible timeline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateRoadmap}
            disabled={generateRoadmapMutation.isPending || currentStack.length === 0 || targetGoals.length === 0}
            className="w-full"
            data-testid="button-generate-roadmap"
          >
            {generateRoadmapMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Generate Roadmap
          </Button>
        </CardContent>
      </Card>

      {/* Generated Roadmap */}
      {generatedRoadmap && (
        <div className="space-y-8">
          {/* Roadmap Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                {generatedRoadmap.title}
              </CardTitle>
              <p className="text-muted-foreground">{generatedRoadmap.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-primary mr-2" />
                    <span className="text-2xl font-bold text-primary">
                      {generatedRoadmap.totalDuration}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Total Duration</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-primary mr-2" />
                    <span className="text-2xl font-bold text-primary">
                      ${generatedRoadmap.totalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Estimated Cost</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Building2 className="h-5 w-5 text-primary mr-2" />
                    <span className="text-2xl font-bold text-primary">
                      {generatedRoadmap.phases.length}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Phases</div>
                </div>
              </div>

              {/* Team Requirements */}
              {generatedRoadmap.teamRequirements && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Team Requirements
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Team Size:</span> {generatedRoadmap.teamRequirements.size}
                    </div>
                    <div>
                      <span className="font-medium">Time Allocation:</span> {generatedRoadmap.teamRequirements.timeAllocation}
                    </div>
                    <div>
                      <span className="font-medium">Key Skills:</span> {generatedRoadmap.teamRequirements.skills.slice(0, 2).join(", ")}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roadmap Phases */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-6">Implementation Phases</h3>
            <div className="space-y-6">
              {generatedRoadmap.phases.map((phase, index) => (
                <Card key={phase.id} className={`border-l-4 ${getPriorityColor(phase.priority)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground" data-testid={`text-phase-title-${index}`}>
                            {phase.name}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <Badge variant={getPriorityBadgeVariant(phase.priority)}>
                              {phase.priority} priority
                            </Badge>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {phase.duration}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${phase.estimatedCost.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{phase.description}</p>
                    
                    {/* Technologies */}
                    {phase.technologies.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-sm mb-2">Technologies & Tools:</h5>
                        <div className="flex flex-wrap gap-2">
                          {phase.technologies.map((tech, techIndex) => (
                            <Badge key={techIndex} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Key Outcomes */}
                    {phase.outcomes.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-sm mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          Key Outcomes:
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {phase.outcomes.map((outcome, outcomeIndex) => (
                            <li key={outcomeIndex} className="flex items-start">
                              <CheckCircle className="h-3 w-3 mr-2 mt-1 text-green-500 flex-shrink-0" />
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Dependencies & Risks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {phase.dependencies.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2 flex items-center">
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Dependencies:
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {phase.dependencies.join(", ")}
                          </p>
                        </div>
                      )}
                      {phase.risks.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
                            Risks:
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {phase.risks.slice(0, 2).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Milestones */}
                    {phase.milestones.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="font-medium text-sm mb-2">Milestones:</h5>
                        <div className="space-y-1">
                          {phase.milestones.map((milestone, milestoneIndex) => (
                            <div key={milestoneIndex} className="flex items-center text-sm text-muted-foreground">
                              <Target className="h-3 w-3 mr-2 text-primary flex-shrink-0" />
                              {milestone}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          {generatedRoadmap.riskAssessment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h5 className="font-medium mb-2">Technical Risk:</h5>
                    <p className="text-sm text-muted-foreground">
                      {generatedRoadmap.riskAssessment.technical}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Business Risk:</h5>
                    <p className="text-sm text-muted-foreground">
                      {generatedRoadmap.riskAssessment.business}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Timeline Risk:</h5>
                    <p className="text-sm text-muted-foreground">
                      {generatedRoadmap.riskAssessment.timeline}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {generatedRoadmap.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Key Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {generatedRoadmap.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-3 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}