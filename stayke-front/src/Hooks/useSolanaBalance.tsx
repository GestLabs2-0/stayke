"use client";

import { useEffect, useState } from "react";

export const useSolBalance = (address: string) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      setLoading(true);
      try {
        // Devnet RPC
        const res = await fetch("https://api.devnet.solana.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getBalance",
            params: [address],
          }),
        });

        const data = await res.json();
        // El balance viene en lamports → dividir por 1_000_000_000 para SOL
        const sol = data.result?.value / 1_000_000_000;
        setBalance(sol ?? 0);
      } catch {
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Refresca cada 30 segundos
    const interval = setInterval(fetchBalance, 30_000);
    return () => clearInterval(interval);
  }, [address]);

  return { balance, isLoading };
};
