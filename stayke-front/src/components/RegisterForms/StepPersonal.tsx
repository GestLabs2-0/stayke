"use client";

//Library
import { Upload } from "lucide-react";
//React
import { useState } from "react";
//Next
import Image from "next/image";
//Own components
import { Field } from "../shared/FieldInput/Field";
//Type
import type { RegisterFormData } from "@/src/types/RegisterFormData";

interface Props {
  form: RegisterFormData;
  onChange: (
    field: keyof RegisterFormData,
    value: string
  ) => void;
}

export const StepPersonal = ({ form, onChange }: Props) => {
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <label className="relative h-24 w-24 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors">
          {form.image ? (
            <Image
              src={form.image}
              alt="Profile Preview"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />
        </label>
        <p className="text-xs text-muted-foreground">Click to upload or drag profile picture</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="First Name"
          value={form.firstName}
          onChange={(v) => onChange("firstName", v)}
          placeholder="John"
        />
        <Field
          label="Last Name"
          value={form.lastName}
          onChange={(v) => onChange("lastName", v)}
          placeholder="Doe"
        />
      </div>

      <Field
        label="DNI / ID Number"
        value={form.dni}
        onChange={(v) => onChange("dni", v)}
        placeholder="12345678"
      />
    </div>
  );
};
