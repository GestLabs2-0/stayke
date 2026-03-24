/**
 * Hashes a string using SHA-256 and returns a Uint8Array.
 * Suitable for DNI hashing in Solana.
 */
export const hashString = async (input: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
};
