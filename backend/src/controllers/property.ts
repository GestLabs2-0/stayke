import type {
  CreatePropertyBody,
  PropertyActionBody,
} from "../middlewares/property.middleware.js";
import type { RequestValidatedAPI, ResponseAPI } from "../typescript/express.js";

import { getPropertyRepository } from "../database/repositories/PropertyRepository.js";
import { getUserRepository } from "../database/repositories/UserRepository.js";
import { responseAndLogger } from "../utils/responseAndLogger.js";

// ─── POST /api/v1/properties ────────────────────────────────────────────────

/**
 * Creates a new property off-chain.
 * Owner and field formats are already validated.
 */
export const createProperty = async (
  req: RequestValidatedAPI<CreatePropertyBody>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const userRepo = getUserRepository();
    const propRepo = getPropertyRepository();

    const { comentarios, images, latitud, longitud, nombre, ownerWallet, pdaKey, pricePerNight, ubicacion } =
      req.body;

    // PDAs are unique identifiers on-chain, should be unique in DB too
    const existingPda = await propRepo.findOne({ where: { pdaKey } });
    if (existingPda) {
      responseAndLogger(res, "Ya existe una propiedad registrada con esta clave PDA", 409);
      return;
    }

    const owner = await userRepo.findOne({ where: { wallet: ownerWallet } });
    if (!owner) {
      responseAndLogger(res, "Dueño no encontrado", 404);
      return;
    }

    const property = propRepo.create({
      comentarios,
      images,
      latitud,
      longitud,
      nombre,
      owner,
      pdaKey,
      pricePerNight,
      ubicacion,
    });

    const saved = await propRepo.save(property);
    responseAndLogger(res, "Propiedad registrada exitosamente", 201, saved);
  } catch (error: unknown) {
    console.error("createProperty error:", error);
    responseAndLogger(res, "Error interno al registrar la propiedad", 500);
  }
};

// ─── GET /api/v1/properties ─────────────────────────────────────────────────

/**
 * Lists all registered properties.
 */
export const listAllProperties = async (
  req: RequestValidatedAPI,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const propRepo = getPropertyRepository();
    const properties = await propRepo.find({
      order: { dated: { created_at: "DESC" } },
      relations: { owner: true },
    });

    responseAndLogger(res, "Listado de todas las propiedades", 200, properties);
  } catch (error: unknown) {
    console.error("listAllProperties error:", error);
    responseAndLogger(res, "Error interno al listar propiedades", 500);
  }
};

// ─── GET /api/v1/properties/user/:wallet ────────────────────────────────────

/**
 * Lists all properties belonging to a specific user wallet.
 */
export const listPropertiesByUser = async (
  req: RequestValidatedAPI<unknown, { wallet: string }>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const propRepo = getPropertyRepository();
    const { wallet } = req.params;

    const properties = await propRepo.find({
      order: { dated: { created_at: "DESC" } },
      relations: { owner: true },
      where: { owner: { wallet } },
    });

    responseAndLogger(res, `Propiedades del usuario ${wallet}`, 200, properties);
  } catch (error: unknown) {
    console.error("listPropertiesByUser error:", error);
    responseAndLogger(res, "Error interno al listar propiedades del usuario", 500);
  }
};

// ─── PUT /api/v1/properties/:id ──────────────────────────────────────────────

/**
 * Partial update of a property.
 * Ownership and AVAILABLE status check are already done in middleware.
 */
export const updateProperty = async (
  req: RequestValidatedAPI<Partial<CreatePropertyBody> & PropertyActionBody, { id: string }>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const propRepo = getPropertyRepository();
    const { id } = req.params;
    const { comentarios, images, latitud, longitud, nombre, pricePerNight, ubicacion } = req.body;

    const property = await propRepo.findOne({ where: { id } });
    if (!property) {
      responseAndLogger(res, "Propiedad no encontrada", 404);
      return;
    }

    if (nombre !== undefined) property.nombre = nombre;
    if (pricePerNight !== undefined) property.pricePerNight = pricePerNight;
    if (images !== undefined) property.images = images;
    if (ubicacion !== undefined) property.ubicacion = ubicacion;
    if (latitud !== undefined) property.latitud = latitud;
    if (longitud !== undefined) property.longitud = longitud;
    if (comentarios !== undefined) property.comentarios = comentarios;

    const updated = await propRepo.save(property);
    responseAndLogger(res, "Propiedad actualizada exitosamente", 200, updated);
  } catch (error: unknown) {
    console.error("updateProperty error:", error);
    responseAndLogger(res, "Error interno al actualizar la propiedad", 500);
  }
};

// ─── DELETE /api/v1/properties/:id ───────────────────────────────────────────

/**
 * Deletes a property.
 * Ownership and AVAILABLE status check are already done in middleware.
 */
export const deleteProperty = async (
  req: RequestValidatedAPI<PropertyActionBody, { id: string }>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const propRepo = getPropertyRepository();
    const { id } = req.params;

    const property = await propRepo.findOne({ where: { id } });
    if (!property) {
      responseAndLogger(res, "Propiedad no encontrada", 404);
      return;
    }

    await propRepo.remove(property);
    responseAndLogger(res, "Propiedad eliminada exitosamente", 200);
  } catch (error: unknown) {
    console.error("deleteProperty error:", error);
    responseAndLogger(res, "Error interno al eliminar la propiedad", 500);
  }
};
