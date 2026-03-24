export type Role = "host" | "client";

export interface RegisterFormData {
  dni: string;
  wallet: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  image: string;
  isHost: boolean;
}

export type StepRenderer = (props: {
  form: RegisterFormData;
  onChange: (field: keyof RegisterFormData, value: unknown) => void;
}) => React.ReactNode;
