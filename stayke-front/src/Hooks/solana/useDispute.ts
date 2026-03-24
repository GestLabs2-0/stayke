"use client";

import { useState } from "react";
import { useStaykeProgram } from "./useStaykeProgram";
import { staykeClient } from "../../client/staykeClient";
import { DisputeReason } from "../../generated/stayke/types";

/**
 * Hook to manage disputes on-chain.
 */
export const useDispute = () => {
  const { signer } = useStaykeProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDispute = async (
    userProfilePda: string,
    bookingPda: string,
    reason: DisputeReason
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.openDispute(
        signer,
        userProfilePda,
        bookingPda,
        reason
      );
      console.log("Open dispute success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Open dispute error:", err);
      const message = err instanceof Error ? err.message : "Failed to open dispute";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (
    bookingPda: string,
    hostShareBps: number,
    rejected: boolean,
    escrowTokenAccount: string,
    hostTokenAccount: string,
    guestTokenAccount: string,
    usdcMint: string
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.resolveDispute(
        signer,
        bookingPda,
        hostShareBps,
        rejected,
        escrowTokenAccount,
        hostTokenAccount,
        guestTokenAccount,
        usdcMint
      );
      console.log("Resolve dispute success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Resolve dispute error:", err);
      const message = err instanceof Error ? err.message : "Failed to resolve dispute";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const closeDispute = async (
    bookingPda: string,
    hostProfilePda: string,
    guestProfilePda: string,
    propertyPda: string
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.closeDispute(
        signer,
        bookingPda,
        hostProfilePda,
        guestProfilePda,
        propertyPda
      );
      console.log("Close dispute success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Close dispute error:", err);
      const message = err instanceof Error ? err.message : "Failed to close dispute";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { openDispute, resolveDispute, closeDispute, loading, error };
};
