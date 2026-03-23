//Library
import { Check } from "lucide-react";
//Own Components
import { STEPS } from "@/src/constants";

export const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {STEPS.map((step, i) => {
      const done = current > step.id;
      const active = current === step.id;
      const Icon = step.icon;

      return (
        <div key={step.id} className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
              done
                ? "border-primary bg-primary"
                : active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
            }`}
          >
            {done ? (
              <Check className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Icon
                className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
              />
            )}
          </div>

          <span
            className={`hidden text-xs font-medium sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}
          >
            {step.label}
          </span>

          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-6 transition-colors ${done ? "bg-primary" : "bg-border"}`}
            />
          )}
        </div>
      );
    })}
  </div>
);
