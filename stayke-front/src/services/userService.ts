import { apiService } from "./apiService";
import { API_CONFIG } from "@/src/constants/api";
import type {
  BackendUser,
  CreateUserPayload,
} from "@/src/types/api";

class UserService {
  /**
   * Verifica si un usuario ya está registrado por su wallet.
   * GET /api/v1/users/:wallet
   */
  async getUserByWallet(
    wallet: string
  ): Promise<{ exists: boolean; user?: BackendUser }> {
    const res = await apiService.get<{ exists: boolean; user?: BackendUser }>(
      API_CONFIG.ENDPOINTS.USER_BY_WALLET(wallet)
    );
    const data: { exists: boolean; user?: BackendUser } = res.data;
    return data;
  }

  /**
   * Registra un nuevo usuario.
   * POST /api-v1/users
   */
  async createUser(payload: CreateUserPayload): Promise<BackendUser> {
    const res = await apiService.post<BackendUser>(
      API_CONFIG.ENDPOINTS.USERS,
      payload
    );
    const user: BackendUser = res.data;
    return user;
  }

  /**
   * Actualiza los datos del usuario (parcial).
   * PUT /api-v1/users/:wallet
   */
  async updateUser(
    wallet: string,
    requesterWallet: string,
    updates: Partial<CreateUserPayload>
  ): Promise<BackendUser> {
    const res = await apiService.put<BackendUser>(
      API_CONFIG.ENDPOINTS.USER_BY_WALLET(wallet),
      { requesterWallet, ...updates }
    );
    return res.data;
  }

  /**
   * Lista todos los usuarios (uso administrativo).
   * GET /api-v1/users
   */
  async listAllUsers(): Promise<BackendUser[]> {
    const res = await apiService.get<BackendUser[]>(API_CONFIG.ENDPOINTS.USERS);
    return res.data;
  }
}

export const userService = new UserService();
