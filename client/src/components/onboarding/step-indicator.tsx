import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full" data-testid="container-step-indicator">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors",
                  index < currentStep
                    ? "bg-blue-600 border-blue-600 text-white"
                    : index === currentStep
                    ? "bg-blue-100 border-blue-600 text-blue-600 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-400"
                    : "bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500"
                )}
                data-testid={`step-circle-${index}`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
            </div>

            {/* Step Content */}
            <div className="ml-3 flex-1">
              <div
                className={cn(
                  "text-sm font-medium transition-colors",
                  index <= currentStep
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                )}
                data-testid={`step-title-${index}`}
              >
                {step.title}
              </div>
              <div
                className={cn(
                  "text-xs transition-colors",
                  index <= currentStep
                    ? "text-gray-600 dark:text-gray-300"
                    : "text-gray-400 dark:text-gray-500"
                )}
                data-testid={`step-description-${index}`}
              >
                {step.description}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    "h-0.5 transition-colors",
                    index < currentStep
                      ? "bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          data-testid="progress-bar-fill"
        />
      </div>
    </div>
  );
}