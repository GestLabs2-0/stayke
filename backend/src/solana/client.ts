import type { Cluster } from "@solana/web3.js";

import { clusterApiUrl, Connection } from "@solana/web3.js";

/**
 * Singleton to manage the Solana JSON-RPC connection.
 * Default is 'devnet', configurable via SOLANA_CLUSTER env variable.
 */
export const getSolanaConnection = (): Connection => {
  const CLUSTER = process.env.SOLANA_CLUSTER ?? "devnet";
  const connectionUrl = CLUSTER.startsWith("http") ? CLUSTER : clusterApiUrl(CLUSTER as Cluster);

  console.log(`[SolanaClient] Linked to: ${CLUSTER}`);
  return new Connection(connectionUrl, "confirmed");
};
