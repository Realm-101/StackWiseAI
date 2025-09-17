import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OnboardingProfile, OnboardingStatus } from "@shared/schema";

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onboardingStatus: OnboardingStatus | null;
  canSkip: boolean;
  isLoading: boolean;
  profileData: Partial<OnboardingProfile>;
  setProfileData: (data: Partial<OnboardingProfile>) => void;
  updateProfile: (data: OnboardingProfile) => Promise<void>;
  updateStatus: (step: number) => Promise<void>;
  handleSkip: () => Promise<void>;
  handleComplete: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<Partial<OnboardingProfile>>({});
  const { toast } = useToast();

  // Fetch onboarding status
  const { data: onboardingStatus, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
  });

  // Update profile mutation
  const profileMutation = useMutation({
    mutationFn: async (data: OnboardingProfile) => {
      const res = await apiRequest("POST", "/api/onboarding/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: async (step: number) => {
      const res = await apiRequest("POST", "/api/onboarding/status", {
        onboardingStatus: "in_progress",
        onboardingStep: step,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
    },
  });

  // Skip onboarding mutation
  const skipMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/skip");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Onboarding Skipped",
        description: "You can restart the setup tour anytime from your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete onboarding mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/complete");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to TechStack Manager!",
        description: "Setup completed successfully. Let's build something amazing!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfile = async (data: OnboardingProfile) => {
    setProfileData(data);
    await profileMutation.mutateAsync(data);
  };

  const updateStatus = async (step: number) => {
    await statusMutation.mutateAsync(step);
  };

  const handleSkip = async () => {
    await skipMutation.mutateAsync();
  };

  const handleComplete = async () => {
    await completeMutation.mutateAsync();
  };

  // Initialize current step from onboarding status
  useEffect(() => {
    if (onboardingStatus?.step !== undefined) {
      setCurrentStep(onboardingStatus.step);
    }
  }, [onboardingStatus]);

  const value: OnboardingContextType = {
    currentStep,
    setCurrentStep: (step: number) => {
      setCurrentStep(step);
      updateStatus(step);
    },
    onboardingStatus,
    canSkip: currentStep > 0, // Allow skip after first step
    isLoading,
    profileData,
    setProfileData,
    updateProfile,
    updateStatus,
    handleSkip,
    handleComplete,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}