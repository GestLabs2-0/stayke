"use client";

//Library
import { useWalletConnection } from "@solana/react-hooks";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
//Next
import Link from "next/link";
import { useRouter } from "next/navigation";

//React
import { useState } from "react";
//Own Components
import { StepIndicator } from "@/src/components/RegisterForms/StepIndicator";
import { STEP_COMPONENTS } from "@/src/components/RegisterForms/StepRenderer";
import { useAuth } from "@/src/Context/AuthContext";
import { STEPS } from "@/src/constants";
import { handleApiError } from "@/src/helpers/apiError";

//Type
import type { RegisterFormData } from "@/src/types/RegisterFormData";

const INITIAL_FORM: RegisterFormData = {
  dni: "",
  wallet: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  image: null,
  isHost: false,
};

export const Register = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegisterFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const { wallet } = useWalletConnection();
  const { registerUser } = useAuth();
  const router = useRouter();
  const totalSteps = STEPS.length;

  const onChange = (field: keyof RegisterFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) setStep((s) => s + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload = {
      ...form,
      wallet: wallet?.account?.address?.toString() ?? "",
      roles: form.isHost ? ["host", "client"] : ["client"],
    };

    console.log("Submit payload:", payload);

    try {
      // mockRegister guarda el user en AuthContext y devuelve success: true
      // TODO: cuando tengas backend, mockRegister hace fetch a /api/auth/register
      const { success } = await registerUser(payload);

      if (success) {
        router.push("/"); // → home con UserMenu ya visible
      } else {
        setSubmitting(false);
      }
    } catch (error) {
      handleApiError(error, "Register");
      setSubmitting(false);
    }
  };

  const renderStep = STEP_COMPONENTS[step];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <span className="font-display text-2xl font-bold text-foreground">
              Stay<span className="text-gradient">ke</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <StepIndicator current={step} />

          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-foreground">
              {STEPS[step - 1].label}
            </h2>
            <p className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </p>
          </div>

          <div className="min-h-60">{renderStep({ form, onChange })}</div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              disabled={step === 1 || submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 gradient-solana rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 gradient-solana rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Account
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
