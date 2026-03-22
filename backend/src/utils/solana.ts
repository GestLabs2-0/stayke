/** Validates that a Solana base58 public key has the correct format. */
export function isValidSolanaPubkey(pubkey: string): boolean {
  // Solana pubkeys are base58-encoded 32-byte values — 32 to 44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(pubkey);
}
