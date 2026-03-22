import { Router } from "express";

import {
  createAdminUser,
  createUser,
  deleteUser,
  getUserByWallet,
  listAllUsers,
  updateUser,
} from "../controllers/user.js";
import {
  createAdminRule,
  createUserRule,
  deleteUserRule,
  getUserByWalletRule,
  updateUserRule,
} from "../middlewares/user.middleware.js";

const router = Router();

/**
 * GET /api/v1/users
 * List all users.
 */
router.get("/", listAllUsers);

/**
 * POST /api/v1/users
 * Register a new user. Body: { wallet, nombre, apellido, email?, phone?, address?, dni?, profileImage? }
 */
router.post("/", createUserRule, createUser);

/**
 * POST /api/v1/users/admin
 * Create an admin user. Requires adminSecret in the body.
 */
router.post("/admin", createAdminRule, createAdminUser);

/**
 * GET /api/v1/users/:wallet
 * Check if a user exists. Response: { exists: true, user } | { exists: false }
 */
router.get("/:wallet", getUserByWalletRule, getUserByWallet);

/**
 * PUT /api/v1/users/:wallet
 * Update user profile. Body must include requesterWallet (owner or ADMIN can edit).
 * Only provided fields are updated (partial update).
 */
router.put("/:wallet", updateUserRule, updateUser);

/**
 * DELETE /api/v1/users/:wallet
 * Delete a user. Body must include requesterWallet with ADMIN role.
 */
router.delete("/:wallet", deleteUserRule, deleteUser);

export const userRoutes = router;
