"use client";

import { useState } from "react";
import { useStaykeProgram } from "./useStaykeProgram";
import { staykeClient } from "../../client/staykeClient";

/**
 * Hook to manage property registration and updates on the blockchain.
 */
export const useProperty = () => {
  const { signer } = useStaykeProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishProperty = async (
    userProfilePda: string,
    listingId: number,
    pricePerNight: number | bigint
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.publishProperty(
        signer,
        userProfilePda,
        listingId,
        pricePerNight
      );
      console.log("Publish property success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Publish property error:", err);
      const message = err instanceof Error ? err.message : "Failed to publish property";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (
    userProfilePda: string,
    propertyPda: string,
    newPricePerNight: number | bigint
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signature = await staykeClient.updatePropertyPrice(
        signer,
        userProfilePda,
        propertyPda,
        newPricePerNight
      );
      console.log("Update price success:", signature);
      return signature;
    } catch (err: unknown) {
      console.error("Update price error:", err);
      const message = err instanceof Error ? err.message : "Failed to update property price";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { publishProperty, updatePrice, loading, error };
};
