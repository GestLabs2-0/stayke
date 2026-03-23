"use client";

import { useEffect, useState } from "react";

/**
 * Hook to check if a user is registered on-chain.
 * Uses the pdaKey from the database to look for the account on devnet.
 */
export const useUserOnChain = (pdaKey: string | null | undefined) => {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!pdaKey) {
      setIsRegistered(false);
      return;
    }

    const checkOnChain = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://api.devnet.solana.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getAccountInfo",
            params: [pdaKey, { encoding: "base64" }],
          }),
        });

        const data = await res.json();
        setIsRegistered(!!data.result?.value);
      } catch (error) {
        console.error("useUserOnChain error:", error);
        setIsRegistered(null);
      } finally {
        setLoading(false);
      }
    };

    checkOnChain();
  }, [pdaKey]);

  return { isRegistered, isLoading };
};
