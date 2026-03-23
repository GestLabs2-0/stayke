export interface EnumFieldConfig {
  customMessage?: string;
  enumValues: Record<string, string>;
  fieldName: string;
  isRequired?: boolean;
}

export interface JsonFieldConfig {
  allowEmpty?: boolean;
  fieldName: string;
  isRequired?: boolean;
}

export interface NumberFieldConfig {
  fieldName: string;
  isRequired?: boolean;
  maxValue?: number;
  minValue?: number;
}

export interface PasswordFieldConfig {
  fieldName: string;
  isRequired?: boolean;
}

export interface StringFieldConfig {
  fieldName: string;
  isRequired?: boolean;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
}

export interface UUIDFieldConfig {
  fieldName: string;
  isRequired?: boolean;
}
