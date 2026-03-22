//Own components
import { Field } from "../shared/FieldInput/Field";
//Type
import { RegisterFormData } from "@/src/types/RegisterFormData";

export const StepContact = ({
  form,
  onChange,
}: {
  form: RegisterFormData;
  onChange: (field: keyof RegisterFormData, value: string) => void;
}) => (
  <div className="flex flex-col gap-4">
    <Field
      label="Email"
      type="email"
      value={form.email}
      onChange={(v) => onChange("email", v)}
      placeholder="john@example.com"
    />
    <Field
      label="Phone Number"
      type="tel"
      value={form.phone}
      onChange={(v) => onChange("phone", v)}
      placeholder="+1 (555) 000-0000"
    />
    <Field
      label="Address"
      value={form.address}
      onChange={(v) => onChange("address", v)}
      placeholder="123 Main St, City, Country"
    />
  </div>
);
