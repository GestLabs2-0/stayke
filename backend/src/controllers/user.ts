import type {
  CreateAdminBody,
  CreateUserBody,
  DeleteUserBody,
  UpdateUserBody,
} from "../middlewares/user.middleware.js";
import type { RequestValidatedAPI, ResponseAPI } from "../typescript/express.js";

import { UserRole } from "../database/entities/enums/UserRole.js";
import { getUserRepository } from "../database/repositories/UserRepository.js";
import { responseAndLogger } from "../utils/responseAndLogger.js";

// ─── POST /api/v1/users ──────────────────────────────────────────────────────

/**
 * Creates a new user off-chain record linked to a Solana wallet.
 * At this point the body is already validated by createUserRule middleware.
 * Unique constraints: wallet, dni.
 */
export const createUser = async (
  req: RequestValidatedAPI<CreateUserBody>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const repo = getUserRepository();
    const { address, apellido, dni, email, nombre, phone, profileImage, wallet } = req.body;

    // Wallet uniqueness check
    const existingByWallet = await repo.findOne({ where: { wallet } });
    if (existingByWallet) {
      responseAndLogger(res, "Ya existe un usuario registrado con esta wallet", 409);
      return;
    }

    // DNI uniqueness check (only if provided)
    if (dni) {
      const existingByDni = await repo.findOne({ where: { dni } });
      if (existingByDni) {
        responseAndLogger(res, "Ya existe un usuario registrado con este DNI", 409);
        return;
      }
    }

    const user = repo.create({
      address,
      apellido,
      dni,
      email,
      nombre,
      phone,
      profileImage,
      wallet,
    });

    const saved = await repo.save(user);
    responseAndLogger(res, "Usuario creado exitosamente", 201, saved);
  } catch (error: unknown) {
    console.error("createUser error:", error);
    responseAndLogger(res, "Error interno al crear el usuario", 500);
  }
};

// ─── POST /api/v1/users/admin ────────────────────────────────────────────────

/**
 * Creates a new ADMIN user.
 * Verification is handled by the createAdminRule middleware (checks adminSecret).
 */
export const createAdminUser = async (
  req: RequestValidatedAPI<CreateAdminBody>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const repo = getUserRepository();
    const { address, apellido, dni, email, nombre, phone, profileImage, wallet } = req.body;

    // Wallet uniqueness check
    const existingByWallet = await repo.findOne({ where: { wallet } });
    if (existingByWallet) {
      responseAndLogger(res, "Ya existe un usuario registrado con esta wallet", 409);
      return;
    }

    // DNI uniqueness check (only if provided)
    if (dni) {
      const existingByDni = await repo.findOne({ where: { dni } });
      if (existingByDni) {
        responseAndLogger(res, "Ya existe un usuario registrado con este DNI", 409);
        return;
      }
    }

    const user = repo.create({
      address,
      apellido,
      dni,
      email,
      nombre,
      phone,
      profileImage,
      roles: [UserRole.ADMIN],
      wallet,
    });

    const saved = await repo.save(user);
    responseAndLogger(res, "Administrador creado exitosamente", 201, saved);
  } catch (error: unknown) {
    console.error("createAdminUser error:", error);
    responseAndLogger(res, "Error interno al crear el administrador", 500);
  }
};

// ─── GET /api/v1/users/:wallet ───────────────────────────────────────────────

/**
 * Checks whether a user exists for the given Solana wallet pubkey.
 * Returns { exists: true, user } if found, or { exists: false } if not.
 */
export const getUserByWallet = async (
  req: RequestValidatedAPI<unknown, { wallet: string }>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const repo = getUserRepository();
    const { wallet } = req.params;

    const user = await repo.findOne({
      select: {
        apellido: true,
        dni: true,
        email: true,
        id: true,
        infractions: true,
        isActive: true,
        nombre: true,
        phone: true,
        profileImage: true,
        roles: true,
        wallet: true,
      },
      where: { wallet },
    });

    if (!user) {
      responseAndLogger(res, "No existe un usuario asociado a esta wallet", 200, { exists: false });
      return;
    }

    responseAndLogger(res, "Usuario encontrado", 200, { exists: true, user });
  } catch (error: unknown) {
    console.error("getUserByWallet error:", error);
    responseAndLogger(res, "Error interno al consultar el usuario", 500);
  }
};

// ─── PUT /api/v1/users/:wallet ───────────────────────────────────────────────

/**
 * Updates a user's profile data.
 * Ownership/admin check is already done by updateUserRule middleware.
 * Only provided fields are updated (partial update).
 */
export const updateUser = async (
  req: RequestValidatedAPI<UpdateUserBody, { wallet: string }>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const repo = getUserRepository();
    const { wallet } = req.params;
    const { address, apellido, dni, email, nombre, phone, profileImage, roles } = req.body;

    const user = await repo.findOne({ where: { wallet } });
    if (!user) {
      responseAndLogger(res, "Usuario no encontrado", 404);
      return;
    }

    // Partial update — only override fields that were explicitly sent
    if (nombre !== undefined) user.nombre = nombre;
    if (apellido !== undefined) user.apellido = apellido;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (roles !== undefined) user.roles = roles;
    if (dni !== undefined) {
      // DNI uniqueness check when updating
      if (dni !== user.dni) {
        const existingByDni = await repo.findOne({ where: { dni } });
        if (existingByDni) {
          responseAndLogger(res, "Ya existe un usuario registrado con este DNI", 409);
          return;
        }
      }
      user.dni = dni;
    }

    const updated = await repo.save(user);
    responseAndLogger(res, "Usuario actualizado exitosamente", 200, updated);
  } catch (error: unknown) {
    console.error("updateUser error:", error);
    responseAndLogger(res, "Error interno al actualizar el usuario", 500);
  }
};

// ─── DELETE /api/v1/users/:wallet ────────────────────────────────────────────

/**
 * Permanently removes a user record.
 * Only accessible to users with UserRole.ADMIN (enforced by deleteUserRule middleware).
 */
export const deleteUser = async (
  req: RequestValidatedAPI<DeleteUserBody, { wallet: string }>,
  res: ResponseAPI,
): Promise<void> => {
  try {
    const repo = getUserRepository();
    const { wallet } = req.params;

    const user = await repo.findOne({ where: { wallet } });
    if (!user) {
      responseAndLogger(res, "Usuario no encontrado", 404);
      return;
    }

    await repo.remove(user);
    responseAndLogger(res, "Usuario eliminado exitosamente", 200);
  } catch (error: unknown) {
    console.error("deleteUser error:", error);
    responseAndLogger(res, "Error interno al eliminar el usuario", 500);
  }
};
