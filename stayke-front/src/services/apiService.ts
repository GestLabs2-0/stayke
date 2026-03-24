import { API_CONFIG } from "@/src/constants/api";
import type { ApiResponse } from "@/src/types/api";

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      let errorMsg =
        errorData.message || `HTTP error! status: ${response.status}`;

      // Si hay errores de validación específicos (como en la imagen del error)
      if (errorData.errors) {
        const details = Object.entries(errorData.errors)
          .map(([field, msg]) => `• ${field}: ${msg}`)
          .join("\n");
        errorMsg += `\n${details}`;
      }

      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  }

  // Exponer métodos HTTP
  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "DELETE",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
}

export const apiService = new ApiService();
