import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { OnboardingModal } from "@/components/onboarding";
import type { OnboardingStatus } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  // Fetch onboarding status for authenticated users
  const { data: onboardingStatus, isLoading: onboardingLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Auto-open onboarding modal when conditions are met (moved to useEffect to avoid render loops)
  // IMPORTANT: This useEffect must be called on every render to maintain hook order
  useEffect(() => {
    // Only proceed if user is authenticated and onboarding data is available
    if (!user || !onboardingStatus) return;

    const shouldShowOnboarding = onboardingStatus.status !== "completed" && 
      onboardingStatus.status !== "skipped" &&
      !dismissedThisSession;

    if (shouldShowOnboarding && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [user, onboardingStatus, showOnboarding, dismissedThisSession]);

  const isLoading = authLoading || (user && onboardingLoading);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen" data-testid="loading-protected-route">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setDismissedThisSession(false); // Reset session flag on completion
    // Refresh onboarding status after completion
    // This will automatically update due to React Query invalidation in the onboarding flow
  };

  const handleOnboardingClose = () => {
    // Allow closing onboarding modal (they can restart later from profile)
    setShowOnboarding(false);
    setDismissedThisSession(true); // Prevent reopening this session
  };

  return (
    <Route path={path}>
      <>
        <Component />
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={handleOnboardingClose}
            onComplete={handleOnboardingComplete}
            data-testid="modal-onboarding"
          />
        )}
      </>
    </Route>
  );
}
