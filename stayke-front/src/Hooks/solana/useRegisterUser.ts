"use client";

import { useState } from "react";
import { useStaykeProgram } from "./useStaykeProgram";
import { staykeClient } from "../../client/staykeClient";
import { userService } from "../../services/userService";
import { getPdaUserProfile } from "../../client/pdas";
import { useAuth } from "../../Context/AuthContext";
import { mapBackendUserToUser } from "../../helpers/mapUser";
import type { BackendUser } from "../../types/api";
import type { User } from "../../types/AuthContex";

/**
 * Hook to handle user registration both on-chain and on the backend.
 */
export const useRegisterUser = () => {
  const { signer, wallet } = useStaykeProgram();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const register = async (
    nombre: string,
    apellido: string,
    email: string,
    dni: string,
    dniHash: Uint8Array,
    isHost: boolean = false
  ) => {
    if (!signer || !wallet) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!wallet.signMessage) {
        throw new Error("Su wallet no soporta la firma de mensajes");
      }

      const { getBase58Decoder } = await import("@solana/kit");
      const base58 = getBase58Decoder();

      // 1. Sign message to prove ownership of the active session
      const message = `Welcome to Stayke! Please sign this message to register your account: ${signer.address}`;
      const messageBytes = new TextEncoder().encode(message);

      // We use the wallet session to sign the message
      const signatureMessage = await wallet.signMessage(messageBytes);
      const signatureBase58 = base58.decode(signatureMessage);

      // 2. Derive PDA (needed for backend)
      const [userProfilePda] = await getPdaUserProfile(dniHash, signer.address);
      const userProfilePdaStr = userProfilePda as string;

      // 3. Backend registration (calls DB)
      const backendUser: BackendUser = await userService.createUser({
        wallet: signer.address,
        nombre,
        apellido,
        email,
        dni,
        isHost,
        pdaKey: userProfilePdaStr,
        signature: signatureBase58,
        message,
      });
      console.log("Backend registration success:", backendUser);

      // 4. On-chain registration
      const signature = await staykeClient.registerUser(signer, dniHash);
      console.log("On-chain registration success:", signature);

      // 5. Update local Auth context
      const userToSet: User = mapBackendUserToUser(backendUser);
      setUser(userToSet);

      return { signature, backendUser };
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to register user";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
};
