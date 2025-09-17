import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useOnboarding } from "./onboarding-context";

interface ProfileSetupStepProps {
  onNext: () => void;
  onBack: () => void;
}

const industries = [
  { value: "fintech", label: "Fintech & Banking" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "ecommerce", label: "E-commerce & Retail" },
  { value: "saas", label: "SaaS & B2B Software" },
  { value: "edtech", label: "Education & E-learning" },
  { value: "gaming", label: "Gaming & Entertainment" },
  { value: "media", label: "Media & Content" },
  { value: "logistics", label: "Logistics & Transportation" },
  { value: "real_estate", label: "Real Estate & PropTech" },
  { value: "other", label: "Other" },
];

const primaryGoals = [
  { id: "build_mvp", label: "Build MVP quickly", description: "Get to market fast with essential tools" },
  { id: "scale_product", label: "Scale existing product", description: "Handle growth and increased demand" },
  { id: "reduce_costs", label: "Optimize costs", description: "Find better pricing and eliminate redundancy" },
  { id: "improve_security", label: "Enhance security", description: "Strengthen data protection and compliance" },
  { id: "team_collaboration", label: "Improve team workflow", description: "Better collaboration and productivity tools" },
  { id: "automation", label: "Automate processes", description: "Reduce manual work and increase efficiency" },
];

export function ProfileSetupStep({ onNext, onBack }: ProfileSetupStepProps) {
  const { profileData, setProfileData, updateProfile } = useOnboarding();
  const [industry, setIndustry] = useState(profileData.industry || "");
  const [technicalLevel, setTechnicalLevel] = useState(profileData.technicalLevel || "");
  const [selectedGoals, setSelectedGoals] = useState<string[]>(profileData.primaryGoals || []);
  const [companyStage, setCompanyStage] = useState(profileData.companyStage || "");
  const [preferredApproach, setPreferredApproach] = useState(profileData.preferredApproach || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = async () => {
    const profileUpdate = {
      ...profileData,
      industry,
      technicalLevel: technicalLevel as any,
      primaryGoals: selectedGoals,
      companyStage: companyStage as any,
      preferredApproach: preferredApproach as any,
    };

    setIsLoading(true);
    try {
      await updateProfile(profileUpdate);
      onNext();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Save minimal profile data
    setProfileData({
      ...profileData,
      industry: industry || "other",
      technicalLevel: technicalLevel as any || "intermediate",
      primaryGoals: selectedGoals.length > 0 ? selectedGoals : ["build_mvp"],
    });
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6" data-testid="container-profile-setup-step">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900/20">
            <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-profile-setup-title">
          Let's Personalize Your Experience
        </h1>
        <p className="text-gray-600 dark:text-gray-300" data-testid="text-profile-setup-description">
          This information helps us provide better tool recommendations and insights tailored to your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About Your Work</CardTitle>
            <CardDescription>Help us understand your context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger data-testid="select-industry">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical-level">Technical Expertise</Label>
              <Select value={technicalLevel} onValueChange={setTechnicalLevel}>
                <SelectTrigger data-testid="select-technical-level">
                  <SelectValue placeholder="How would you rate your technical skills?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - New to development</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                  <SelectItem value="expert">Expert - Highly experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-stage">Company Stage</Label>
              <Select value={companyStage} onValueChange={setCompanyStage}>
                <SelectTrigger data-testid="select-company-stage">
                  <SelectValue placeholder="What stage is your company/project?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea Stage - Just getting started</SelectItem>
                  <SelectItem value="startup">Startup - Early stage with some users</SelectItem>
                  <SelectItem value="growth">Growth - Scaling up operations</SelectItem>
                  <SelectItem value="mature">Mature - Established business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred-approach">Technology Approach</Label>
              <Select value={preferredApproach} onValueChange={setPreferredApproach}>
                <SelectTrigger data-testid="select-preferred-approach">
                  <SelectValue placeholder="What's your preferred approach?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cutting_edge">Cutting-edge - Latest technologies</SelectItem>
                  <SelectItem value="proven_stable">Proven & Stable - Battle-tested solutions</SelectItem>
                  <SelectItem value="budget_conscious">Budget Conscious - Cost-effective options</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Primary Goals</CardTitle>
            <CardDescription>What do you want to achieve? (Select all that apply)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="container-primary-goals">
              {primaryGoals.map((goal) => (
                <div key={goal.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Checkbox
                    id={goal.id}
                    checked={selectedGoals.includes(goal.id)}
                    onCheckedChange={() => handleGoalToggle(goal.id)}
                    data-testid={`checkbox-goal-${goal.id}`}
                  />
                  <div className="flex-1">
                    <Label htmlFor={goal.id} className="font-medium text-sm cursor-pointer">
                      {goal.label}
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {goal.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="space-x-3">
          <Button
            variant="ghost"
            onClick={handleSkip}
            data-testid="button-skip-profile"
            disabled={isLoading}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleNext}
            disabled={isLoading}
            data-testid="button-save-profile"
            className="min-w-[120px]"
          >
            {isLoading ? "Saving..." : "Save & Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}