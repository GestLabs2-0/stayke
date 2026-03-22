import type { NextFunction } from "express";

import type { RequestValidationAPI, ResponseAPI } from "../typescript/express.js";

import { PropertyStatus } from "../database/entities/enums/PropertyStatus.js";
import { UserRole } from "../database/entities/enums/UserRole.js";
import { getPropertyRepository } from "../database/repositories/PropertyRepository.js";
import { getUserRepository } from "../database/repositories/UserRepository.js";
import { validateStringField } from "../utils/inputValidations.js";
import { responseAndLogger } from "../utils/responseAndLogger.js";

/** Base58 pattern for a Solana public key (32–44 chars). */
const SOLANA_PUBKEY_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// ─── Create Property ─────────────────────────────────────────────────────────

export interface CreatePropertyBody {
  comentarios?: string;
  images?: string[];
  latitud?: number;
  longitud?: number;
  nombre: string;
  ownerWallet: string;
  pdaKey: string;
  pricePerNight: number;
  ubicacion?: string;
}

/**
 * Validates request body for POST /api/v1/properties.
 * Required: nombre, pricePerNight, pdaKey, ownerWallet.
 */
export const createPropertyRule = async (
  req: RequestValidationAPI<CreatePropertyBody>,
  res: ResponseAPI,
  next: NextFunction,
): Promise<void> => {
  if (!req.body) {
    responseAndLogger(res, "No se proporcionaron datos", 422);
    return;
  }

  // Destructure only what we want to validate *here* to avoid unused-vars error
  const { comentarios, nombre, ownerWallet, pdaKey, pricePerNight, ubicacion } = req.body;
  const errors: Record<string, string> = {};

  // nombre — obligatorio
  const nombreError = validateStringField(nombre, {
    fieldName: "El nombre de la propiedad",
    isRequired: true,
    maxLength: 200,
  });
  if (nombreError) errors.nombre = nombreError;

  // pricePerNight — obligatorio.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (pricePerNight === undefined || pricePerNight === null || (pricePerNight as unknown) === "") {
    errors.pricePerNight = "El precio por noche es obligatorio";
  } else if (typeof pricePerNight !== "number" || pricePerNight <= 0) {
    errors.pricePerNight = "El precio por noche debe ser un número positivo";
  }

  // pdaKey — obligatorio, formato base58
  const pdaKeyError = validateStringField(pdaKey, {
    fieldName: "La clave PDA",
    isRequired: true,
    maxLength: 44,
    pattern: SOLANA_PUBKEY_PATTERN,
    patternMessage: "La pdaKey debe ser una clave pública de Solana válida",
  });
  if (pdaKeyError) errors.pdaKey = pdaKeyError;

  // ownerWallet — obligatorio, debe existir en DB
  const ownerWalletError = validateStringField(ownerWallet, {
    fieldName: "La wallet del dueño",
    isRequired: true,
    maxLength: 44,
    pattern: SOLANA_PUBKEY_PATTERN,
    patternMessage: "La ownerWallet debe ser una clave pública de Solana válida",
  });
  if (ownerWalletError) {
    errors.ownerWallet = ownerWalletError;
  }

  // Optional string fields
  if (ubicacion !== undefined) {
    const err = validateStringField(ubicacion, { fieldName: "La ubicación", maxLength: 300 });
    if (err) errors.ubicacion = err;
  }
  if (comentarios !== undefined) {
    const err = validateStringField(comentarios, { fieldName: "Los comentarios" });
    if (err) errors.comentarios = err;
  }

  if (Object.keys(errors).length > 0) {
    responseAndLogger(res, "Datos de validación incorrectos", 422, errors);
    return;
  }

  // Ensure user exists
  try {
    const userRepo = getUserRepository();
    const user = await userRepo.findOne({ where: { wallet: ownerWallet } });
    if (!user) {
      responseAndLogger(res, "No se encontró un usuario registrado con esa wallet", 404);
      return;
    }
  } catch (error: unknown) {
    console.error("createPropertyRule userRepo error:", error);
    responseAndLogger(res, "Error interno al validar el dueño", 500);
    return;
  }

  next();
};

// ─── Update/Delete Property Ownership & Status Check ─────────────────────────

export interface PropertyActionBody {
  requesterWallet: string;
}

/**
 * Middleware shared by edit and delete.
 * - Validates requesterWallet format.
 * - Finds property by id (sent in path).
 * - Checks requester is owner OR requester is ADMIN.
 * - Checks property status is AVAILABLE.
 */
export const propertyOwnershipAndStatusRule = async (
  req: RequestValidationAPI<PropertyActionBody, { id: string }>,
  res: ResponseAPI,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!req.body) {
    responseAndLogger(res, "No se proporcionaron datos", 422);
    return;
  }

  const { requesterWallet } = req.body;

  if (!requesterWallet) {
    responseAndLogger(res, "requesterWallet es obligatorio", 422);
    return;
  }

  const walletError = validateStringField(requesterWallet, {
    fieldName: "La wallet del solicitante",
    isRequired: true,
    maxLength: 44,
    pattern: SOLANA_PUBKEY_PATTERN,
  });
  if (walletError) {
    responseAndLogger(res, walletError, 422);
    return;
  }

  try {
    const propRepo = getPropertyRepository();
    // Load owner relations to check ownership
    const property = await propRepo.findOne({
      relations: { owner: true },
      where: { id },
    });

    if (!property) {
      responseAndLogger(res, "Propiedad no encontrada", 404);
      return;
    }

    // Status check: only AVAILABLE properties can be modified/deleted
    if (property.status !== PropertyStatus.AVAILABLE) {
      responseAndLogger(
        res,
        `No se puede modificar una propiedad con estado ${property.status}. Solo las propiedades ${PropertyStatus.AVAILABLE} son editables.`,
        403,
      );
      return;
    }

    // Role/Ownership check
    const userRepo = getUserRepository();
    const requester = await userRepo.findOne({ where: { wallet: requesterWallet } });

    if (!requester) {
      responseAndLogger(res, "Solicitante no encontrado", 403);
      return;
    }

    const isOwner = property.owner.wallet === requesterWallet;
    const isAdmin = requester.roles.includes(UserRole.ADMIN);

    if (!isOwner && !isAdmin) {
      responseAndLogger(res, "No tienes permiso para modificar esta propiedad", 403);
      return;
    }

    next();
  } catch (error: unknown) {
    console.error("propertyOwnershipAndStatusRule error:", error);
    responseAndLogger(res, "Error interno al validar permisos de la propiedad", 500);
  }
};
