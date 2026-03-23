"use client";

import { useEffect, useState } from "react";

const USDC_MINT = process.env.NEXT_PUBLIC_STAYKE_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/**
 * Hook to check the user's Mock USDC balance on Solana.
 * @param wallet The user's Solana wallet pubkey.
 */
export const useTokenBalance = (wallet: string | null | undefined) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!wallet) return;

    const fetchTokenBalance = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://api.devnet.solana.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccountsByOwner",
            params: [
              wallet,
              { mint: USDC_MINT },
              { encoding: "jsonParsed" },
            ],
          }),
        });

        const data = await res.json();
        const accounts = data.result?.value || [];

        if (accounts.length > 0) {
          const info = accounts[0].account.data.parsed.info;
          const amount = info.tokenAmount.uiAmount;
          setBalance(amount ?? 0);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error("useTokenBalance error:", error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenBalance();
    const interval = setInterval(fetchTokenBalance, 30_000);
    return () => clearInterval(interval);
  }, [wallet]);

  return { balance, isLoading };
};
