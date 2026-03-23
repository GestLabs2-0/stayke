import crypto from "crypto";

/**
 * Hashes a DNI string using SHA-256 (deterministic).
 * This hash is used as a unique identifier and as seed for Solana PDA.
 * Returns a 32-byte hash as a hex string (64 chars).
 * @param dni The DNI string to hash.
 * @returns The SHA-256 hex hash.
 */
export const hashDni = (dni: string): string => {
  return crypto.createHash("sha256").update(dni).digest("hex");
};

/**
 * Converts a hex hash string to a Uint8Array (Buffer).
 * Useful for passing the hash as a seed [u8; 32] to Solana programs.
 * @param hexHash The 64-character hex string.
 * @returns A Buffer (implements Uint8Array) of 32 bytes.
 */
export const hexToU8Array = (hexHash: string): Buffer => {
  return Buffer.from(hexHash, "hex");
};
