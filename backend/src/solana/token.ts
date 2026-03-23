import type { Signer } from "@solana/web3.js";

import { createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Connection, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

/**
 * Gets or creates the Associated Token Account (ATA) for a wallet and a specific mint.
 */
export const getATA = async (
  connection: Connection,
  payer: Signer,
  mint: PublicKey,
  owner: PublicKey
) => {
  return await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  );
};

/**
 * Helper to transfer SPL tokens between two wallets.
 * Useful for simulating rents, deposits, etc. from backend.
 */
export const transferSPL = async (
  connection: Connection,
  payer: Signer,
  mint: PublicKey,
  fromOwner: Signer,
  toOwner: PublicKey,
  amount: number
) => {
  const fromAta = await getATA(connection, payer, mint, fromOwner.publicKey);
  const toAta = await getATA(connection, payer, mint, toOwner);

  const transaction = new Transaction().add(
    createTransferInstruction(
      fromAta.address,
      toAta.address,
      fromOwner.publicKey,
      amount
    )
  );

  return await sendAndConfirmTransaction(connection, transaction, [payer, fromOwner]);
};
