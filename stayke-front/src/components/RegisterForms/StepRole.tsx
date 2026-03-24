//Library
import { Check, Home, Upload } from "lucide-react";
//Next
import Image from "next/image";
//Types
import { RegisterFormData } from "@/src/types/RegisterFormData";

export const StepRole = ({
  form,
  onChange,
}: {
  form: RegisterFormData;
  onChange: (field: keyof RegisterFormData, value: any) => void;
}) => {
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange("image", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
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

      {/* Profile Image Section */}
      <div className="border-t border-border pt-6 flex flex-col items-center gap-4">
        <p className="text-sm font-semibold text-foreground">Confirm your Profile Picture</p>
        <label className="relative h-20 w-20 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors">
          {form.image ? (
            <Image
              src={form.image}
              alt="Profile"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          {form.image ? "Click to change" : "Click to upload profile picture"}
        </p>
      </div>
    </div>
  );
};
