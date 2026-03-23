export interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  wallet: string;
  isHost: boolean;
  image?: string;
  reputation: number;
  reviews?: Review[];
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
  login: (address: string) => Promise<{ registered: boolean }>;
  registerUser: (data: RegisterPayload) => Promise<{ success: boolean }>;
  logout: () => void;
  setUser: (user: User) => void;
}
