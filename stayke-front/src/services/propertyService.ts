import { apiService } from "./apiService";
import { API_CONFIG } from "@/src/constants/api";
import type {
  BackendProperty,
  CreatePropertyPayload,
} from "@/src/types/api";

class PropertyService {
  /**
   * Lista todas las propiedades disponibles.
   * GET /api-v1/properties
   */
  async listAllProperties(): Promise<BackendProperty[]> {
    const res = await apiService.get<BackendProperty[]>(
      API_CONFIG.ENDPOINTS.PROPERTIES
    );
    return res.data;
  }

  /**
   * Lista propiedades de un usuario específico.
   * GET /api-v1/properties/user/:wallet
   */
  async listPropertiesByUser(wallet: string): Promise<BackendProperty[]> {
    const res = await apiService.get<BackendProperty[]>(
      API_CONFIG.ENDPOINTS.PROPERTIES_BY_WALLET(wallet)
    );
    return res.data;
  }

  /**
   * Registra una nueva propiedad off-chain.
   * POST /api-v1/properties
   */
  async createProperty(
    payload: CreatePropertyPayload
  ): Promise<BackendProperty> {
    const res = await apiService.post<BackendProperty>(
      API_CONFIG.ENDPOINTS.PROPERTIES,
      payload
    );
    return res.data;
  }

  /**
   * Actualiza una propiedad (solo si estado es AVAILABLE).
   * PUT /api-v1/properties/:id
   */
  async updateProperty(
    id: number,
    requesterWallet: string,
    updates: Partial<CreatePropertyPayload>
  ): Promise<BackendProperty> {
    const res = await apiService.put<BackendProperty>(
      API_CONFIG.ENDPOINTS.PROPERTY_BY_ID(id),
      { requesterWallet, ...updates }
    );
    return res.data;
  }

  /**
   * Elimina una propiedad (solo si estado es AVAILABLE).
   * DELETE /api-v1/properties/:id
   */
  async deleteProperty(
    id: number,
    requesterWallet: string
  ): Promise<void> {
    await apiService.delete(API_CONFIG.ENDPOINTS.PROPERTY_BY_ID(id), {
      requesterWallet,
    });
  }
}

export const propertyService = new PropertyService();
