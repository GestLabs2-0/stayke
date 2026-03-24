import type { CreateAdminBody, CreateUserBody, DeleteUserBody, UpdateUserBody } from "../middlewares/user.middleware.js";
import type { RequestValidatedAPI, ResponseAPI } from "../typescript/express.js";

import { UserRole } from "../database/entities/enums/UserRole.js";
import { getUserRepository } from "../database/repositories/UserRepository.js";
import { hashDni } from "../utils/hashDni.js";
import { responseAndLogger } from "../utils/responseAndLogger.js";

// ─── GET /api/v1/users ───────────────────────────────────────────────────────

/**
 * Returns a list of all registered users.
 */
export const listAllUsers = async (_req: RequestValidatedAPI, res: ResponseAPI): Promise<void> => {
  try {
    const repo = getUserRepository();
    const users = await repo.find({
      select: {
        apellido: true,
        dni: true,
        email: true,
        id: true,
        isActive: true,
        nombre: true,
        pdaKey: true,
        phone: true,
        profileImage: true,
        roles: true,
        wallet: true,
      },
    });

    responseAndLogger(res, "Lista de usuarios recuperada exitosamente", 200, users);
  } catch (error: unknown) {
    console.error("listAllUsers error:", error);
    responseAndLogger(res, "Error interno al listar los usuarios", 500);
  }
};

// ─── POST /api/v1/users ──────────────────────────────────────────────────────

/**
 * Creates a new user off-chain record linked to a Solana wallet.
 * At this point the body is already validated by createUserRule middleware.
 * Unique constraints: wallet, dni.
 */
export const createUser = async (req: RequestValidatedAPI<CreateUserBody>, res: ResponseAPI): Promise<void> => {
  try {
    const repo = getUserRepository();
    const { address, apellido, dni, email, isHost, nombre, pdaKey, phone, profileImage, wallet } = req.body;

    // Wallet uniqueness check
    const existingByWallet = await repo.findOne({ where: { wallet } });
    if (existingByWallet) {
      responseAndLogger(res, "Ya existe un usuario registrado con esta wallet", 409);
      return;
    }

    // Hash the DNI for uniqueness and security
    const dniHash = dni ? hashDni(dni) : undefined;

    // DNI uniqueness check (only if provided)
    if (dniHash) {
      const existingByDni = await repo.findOne({ where: { dni: dniHash } });
      if (existingByDni) {
        responseAndLogger(res, "Ya existe un usuario registrado con este DNI", 409);
        return;
      }
    }

    // Use PDA generated and sent by frontend
    const finalPdaKey = pdaKey;

    // Determine initial roles
    let roles: UserRole[] = [UserRole.CLIENT];
    if (isHost) roles = [UserRole.HOST];

    const user = repo.create({
      address,
      apellido,
      dni: dniHash ?? "", // stored as SHA-256 hash
      email,
      nombre,
      pdaKey: finalPdaKey,
      phone,
      profileImage,
      roles,
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
export const createAdminUser = async (req: RequestValidatedAPI<CreateAdminBody>, res: ResponseAPI): Promise<void> => {
  try {
    const repo = getUserRepository();
    const { address, apellido, dni, email, nombre, pdaKey, phone, profileImage, wallet } = req.body;

    // Wallet uniqueness check
    const existingByWallet = await repo.findOne({ where: { wallet } });
    if (existingByWallet) {
      responseAndLogger(res, "Ya existe un usuario registrado con esta wallet", 409);
      return;
    }

    // Hash the DNI for uniqueness and security
    const dniHash = dni ? hashDni(dni) : undefined;

    // DNI uniqueness check (only if provided)
    if (dniHash) {
      const existingByDni = await repo.findOne({ where: { dni: dniHash } });
      if (existingByDni) {
        responseAndLogger(res, "Ya existe un usuario registrado con este DNI", 409);
        return;
      }
    }

    // Use PDA generated and sent by frontend
    const finalPdaKey = pdaKey;

    const user = repo.create({
      address,
      apellido,
      dni: dniHash ?? "", // stored as SHA-256 hash
      email,
      nombre,
      pdaKey: finalPdaKey,
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
export const getUserByWallet = async (req: RequestValidatedAPI<unknown, { wallet: string }>, res: ResponseAPI): Promise<void> => {
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
        pdaKey: true,
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
export const updateUser = async (req: RequestValidatedAPI<UpdateUserBody, { wallet: string }>, res: ResponseAPI): Promise<void> => {
  try {
    const repo = getUserRepository();
    const { wallet } = req.params;
    const { address, apellido, dni, email, nombre, phone, profileImage, roles } = req.body;

    const user = await repo.findOne({ where: { wallet } });
    if (!user) {
      responseAndLogger(res, "Usuario no encontrado", 404);
      return;
    }

    // Hash the incoming DNI for comparison
    const dniHash = dni ? hashDni(dni) : undefined;

    // email and dni are required — middleware already validated they are present and non-empty
    // DNI uniqueness check when the value changed (must happen before assigning)
    if (dniHash !== user.dni) {
      const existingByDni = await repo.findOne({ where: { dni: dniHash } });
      if (existingByDni) {
        responseAndLogger(res, "Ya existe un usuario registrado con este DNI", 409);
        return;
      }

      // If DNI changed, regenerate PDA - this should be handled by frontend and smart contract logic,
      // but if we must, we'd need the frontend to supply the new pdaKey. For now, since DNI is part
      // of the seed, changing it without migrating the on-chain data breaks the link.
      // DNI updates that change the PDA should probably be forbidden, or require a signed transaction.
    }

    user.email = email;
    user.dni = dniHash ?? "";

    if (nombre !== undefined) user.nombre = nombre;
    if (apellido !== undefined) user.apellido = apellido;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (roles !== undefined) user.roles = roles;

    // profileImage: if not provided or empty, keep existing or assign default avatar
    user.profileImage = profileImage?.trim() ? profileImage : (user.profileImage ?? "https://ui-avatars.com/api/?background=random");

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
export const deleteUser = async (req: RequestValidatedAPI<DeleteUserBody, { wallet: string }>, res: ResponseAPI): Promise<void> => {
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
