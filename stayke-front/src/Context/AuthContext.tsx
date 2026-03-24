"use client";

//Library
import { useWalletConnection } from "@solana/react-hooks";
//React
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
//Type
import type {
  User,
  AuthContextType,
  RegisterPayload,
} from "../types/AuthContex";

const AuthContext = createContext<AuthContextType | null>(null);

import { userService } from "../services/userService";
import { mapBackendUserToUser } from "../helpers/mapUser";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { wallet } = useWalletConnection();

  const login = async (address: string) => {
    setIsLoading(true);
    try {
      const { exists, user: backendUser } = await userService.getUserByWallet(address);
      if (exists && backendUser) {
        setUserState(mapBackendUserToUser(backendUser));
        return { registered: true };
      }
      return { registered: false };
    } catch (error) {
      console.error("[login] Error verificado wallet:", error);
      return { registered: false };
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      const backendUser = await userService.createUser({
        wallet: data.wallet,
        nombre: data.firstName,
        apellido: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        dni: data.dni,
        profileImage: data.image,
        isHost: data.isHost,
      });
      setUserState(mapBackendUserToUser(backendUser));
      return { success: true };
    } catch (error) {
      console.error("[register] Error creando usuario:", error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => setUserState(null);
  const setUser = (u: User) => setUserState(u);

  // Cuando la wallet se desconecta → cierra sesión automáticamente
  useEffect(() => {
    const address = wallet?.account?.address?.toString();
    if (!address) {
      setUserState(null);
    }
  }, [wallet?.account?.address]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isRegistered: !!user,
        login,
        registerUser,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
