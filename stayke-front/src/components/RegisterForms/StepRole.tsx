//Library
import { Check, Home } from "lucide-react";
//Types
import { RegisterFormData } from "@/src/types/RegisterFormData";

export const StepRole = ({
  form,
  onChange,
}: {
  form: RegisterFormData;
  onChange: (field: keyof RegisterFormData, value: boolean) => void;
}) => (
  <div className="flex flex-col gap-6">
    {/* Pregunta */}
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-solana shadow-glow">
        <Home className="h-7 w-7 text-primary-foreground" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">
        Do you want to be a Host?
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
        Hosts can list and manage properties, earning staking rewards from every
        booking.
      </p>
    </div>

    {/* Toggle */}
    <div className="flex flex-col gap-3">
      {/* Yes */}
      <button
        onClick={() => onChange("isHost", true)}
        className={`flex items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all ${
          form.isHost
            ? "border-primary bg-primary/5 shadow-glow"
            : "border-border bg-background hover:border-primary/50"
        }`}
      >
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            form.isHost
              ? "border-primary bg-primary"
              : "border-muted-foreground"
          }`}
        >
          {form.isHost && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Yes, I want to be a Host
          </p>
          <p className="text-xs text-muted-foreground">
            List properties and earn staking rewards
          </p>
        </div>
      </button>

      {/* No */}
      <button
        onClick={() => onChange("isHost", false)}
        className={`flex items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all ${
          !form.isHost
            ? "border-primary bg-primary/5 shadow-glow"
            : "border-border bg-background hover:border-primary/50"
        }`}
      >
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            !form.isHost
              ? "border-primary bg-primary"
              : "border-muted-foreground"
          }`}
        >
          {!form.isHost && (
            <Check className="h-3 w-3 text-primary-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            No, I just want to book stays
          </p>
          <p className="text-xs text-muted-foreground">
            Browse and book properties worldwide
          </p>
        </div>
      </button>
    </div>
  </div>
);
