import { address } from "@solana/kit";
import { rpc } from "./rpc";
import { getPdaConfig } from "./pdas";
import {
  fetchUserProfile,
  fetchProperty,
  fetchBooking,
  fetchPlatformConfig,
  fetchDispute,
} from "../generated/stayke";

export async function fetchUserProfileAccount(pda: string) {
  return await fetchUserProfile(rpc, address(pda));
}

export async function fetchPropertyAccount(pda: string) {
  return await fetchProperty(rpc, address(pda));
}

export async function fetchBookingAccount(pda: string) {
  return await fetchBooking(rpc, address(pda));
}

export async function fetchConfigAccount() {
  const pda = await getPdaConfig();
  return await fetchPlatformConfig(rpc, pda[0]);
}

export async function fetchDisputeAccount(pda: string) {
  return await fetchDispute(rpc, address(pda));
}
