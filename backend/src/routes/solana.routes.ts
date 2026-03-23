import { Router } from "express";

import { getOrInitATA, transferToken } from "../controllers/solana.js";

const router = Router();

/**
 * Endpoint para gestionar cuentas asociadas de token (ATA).
 * Útil para asegurar que el usuario esté listo para transaccionar Mock USDC.
 * POST /api/v1/solana/init-ata
 */
router.post("/init-ata", getOrInitATA);

/**
 * Endpoint para simular transferencia de tokens.
 * POST /api/v1/solana/transfer-token
 */
router.post("/transfer-token", transferToken);

export const solanaRouter = router;
