import { Router } from "express";

import { createProperty, deleteProperty, listAllProperties, listPropertiesByUser, updateProperty } from "../controllers/property.js";
import { createPropertyRule, propertyOwnershipAndStatusRule } from "../middlewares/property.middleware.js";

const router = Router();

/**
 * POST /api/v1/properties
 * Register a new property off-chain.
 */
router.post("/", createPropertyRule, createProperty);

/**
 * GET /api/v1/properties
 * List all registered properties.
 */
router.get("/", listAllProperties);

/**
 * GET /api/v1/properties/user/:wallet
 * List all properties belonging to a specific user wallet.
 */
router.get("/:wallet", listPropertiesByUser);

/**
 * PUT /api/v1/properties/:id
 * Update a property. Body needs requesterWallet to check ownership or ADMIN status.
 */
router.put("/:id", propertyOwnershipAndStatusRule, updateProperty);

/**
 * DELETE /api/v1/properties/:id
 * Delete a property. Body needs requesterWallet to check ownership or ADMIN status.
 */
router.delete("/:id", propertyOwnershipAndStatusRule, deleteProperty);

export const propertyRoutes = router;
