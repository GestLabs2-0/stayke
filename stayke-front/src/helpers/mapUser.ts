import type { BackendUser } from "@/src/types/api";
import type { User } from "@/src/types/AuthContex";

/**
 * Adapta el modelo de usuario del backend al modelo usado en el AuthContext.
 */
export const mapBackendUserToUser = (backendUser: BackendUser): User => ({
  id: backendUser.id,
  firstName: backendUser.nombre,
  lastName: backendUser.apellido,
  email: backendUser.email,
  wallet: backendUser.wallet,
  isHost: backendUser.role === "HOST" || backendUser.role === "ADMIN",
  reputation: 0, // Campo futuro
  reviews: [],   // Campo futuro
  phone: backendUser.phone,
  image: backendUser.profileImage,
  pdaKey: backendUser.pdaKey,
});
