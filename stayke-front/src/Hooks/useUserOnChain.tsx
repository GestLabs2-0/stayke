"use client";

import { useEffect, useState, useCallback } from "react";
import { rpc } from "../client/rpc";
import { address } from "@solana/kit";

/**
 * Hook to check if a user is registered on-chain using Solana Kit v2 RPC.
 */
export const useUserOnChain = (pdaKey: string | null | undefined) => {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isLoading, setLoading] = useState(false);

  const checkOnChain = useCallback(async () => {
    if (!pdaKey) {
      setIsRegistered(false);
      return;
    }

    setLoading(true);
    try {
      const res = await rpc.getAccountInfo(address(pdaKey)).send();
      setIsRegistered(!!res.value);
    } catch (error) {
      console.error("useUserOnChain error:", error);
      setIsRegistered(null);
    } finally {
      setLoading(false);
    }
  }, [pdaKey]);

  useEffect(() => {
    checkOnChain();
  }, [checkOnChain]);

  return { isRegistered, isLoading, refresh: checkOnChain };
};
