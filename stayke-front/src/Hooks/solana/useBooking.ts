"use client";

import { useState } from "react";
import { useStaykeProgram } from "./useStaykeProgram";
import { staykeClient } from "../../client/staykeClient";

/**
 * Hook to manage booking lifecycle on-chain.
 */
export const useBooking = () => {
  const { signer } = useStaykeProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (
    clientProfilePda: string,
    propertyPda: string,
    hostProfilePda: string,
    checkIn: number | bigint,
    checkOut: number | bigint
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.createBooking(
        signer,
        clientProfilePda,
        propertyPda,
        hostProfilePda,
        checkIn,
        checkOut
      );
      console.log("Create booking success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Create booking error:", err);
      const message = err instanceof Error ? err.message : "Failed to create booking";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hostAccept = async (hostProfilePda: string, bookingPda: string) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.hostAcceptBooking(signer, hostProfilePda, bookingPda);
      console.log("Host accept success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Host accept error:", err);
      const message = err instanceof Error ? err.message : "Failed to accept booking";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hostReject = async (
    hostProfilePda: string,
    guestPubkey: string,
    bookingPda: string,
    propertyPda: string,
    checkIn: number | bigint
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.hostRejectBooking(
        signer,
        hostProfilePda,
        guestPubkey,
        bookingPda,
        propertyPda,
        checkIn
      );
      console.log("Host reject success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Host reject error:", err);
      const message = err instanceof Error ? err.message : "Failed to reject booking";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const activateBooking = async (
    clientProfilePda: string,
    propertyPda: string,
    bookingPda: string,
    usdcMint: string,
    clientTokenAccount: string
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.acceptReserve(
        signer,
        clientProfilePda,
        propertyPda,
        bookingPda,
        usdcMint,
        clientTokenAccount
      );
      console.log("Activate booking success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Activate booking error:", err);
      const message = err instanceof Error ? err.message : "Failed to activate booking";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeStay = async (
    clientProfilePda: string,
    hostProfilePda: string,
    propertyPda: string,
    bookingPda: string,
    hostTokenAccount: string,
    usdcMint: string
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.completeStay(
        signer,
        clientProfilePda,
        hostProfilePda,
        propertyPda,
        bookingPda,
        hostTokenAccount,
        usdcMint
      );
      console.log("Complete stay success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Complete stay error:", err);
      const message = err instanceof Error ? err.message : "Failed to complete stay";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const closeBooking = async (
    clientProfilePda: string,
    hostProfilePda: string,
    propertyPda: string,
    bookingPda: string,
    score: number
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.closeBooking(
        signer,
        clientProfilePda,
        hostProfilePda,
        propertyPda,
        bookingPda,
        score
      );
      console.log("Close booking success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Close booking error:", err);
      const message = err instanceof Error ? err.message : "Failed to close booking";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clientReject = async (
    clientProfilePda: string,
    propertyPda: string,
    bookingPda: string,
    checkIn: number | bigint
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.clientRejectReserve(
        signer,
        clientProfilePda,
        propertyPda,
        bookingPda,
        checkIn
      );
      console.log("Client reject success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Client reject error:", err);
      const message = err instanceof Error ? err.message : "Failed to reject reserve or booking";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBooking,
    hostAccept,
    hostReject,
    activateBooking,
    completeStay,
    closeBooking,
    clientReject,
    loading,
    error,
  };
};
