//Own components
import { StepPersonal } from "./StepPersonal";
import { StepContact } from "./StepContact";
import { StepRole } from "./StepRole";
//Type
import { RegisterFormData } from "@/src/types/RegisterFormData";

type StepRenderer = (props: {
  form: RegisterFormData;
  onChange: (field: keyof RegisterFormData, value: any) => void;
}) => React.ReactNode;

//Step Components
export const STEP_COMPONENTS: Record<number, StepRenderer> = {
  1: ({ form, onChange }) => <StepPersonal form={form} onChange={onChange} />,
  2: ({ form, onChange }) => (
    <StepContact form={form} onChange={onChange as any} />
  ),
  3: ({ form, onChange }) => (
    <StepRole form={form} onChange={onChange as any} />
  ),
};
