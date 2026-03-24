"use client";

import { useWalletConnection } from "@solana/react-hooks";
import { type TransactionSigner } from "@solana/kit";
import { rpc } from "../../client/rpc";
import { PROGRAM_ID } from "../../client/codama";

/**
 * Base hook to access the Stayke program context and the user's wallet signer.
 */
export const useStaykeProgram = () => {
  const { wallet, disconnect } = useWalletConnection();

  // In @solana/react-hooks v2, the wallet account itself often acts as the signer
  // but we must ensure it's treated as a TransactionSigner for @solana/kit.
  const signer = wallet?.account as unknown as TransactionSigner | undefined;

  return {
    rpc,
    signer,
    programId: PROGRAM_ID,
    connected: !!wallet?.account,
    disconnect,
  };
};
