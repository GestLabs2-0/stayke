import { Router } from "express";

/**
 * Wallet routes — authentication is handled client-side via Solana wallet.
 * These routes handle user creation and lookup by wallet public key.
 */
export function walletRoutes(): Router {
  const router = Router();

  /** POST /api/v1/wallet/connect — Register or fetch a user by their wallet pubkey */
  router.post("/connect", (_req, res) => {
    // TODO: implement wallet connect logic (create or find User by wallet pubkey)
    res.status(501).json({ message: "Not implemented yet", status: false });
  });

  return router;
}
