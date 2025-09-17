import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { WelcomeStep } from "./welcome-step";
import { ProfileSetupStep } from "./profile-setup-step";
import { StackTemplateStep } from "./stack-template-step";
import { InteractiveTour } from "./interactive-tour";
import { StepIndicator } from "./step-indicator";
import { OnboardingProvider, useOnboarding } from "./onboarding-context";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const steps = [
  { id: "welcome", title: "Welcome", description: "Quick Start" },
  { id: "profile", title: "Profile", description: "Context Setup" },
  { id: "stack", title: "Stack", description: "Choose Templates" },
  { id: "tour", title: "Tour", description: "Feature Overview" },
];

function OnboardingContent({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const { currentStep, setCurrentStep, canSkip, handleSkip } = useOnboarding();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={() => setCurrentStep(1)} />;
      case 1:
        return <ProfileSetupStep onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} />;
      case 2:
        return <StackTemplateStep onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />;
      case 3:
        return <InteractiveTour onComplete={onComplete} onBack={() => setCurrentStep(2)} />;
      default:
        return <WelcomeStep onNext={() => setCurrentStep(1)} />;
    }
  };

  const handleSkipOnboarding = async () => {
    await handleSkip();
    onComplete();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="text-onboarding-title">
            Welcome to TechStack Manager
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          {canSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipOnboarding}
              data-testid="button-skip-onboarding"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip Setup
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-onboarding"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderCurrentStep()}
      </div>
    </div>
  );
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] w-[90vw] p-0 gap-0 overflow-hidden" data-testid="dialog-onboarding-modal">
        <OnboardingProvider>
          <OnboardingContent onClose={onClose} onComplete={onComplete} />
        </OnboardingProvider>
      </DialogContent>
    </Dialog>
  );
}