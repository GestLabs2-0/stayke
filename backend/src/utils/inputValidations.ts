import type {
  EnumFieldConfig,
  JsonFieldConfig,
  NumberFieldConfig,
  PasswordFieldConfig,
  StringFieldConfig,
  UUIDFieldConfig,
} from "../typescript/inputValidations.js";

export function validateBooleanField(
  value: unknown,
  fieldName: string
): null | string {
  if (value !== undefined && typeof value !== "boolean") {
    return `${fieldName} debe ser un valor booleano`;
  }

  return null;
}

export function validateDateField(
  value: unknown,
  fieldName: string,
  isRequired = false
): null | string {
  if (isRequired && !value) {
    return `${fieldName} es obligatorio`;
  }

  if (value !== undefined && value !== null) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      value instanceof Date
    ) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return `${fieldName} debe ser una fecha válida`;
      }
    } else {
      return `${fieldName} debe ser una fecha válida`;
    }
  }

  return null;
}

/**
 * Valida que un valor pertenezca a un enum específico
 *
 * @param value - El valor a validar
 * @param config - Configuración de validación del enum
 * @returns null si la validación es exitosa, o un mensaje de error
 *
 * @example
 * ```typescript
 * enum UserRole {
 *   ADMIN = 'admin',
 *   USER = 'user',
 * }
 *
 * const error = validateEnumField(status, {
 *   fieldName: 'El rol',
 *   isRequired: true,
 *   enumValues: UserRole,
 * });
 * ```
 */
export function validateEnumField(
  value: unknown,
  config: EnumFieldConfig
): null | string {
  const { customMessage, enumValues, fieldName, isRequired = false } = config;

  if (isRequired && !value) {
    return `${fieldName} es obligatorio`;
  }

  if (value !== undefined && value !== null) {
    if (typeof value !== "string") {
      return `${fieldName} debe ser una cadena de texto`;
    }

    const validValues = Object.values(enumValues);
    if (!validValues.includes(value)) {
      if (customMessage) {
        return customMessage;
      }
      return `${fieldName} debe ser uno de los siguientes valores: ${validValues.join(
        ", "
      )}`;
    }
  }

  return null;
}

export function validateJsonField(
  value: unknown,
  config: JsonFieldConfig
): null | string {
  const { allowEmpty = false, fieldName, isRequired = false } = config;

  if (isRequired && !value) {
    return `${fieldName} es obligatorio`;
  }

  if (value !== undefined) {
    // Verificar que sea un objeto
    if (typeof value !== "object" || value === null) {
      return `${fieldName} debe ser un objeto JSON válido`;
    }

    // Verificar que no esté vacío si no se permite
    if (!allowEmpty && Object.keys(value).length === 0) {
      return `${fieldName} no puede estar vacío`;
    }
  }

  return null;
}

export function validateNumberField(
  value: unknown,
  config: NumberFieldConfig
): null | string {
  const { fieldName, isRequired = false, maxValue, minValue } = config;

  if (isRequired && (value === undefined || value === null)) {
    return `${fieldName} es obligatorio`;
  }

  if (value !== undefined) {
    const valueNumber = Number(value);
    if (Number.isNaN(valueNumber)) {
      return `${fieldName} debe ser un número`;
    }

    if (minValue !== undefined && valueNumber < minValue) {
      return `${fieldName} debe ser mayor o igual a ${String(minValue)}`;
    }

    if (maxValue !== undefined && valueNumber > maxValue) {
      return `${fieldName} debe ser menor o igual a ${String(maxValue)}`;
    }
  }

  return null;
}

export function validatePassword(
  value: unknown,
  config: PasswordFieldConfig
): null | string {
  const { fieldName, isRequired = false } = config;

  if (isRequired && !value) {
    return `${fieldName} es obligatoria`;
  }

  if (value !== undefined) {
    if (typeof value !== "string") {
      return `${fieldName} debe ser una cadena de texto`;
    }

    if (value.trim().length === 0) {
      return `${fieldName} no puede estar vacía`;
    }

    if (value.length < 6) {
      return `${fieldName} debe tener al menos 6 caracteres`;
    }
  }

  return null;
}

export function validateStringField(
  value: unknown,
  config: StringFieldConfig
): null | string {
  const {
    fieldName,
    isRequired = false,
    maxLength,
    pattern,
    patternMessage,
  } = config;

  if (isRequired && !value) {
    return `${fieldName} es obligatorio`;
  }

  if (value !== undefined) {
    if (typeof value !== "string") {
      return `${fieldName} debe ser una cadena de texto`;
    }

    if (value.trim().length === 0) {
      return `${fieldName} no puede estar vacío`;
    }

    if (maxLength && value.length > maxLength) {
      return `${fieldName} no puede exceder ${String(maxLength)} caracteres`;
    }

    if (pattern && !pattern.test(value)) {
      return patternMessage ?? `${fieldName} tiene un formato inválido`;
    }
  }

  return null;
}

/**
 * Valida que un valor sea un UUID válido (v4)
 *
 * @param value - El valor a validar
 * @param config - Configuración de validación del UUID
 * @returns null si la validación es exitosa, o un mensaje de error
 *
 * @example
 * ```typescript
 * const error = validateUUID(userId, {
 *   fieldName: 'El ID de usuario',
 *   isRequired: true,
 * });
 * ```
 */
export function validateUUID(
  value: unknown,
  config: UUIDFieldConfig
): null | string {
  const { fieldName, isRequired = false } = config;

  if (isRequired && !value) {
    return `${fieldName} es obligatorio`;
  }

  if (value !== undefined && value !== null) {
    if (typeof value !== "string") {
      return `${fieldName} debe ser una cadena de texto`;
    }

    // Regex para validar UUID v4
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      return `${fieldName} debe ser un UUID válido`;
    }
  }

  return null;
}
