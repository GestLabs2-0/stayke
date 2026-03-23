import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
  type Address,
} from "@solana/kit";
import { STAYKE_PROGRAM_ADDRESS } from "../generated/stayke";

export const DEVNET_ENDPOINT = "https://api.devnet.solana.com";

/**
 * Crea las instancias de RPC para interactuar con Solana (v2 Client)
 */
export function createStaykeClient(endpoint: string = DEVNET_ENDPOINT) {
  const rpc = createSolanaRpc(endpoint);
  const rpcSubscriptions = createSolanaRpcSubscriptions(
    endpoint.replace("https", "wss").replace("http", "ws")
  );

  return { rpc, rpcSubscriptions };
}

// ==========================================
// Helpers de derivación de PDAs (Seeds)
// Basado en los recientes cambios del programa
// ==========================================

/**
 * Deriva el PDA de UserProfile.
 * Seeds: [b"user", dni_hash.as_ref(), owner.key().as_ref()]
 */
export async function getUserProfilePda(
  dniHash: Uint8Array,
  ownerAddress: Address
): Promise<[Address, number]> {
  return await getProgramDerivedAddress({
    programAddress: STAYKE_PROGRAM_ADDRESS,
    seeds: [
      new Uint8Array(Buffer.from("user")),
      dniHash,
      getAddressEncoder().encode(ownerAddress),
    ],
  });
}

/**
 * Deriva el PDA de Property.
 * Seeds: [b"property", title_hash.as_ref(), host.key().as_ref()]
 * (Asegúrate de ajustar los seeds si el contrato los define diferente)
 */
export async function getPropertyPda(
  titleHash: Uint8Array,
  hostAddress: Address
): Promise<[Address, number]> {
  return await getProgramDerivedAddress({
    programAddress: STAYKE_PROGRAM_ADDRESS,
    seeds: [
      new Uint8Array(Buffer.from("property")),
      titleHash,
      getAddressEncoder().encode(hostAddress),
    ],
  });
}

/**
 * Deriva el PDA de Booking.
 * Seeds: [b"booking", property.as_ref(), guest.as_ref(), check_in.to_le_bytes().as_ref()]
 */
export async function getBookingPda(
  propertyAddress: Address,
  guestAddress: Address,
  checkIn: bigint
): Promise<[Address, number]> {
  return await getProgramDerivedAddress({
    programAddress: STAYKE_PROGRAM_ADDRESS,
    seeds: [
      new Uint8Array(Buffer.from("booking")),
      getAddressEncoder().encode(propertyAddress),
      getAddressEncoder().encode(guestAddress),
      getU64Encoder().encode(checkIn),
    ],
  });
}

/**
 * Deriva el PDA de Dispute.
 * Seeds: [b"dispute", booking.as_ref()]
 */
export async function getDisputePda(
  bookingAddress: Address
): Promise<[Address, number]> {
  return await getProgramDerivedAddress({
    programAddress: STAYKE_PROGRAM_ADDRESS,
    seeds: [
      new Uint8Array(Buffer.from("dispute")),
      getAddressEncoder().encode(bookingAddress),
    ],
  });
}

// Re-exportamos todo lo generado por Codama para fácil acceso en el frontend
export * from "../generated/stayke";
