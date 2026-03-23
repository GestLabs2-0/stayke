// Respuesta genérica del backend
export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
  errors?: Record<string, string>;
}

// Entidad User (conforme al backend)
export interface BackendUser {
  id: string;
  wallet: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  pdaKey?: string;
  role: "CLIENT" | "HOST" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

// Payload para crear usuario
export interface CreateUserPayload {
  wallet: string;
  nombre: string;
  apellido: string;
  email?: string;
  phone?: string;
  address?: string;
  dni?: string;
  profileImage?: string;
  isHost?: boolean;
}

// Entidad Property (conforme al backend)
export interface BackendProperty {
  id: number;
  ownerWallet: string;
  pdaKey: string;
  title: string;
  description?: string;
  location: string;
  pricePerNight: number;
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE";
  createdAt: string;
  updatedAt: string;
}

// Payload para crear propiedad
export interface CreatePropertyPayload {
  ownerWallet: string;
  pdaKey: string;
  title: string;
  description?: string;
  location: string;
  pricePerNight: number;
}
