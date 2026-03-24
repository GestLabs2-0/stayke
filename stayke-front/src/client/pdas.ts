import { 
  address, 
  getProgramDerivedAddress, 
  getAddressEncoder, 
  getU8Encoder, 
  getI64Encoder,
  getUtf8Encoder,
  type Address,
  type ProgramDerivedAddressBump
} from "@solana/kit";
import { PROGRAM_ID } from "./codama";

const programId = address(PROGRAM_ID);

export async function getPdaConfig() {
  return await getProgramDerivedAddress({
    seeds: [getUtf8Encoder().encode("config")],
    programAddress: programId,
  });
}

export async function getPdaTreasury() {
  return await getProgramDerivedAddress({
    seeds: [getUtf8Encoder().encode("treasury")],
    programAddress: programId,
  });
}

export async function getPdaPlatformVault() {
  return await getProgramDerivedAddress({
    seeds: [getUtf8Encoder().encode("platform_vault")],
    programAddress: programId,
  });
}

export async function getPdaPlatformVaultToken() {
  return await getProgramDerivedAddress({
    seeds: [getUtf8Encoder().encode("platform_vault_token")],
    programAddress: programId,
  });
}

export async function getPdaTreasuryTokenAccount() {
  return await getProgramDerivedAddress({
    seeds: [getUtf8Encoder().encode("treasury_vault")],
    programAddress: programId,
  });
}

export async function getPdaUserProfile(dniHash: Uint8Array, owner: string): Promise<readonly [Address, ProgramDerivedAddressBump]> {
  return await getProgramDerivedAddress({
    seeds: [
      getUtf8Encoder().encode("user"),
      dniHash,
      getAddressEncoder().encode(address(owner)),
    ],
    programAddress: programId,
  });
}

export async function getPdaProperty(hostProfilePda: string, listingId: number) {
  return await getProgramDerivedAddress({
    seeds: [
      getUtf8Encoder().encode("property"),
      getAddressEncoder().encode(address(hostProfilePda)),
      getU8Encoder().encode(listingId),
    ],
    programAddress: programId,
  });
}

export async function getPdaBooking(propertyPda: string, guest: string, checkIn: bigint | number) {
  return await getProgramDerivedAddress({
    seeds: [
      getUtf8Encoder().encode("booking"),
      getAddressEncoder().encode(address(propertyPda)),
      getAddressEncoder().encode(address(guest)),
      getI64Encoder().encode(BigInt(checkIn)),
    ],
    programAddress: programId,
  });
}

export async function getPdaBookingDays(propertyPda: string, checkIn: bigint | number) {
  return await getProgramDerivedAddress({
    seeds: [
      getUtf8Encoder().encode("booking_days"),
      getAddressEncoder().encode(address(propertyPda)),
      getI64Encoder().encode(BigInt(checkIn)),
    ],
    programAddress: programId,
  });
}

export async function getPdaDispute(bookingPda: string) {
  return await getProgramDerivedAddress({
    seeds: [
      getUtf8Encoder().encode("dispute"),
      getAddressEncoder().encode(address(bookingPda)),
    ],
    programAddress: programId,
  });
}

export async function getPdaEscrow(bookingPda: string) {
  return await getProgramDerivedAddress({
    seeds: [
      getUtf8Encoder().encode("escrow"),
      getAddressEncoder().encode(address(bookingPda)),
    ],
    programAddress: programId,
  });
}
