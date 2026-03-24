"use client";

import { useState } from "react";
import { useStaykeProgram } from "./useStaykeProgram";
import { staykeClient } from "../../client/staykeClient";

/**
 * Hook to handle guarantee deposits in USDC to the platform treasury.
 */
export const useDeposit = () => {
  const { signer } = useStaykeProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = async (
    userProfilePdaStr: string,
    amount: number | bigint,
    senderTokenAccount: string,
    usdcMint: string
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.depositFunds(
        signer,
        userProfilePdaStr,
        amount,
        senderTokenAccount,
        usdcMint
      );
      console.log("Deposit success:", signature);
      return signature;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to deposit funds";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (
    userProfilePda: string,
    amount: number | bigint,
    userTokenAccount: string,
    usdcMint: string
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.withdrawGuarantee(
        signer,
        userProfilePda,
        amount,
        userTokenAccount,
        usdcMint
      );
      console.log("Withdrawal success:", signature);
      return signature;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to withdraw funds";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deposit, withdraw, loading, error };
};
