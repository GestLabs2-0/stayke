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

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockLogin = async (
  address: string,
  signature: string,
  nonce: string
): Promise<{ registered: boolean; user?: User }> => {
  await new Promise((r) => setTimeout(r, 600));
  console.log("[mock] login →", { address, signature, nonce });

  // TODO: reemplazar por:
  // const res = await fetch("/api/auth/verify", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ wallet: address, signature, nonce }),
  // });
  // return res.json();

  // Cambia a `return { registered: false }` para probar flujo de registro
  // return { registered: false };
  return {
    registered: true,
    user: {
      id: "mock-001",
      firstName: "Alberto",
      lastName: "Az",
      email: "alberto@stayke.io",
      phone: "+1 (555) 000-0000",
      wallet: address,
      isHost: true,
      reputation: 4.8,
      reviews: [
        {
          id: "r1",
          author: "Sarah K.",
          rating: 5,
          comment:
            "Amazing host! The property was exactly as described and Alberto was super responsive throughout the stay.",
          date: "Mar 2026",
        },
        {
          id: "r2",
          author: "James R.",
          rating: 5,
          comment:
            "Incredible experience. Clean, well-equipped, and the location was perfect. Would definitely book again.",
          date: "Feb 2026",
        },
        {
          id: "r3",
          author: "Mia L.",
          rating: 4,
          comment:
            "Great stay overall. The host was kind and the check-in was seamless.",
          date: "Jan 2026",
        },
      ],
    },
  };
};

const mockRegister = async (
  data: RegisterPayload
): Promise<{ success: boolean; user?: User }> => {
  await new Promise((r) => setTimeout(r, 800));
  console.log("[mock] register →", data);

  // TODO: reemplazar por:
  // const res = await fetch("/api/auth/register", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // return res.json();

  return {
    success: true,
    user: {
      id: "mock-002",
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      wallet: data.wallet,
      isHost: data.isHost,
      reputation: 0,
    },
  };
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { wallet } = useWalletConnection();

  const login = async (address: string, signature: string, nonce: string) => {
    setIsLoading(true);
    try {
      const data = await mockLogin(address, signature, nonce);
      if (data.registered && data.user) setUserState(data.user);
      return { registered: data.registered };
    } catch {
      return { registered: false };
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      const result = await mockRegister(data);
      if (result.success && result.user) setUserState(result.user);
      return { success: result.success };
    } catch {
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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
