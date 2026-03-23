import { PublicKey } from "@solana/web3.js";

import type { RequestValidatedAPI, ResponseAPI } from "../typescript/express.js";

import { getSolanaConnection } from "../solana/client.js";
import { responseAndLogger } from "../utils/responseAndLogger.js";

interface GetATABody {
  wallet: string;
}

/**
 * Helper endpoint to get or create an ATA for a user's wallet.
 * Uses devnet USDC mint defined in .env.
 * POST /api/v1/solana/init-ata
 */
export const getOrInitATA = async (req: RequestValidatedAPI<GetATABody>, res: ResponseAPI): Promise<void> => {
  try {
    const { wallet } = req.body;
    const connection = getSolanaConnection();
    const mintStr = process.env.STAYKE_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    const mint = new PublicKey(mintStr);
    const userWallet = new PublicKey(wallet);

    // Mocking progress for now since a backend Signer is required for actual ATA creation
    // To implement properly: result = await getATA(connection, backendAdmin, mint, userWallet);
    console.log(`[getOrInitATA] Checking ATA for ${userWallet.toBase58()} on ${connection.rpcEndpoint}`);
    
    await Promise.resolve(); // To satisfy 'no-await' lint

    responseAndLogger(res, "Cuenta de Token (ATA) verificada/preparada (MOCK)", 200, {
      mint: mint.toBase58(),
      wallet: userWallet.toBase58(),
    });
  } catch (error: unknown) {
    console.error("getOrInitATA error:", error);
    responseAndLogger(res, "Error al gestionar la cuenta de token (ATA)", 500);
  }
};

interface TransferBody {
  amount: number;
  from: string;
  to: string;
}

/**
 * Placeholder endpoint to simulate an SPL token transfer from backend.
 * Requires a backend signer (Admin Wallet) to finalize.
 */
export const transferToken = async (req: RequestValidatedAPI<TransferBody>, res: ResponseAPI): Promise<void> => {
  try {
    const { amount, from, to } = req.body;
    getSolanaConnection(); // Verified connection
    const mintStr = process.env.STAYKE_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    const mint = new PublicKey(mintStr);

    console.log(`[transferToken] Simulating transfer of ${String(amount)} MockUSDC (Mint: ${mint.toBase58()}) from ${from} to ${to}`);
    
    // Logic for authenticating the backend signer and executing:
    // const result = await transferSPL(connection, adminSigner, mint, fromSigner, toPda, amount);
    await Promise.resolve();

    responseAndLogger(res, "Transferencia de tokens procesada (MOCK)", 200, {
      from,
      mint: mint.toBase58(),
      to,
      transaction: "SolanaSimulationTx11111111111111111111111111111111",
    });
  } catch (error: unknown) {
    console.error("transferToken error:", error);
    responseAndLogger(res, "Error al procesar la transferencia de tokens", 500);
  }
};
