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
  const { signer } = useStaykeProgram();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const register = async (
    nombre: string,
    apellido: string,
    email: string,
    dni: string,
    dniHash: Uint8Array
  ) => {
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. On-chain registration
      const signature = await staykeClient.registerUser(signer, dniHash);
      console.log("On-chain registration success:", signature);

      // 2. Derive PDA to store it in the backend
      const [userProfilePda] = await getPdaUserProfile(dniHash, signer.address);
      const userProfilePdaStr = userProfilePda as string;


      // 3. Backend registration
      const backendUser: BackendUser = await userService.createUser({

        wallet: signer.address,
        nombre,
        apellido,
        email,
        dni,
        isHost: false,
        pdaKey: userProfilePdaStr,
      });


      // 4. Update local Auth context
      const userToSet: User = mapBackendUserToUser(backendUser);
      setUser(userToSet);

      return { signature, backendUser };
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to register user";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
};
