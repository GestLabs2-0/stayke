export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  wallet: string;
  isHost: boolean;
  image?: string;
  reputation: number;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  address: string;
  wallet: string;
  isHost: boolean;
  roles: string[];
  image: File | null;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isRegistered: boolean;
  login: (
    address: string,
    signature: string,
    nonce: string
  ) => Promise<{ registered: boolean }>;
  registerUser: (data: RegisterPayload) => Promise<{ success: boolean }>;
  logout: () => void;
  setUser: (user: User) => void;
}
