import type { NextFunction } from "express";

import type { RequestValidationAPI, ResponseAPI } from "../typescript/express.js";

import { ADMIN_SECRET } from "../../constants.js";
import { UserRole } from "../database/entities/enums/UserRole.js";
import { getUserRepository } from "../database/repositories/UserRepository.js";
import { validateStringField } from "../utils/inputValidations.js";
import { responseAndLogger } from "../utils/responseAndLogger.js";

/** Base58 pattern for a Solana public key (32–44 chars). */
const SOLANA_PUBKEY_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// ─── Create User ────────────────────────────────────────────────────────────

export interface CreateUserBody {
  address?: string;
  apellido: string;
  dni?: string;
  email?: string;
  isHost?: boolean;
  nombre: string;
  phone?: string;
  profileImage?: string;
  wallet: string;
}

/**
 * Validates the request body for POST /api/v1/users.
 * Verifies that all required fields are present and well-formed.
 */
export const createUserRule = (
  req: RequestValidationAPI<CreateUserBody>,
  res: ResponseAPI,
  next: NextFunction,
): void => {
  if (!req.body) {
    responseAndLogger(res, "No se proporcionaron datos", 422);
    return;
  }

  const { address, apellido, dni, email, nombre, phone, wallet } = req.body;
  const errors: Record<string, string> = {};

  // wallet — obligatorio, debe ser una pubkey de Solana válida
  const walletError = validateStringField(wallet, {
    fieldName: "La wallet",
    isRequired: true,
    maxLength: 44,
    pattern: SOLANA_PUBKEY_PATTERN,
    patternMessage: "La wallet debe ser una clave pública de Solana válida (formato base58)",
  });
  if (walletError) errors.wallet = walletError;

  // nombre — obligatorio
  const nombreError = validateStringField(nombre, {
    fieldName: "El nombre",
    isRequired: true,
    maxLength: 100,
  });
  if (nombreError) errors.nombre = nombreError;

  // apellido — obligatorio
  const apellidoError = validateStringField(apellido, {
    fieldName: "El apellido",
    isRequired: true,
    maxLength: 100,
  });
  if (apellidoError) errors.apellido = apellidoError;

  // email — opcional, valida formato si se envía
  if (email !== undefined) {
    const emailError = validateStringField(email, {
      fieldName: "El email",
      maxLength: 150,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: "El email no tiene un formato válido",
    });
    if (emailError) errors.email = emailError;
  }

  // phone — opcional, valida longitud si se envía
  if (phone !== undefined) {
    const phoneError = validateStringField(phone, {
      fieldName: "El teléfono",
      maxLength: 20,
    });
    if (phoneError) errors.phone = phoneError;
  }

  // dni — opcional, valida longitud si se envía
  if (dni !== undefined) {
    const dniError = validateStringField(dni, {
      fieldName: "El DNI",
      maxLength: 20,
    });
    if (dniError) errors.dni = dniError;
  }

  // address — opcional
  if (address !== undefined) {
    const addressError = validateStringField(address, {
      fieldName: "La dirección",
      maxLength: 300,
    });
    if (addressError) errors.address = addressError;
  }

  if (Object.keys(errors).length > 0) {
    responseAndLogger(res, "Datos de validación incorrectos", 422, errors);
    return;
  }

  next();
};

// ─── Get User By Wallet ──────────────────────────────────────────────────────

/**
 * Validates the :wallet param for GET /api/v1/users/:wallet.
 */
export const getUserByWalletRule = (
  req: RequestValidationAPI<unknown, { wallet: string }>,
  res: ResponseAPI,
  next: NextFunction,
): void => {
  const { wallet } = req.params;

  const walletError = validateStringField(wallet, {
    fieldName: "La wallet",
    isRequired: true,
    maxLength: 44,
    pattern: SOLANA_PUBKEY_PATTERN,
    patternMessage: "La wallet debe ser una clave pública de Solana válida (formato base58)",
  });

  if (walletError) {
    responseAndLogger(res, walletError, 422);
    return;
  }

  next();
};

// ─── Update User ─────────────────────────────────────────────────────────────

export interface UpdateUserBody {
  address?: string;
  apellido?: string;
  /** Required — cannot be removed once set */
  dni: string;
  /** Required — cannot be removed once set */
  email: string;
  nombre?: string;
  phone?: string;
  profileImage?: string;
  /**
   * Wallet of whoever is making the request.
   * Must match the :wallet param (own profile) OR the requester must have ADMIN role.
   */
  requesterWallet: string;
  roles?: UserRole[];
}

/**
 * Validates PUT /api/v1/users/:wallet.
 * - Validates field formats.
 * - Verifies requesterWallet is a registered user.
 * - Verifies ownership: requesterWallet === :wallet OR requester has ADMIN role.
 */
export const updateUserRule = async (
  req: RequestValidationAPI<UpdateUserBody, { wallet: string }>,
  res: ResponseAPI,
  next: NextFunction,
): Promise<void> => {
  if (!req.body) {
    responseAndLogger(res, "No se proporcionaron datos", 422);
    return;
  }

  const { address, apellido, dni, email, nombre, phone, requesterWallet } = req.body;
  const errors: Record<string, string> = {};

  // requesterWallet — obligatorio
  const requesterError = validateStringField(requesterWallet, {
    fieldName: "La wallet del solicitante (requesterWallet)",
    isRequired: true,
    maxLength: 44,
    pattern: SOLANA_PUBKEY_PATTERN,
    patternMessage: "La requesterWallet debe ser una clave pública de Solana válida",
  });
  if (requesterError) errors.requesterWallet = requesterError;

  // email — obligatorio, no puede ser vacío
  const emailError = validateStringField(email, {
    fieldName: "El email",
    isRequired: true,
    maxLength: 150,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: "El email no tiene un formato válido",
  });
  if (emailError) errors.email = emailError;

  // dni — obligatorio, no puede ser vacío
  const dniError = validateStringField(dni, {
    fieldName: "El DNI",
    isRequired: true,
    maxLength: 20,
  });
  if (dniError) errors.dni = dniError;

  // Validate other optional editable fields
  if (nombre !== undefined) {
    const err = validateStringField(nombre, { fieldName: "El nombre", maxLength: 100 });
    if (err) errors.nombre = err;
  }
  if (apellido !== undefined) {
    const err = validateStringField(apellido, { fieldName: "El apellido", maxLength: 100 });
    if (err) errors.apellido = err;
  }
  if (phone !== undefined) {
    const err = validateStringField(phone, { fieldName: "El teléfono", maxLength: 20 });
    if (err) errors.phone = err;
  }
  if (address !== undefined) {
    const err = validateStringField(address, { fieldName: "La dirección", maxLength: 300 });
    if (err) errors.address = err;
  }

  if (Object.keys(errors).length > 0) {
    responseAndLogger(res, "Datos de validación incorrectos", 422, errors);
    return;
  }

  // Ownership / admin check (requires DB)
  try {
    const repo = getUserRepository();
    const requester = await repo.findOne({
      select: { roles: true, wallet: true },
      where: { wallet: requesterWallet },
    });

    if (!requester) {
      responseAndLogger(res, "El solicitante no tiene cuenta registrada en el sistema", 403);
      return;
    }

    const isOwner = requesterWallet === req.params.wallet;
    const isAdmin = requester.roles.includes(UserRole.ADMIN);

    if (!isOwner && !isAdmin) {
      responseAndLogger(res, "No tienes permiso para editar este usuario", 403);
      return;
    }
  } catch (error: unknown) {
    console.error("updateUserRule DB error:", error);
    responseAndLogger(res, "Error interno al verificar permisos", 500);
    return;
  }

  next();
};

// ─── Delete User ─────────────────────────────────────────────────────────────

export interface DeleteUserBody {
  /**
   * Wallet of whoever is making the request.
   * Must have the ADMIN role to delete any user.
   */
  requesterWallet: string;
}

/**
 * Validates DELETE /api/v1/users/:wallet.
 * Only users with UserRole.ADMIN can delete accounts.
 */
export const deleteUserRule = async (
  req: RequestValidationAPI<DeleteUserBody>,
  res: ResponseAPI,
  next: NextFunction,
): Promise<void> => {
  if (!req.body) {
    responseAndLogger(res, "No se proporcionaron datos", 422);
    return;
  }

  const { requesterWallet } = req.body;

  const requesterError = validateStringField(requesterWallet, {
    fieldName: "La wallet del solicitante (requesterWallet)",
    isRequired: true,
    maxLength: 44,
    pattern: SOLANA_PUBKEY_PATTERN,
    patternMessage: "La requesterWallet debe ser una clave pública de Solana válida",
  });

  if (requesterError) {
    responseAndLogger(res, requesterError, 422);
    return;
  }

  try {
    const repo = getUserRepository();
    const requester = await repo.findOne({
      select: { roles: true, wallet: true },
      where: { wallet: requesterWallet },
    });

    if (!requester) {
      responseAndLogger(res, "El solicitante no tiene cuenta registrada en el sistema", 403);
      return;
    }

    if (!requester.roles.includes(UserRole.ADMIN)) {
      responseAndLogger(
        res,
        "No tienes privilegios para eliminar usuarios. Se requiere el rol ADMIN",
        403,
      );
      return;
    }
  } catch (error: unknown) {
    console.error("deleteUserRule DB error:", error);
    responseAndLogger(res, "Error interno al verificar permisos", 500);
    return;
  }

  next();
};

// ─── Create Admin User ───────────────────────────────────────────────────────

export interface CreateAdminBody {
  address?: string;
  /**
   * Secret key that must match the ADMIN_SECRET environment variable.
   * Without this, the endpoint rejects the request with 403.
   */
  adminSecret: string;
  apellido: string;
  dni?: string;
  email?: string;
  nombre: string;
  phone?: string;
  profileImage?: string;
  wallet: string;
}

/**
 * Validates POST /api/v1/users/admin.
 * Same field validations as createUserRule, plus:
 * - adminSecret must be present and match the ADMIN_SECRET env var.
 */
export const createAdminRule = (
  req: RequestValidationAPI<CreateAdminBody>,
  res: ResponseAPI,
  next: NextFunction,
): void => {
  if (!req.body) {
    responseAndLogger(res, "No se proporcionaron datos", 422);
    return;
  }

  const { address, adminSecret, apellido, dni, email, nombre, phone, wallet } = req.body;
  const errors: Record<string, string> = {};

  // adminSecret — obligatorio, debe coincidir con la variable de entorno
  if (!adminSecret) {
    responseAndLogger(res, "Se requiere la clave de administrador (adminSecret)", 403);
    return;
  }
  if (adminSecret !== ADMIN_SECRET) {
    responseAndLogger(res, "La clave de administrador no es válida", 403);
    return;
  }

  // wallet — obligatorio
  const walletError = validateStringField(wallet, {
    fieldName: "La wallet",
    isRequired: true,
    maxLength: 44,
    pattern: SOLANA_PUBKEY_PATTERN,
    patternMessage: "La wallet debe ser una clave pública de Solana válida (formato base58)",
  });
  if (walletError) errors.wallet = walletError;

  // nombre — obligatorio
  const nombreError = validateStringField(nombre, {
    fieldName: "El nombre",
    isRequired: true,
    maxLength: 100,
  });
  if (nombreError) errors.nombre = nombreError;

  // apellido — obligatorio
  const apellidoError = validateStringField(apellido, {
    fieldName: "El apellido",
    isRequired: true,
    maxLength: 100,
  });
  if (apellidoError) errors.apellido = apellidoError;

  // email — opcional
  if (email !== undefined) {
    const err = validateStringField(email, {
      fieldName: "El email",
      maxLength: 150,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: "El email no tiene un formato válido",
    });
    if (err) errors.email = err;
  }

  // phone — opcional
  if (phone !== undefined) {
    const err = validateStringField(phone, { fieldName: "El teléfono", maxLength: 20 });
    if (err) errors.phone = err;
  }

  // dni — opcional
  if (dni !== undefined) {
    const err = validateStringField(dni, { fieldName: "El DNI", maxLength: 20 });
    if (err) errors.dni = err;
  }

  // address — opcional
  if (address !== undefined) {
    const err = validateStringField(address, { fieldName: "La dirección", maxLength: 300 });
    if (err) errors.address = err;
  }

  if (Object.keys(errors).length > 0) {
    responseAndLogger(res, "Datos de validación incorrectos", 422, errors);
    return;
  }

  next();
};
