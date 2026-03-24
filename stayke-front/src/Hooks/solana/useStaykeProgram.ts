"use client";

import { useMemo } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { type TransactionModifyingSigner, type Address } from "@solana/kit";
import { rpc } from "../../client/rpc";
import { PROGRAM_ID } from "../../client/codama";

/**
 * Base hook to access the Stayke program context and the user's wallet signer.
 */
export const useStaykeProgram = () => {
  const { wallet, disconnect } = useWalletConnection();

  // Create a functional TransactionSigner that wraps the wallet session
  const signer: TransactionModifyingSigner | undefined = useMemo(() => {
    if (!wallet) return undefined;

    return {
      address: wallet.account.address as Address,
      async modifyAndSignTransactions(transactions) {
        if (!wallet.signTransaction) {
          throw new Error("Su wallet no admite la firma de transacciones");
        }
        
        type WalletTx = Parameters<NonNullable<typeof wallet.signTransaction>>[0];
        
        const signedTransactions = await Promise.all(
          transactions.map((tx) => wallet.signTransaction!(tx as unknown as WalletTx))
        );
        
        type ExpectedReturnType = Awaited<ReturnType<TransactionModifyingSigner["modifyAndSignTransactions"]>>;
        return signedTransactions as unknown as ExpectedReturnType;
      },
    };
  }, [wallet]);

  return {
    rpc,
    signer,
    wallet,
    programId: PROGRAM_ID,
    connected: !!wallet?.account,
    disconnect,
  };
};
