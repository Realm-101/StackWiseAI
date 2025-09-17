import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Users, DollarSign, ArrowRight } from "lucide-react";
import { useOnboarding } from "./onboarding-context";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { profileData, setProfileData } = useOnboarding();
  const [projectType, setProjectType] = useState(profileData.projectType || "");
  const [teamSize, setTeamSize] = useState(profileData.teamSize || "");
  const [monthlyBudget, setMonthlyBudget] = useState(profileData.monthlyBudget?.toString() || "");

  const handleNext = () => {
    setProfileData({
      ...profileData,
      projectType: projectType as any,
      teamSize: teamSize as any,
      monthlyBudget: monthlyBudget || null,
    });
    onNext();
  };

  const canProceed = projectType && teamSize;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-testid="container-welcome-step">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900/20">
            <Rocket className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-welcome-title">
          Welcome to TechStack Manager!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300" data-testid="text-welcome-description">
          Your smart companion for building, tracking, and optimizing your technology stack. 
          Let's get you set up in just a few steps.
        </p>
      </div>

      {/* Value Propositions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <CardContent className="pt-2">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Track Costs</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Monitor tool expenses and optimize your budget</p>
          </CardContent>
        </Card>
        <Card className="text-center p-4">
          <CardContent className="pt-2">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Team Ready</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Perfect for solo developers to enterprise teams</p>
          </CardContent>
        </Card>
        <Card className="text-center p-4">
          <CardContent className="pt-2">
            <Rocket className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">AI Powered</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Smart recommendations and insights</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" data-testid="text-quick-setup-title">Quick Setup (30 seconds)</CardTitle>
          <CardDescription>
            Tell us a bit about your project so we can personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="project-type">What are you building?</Label>
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger data-testid="select-project-type">
                <SelectValue placeholder="Select your project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">SaaS Application</SelectItem>
                <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                <SelectItem value="api">API & Backend Services</SelectItem>
                <SelectItem value="mobile_app">Mobile App</SelectItem>
                <SelectItem value="website">Website/Portfolio</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Size */}
          <div className="space-y-2">
            <Label htmlFor="team-size">What's your team size?</Label>
            <Select value={teamSize} onValueChange={setTeamSize}>
              <SelectTrigger data-testid="select-team-size">
                <SelectValue placeholder="Select your team size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Just me (Solo)</SelectItem>
                <SelectItem value="small">Small Team (2-5 people)</SelectItem>
                <SelectItem value="medium">Medium Team (6-20 people)</SelectItem>
                <SelectItem value="large">Large Team (21-100 people)</SelectItem>
                <SelectItem value="enterprise">Enterprise (100+ people)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Budget */}
          <div className="space-y-2">
            <Label htmlFor="monthly-budget">Monthly tool budget (optional)</Label>
            <Input
              id="monthly-budget"
              type="number"
              placeholder="e.g., 500"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              data-testid="input-monthly-budget"
              className="appearance-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This helps us recommend tools within your budget range.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleNext}
              disabled={!canProceed}
              data-testid="button-continue-setup"
              className="min-w-[120px]"
            >
              Continue Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}