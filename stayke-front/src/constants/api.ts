export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030",
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),
  ENDPOINTS: {
    // Usuarios
    USERS: "/api-v1/users",
    USER_BY_WALLET: (wallet: string) => `/api-v1/users/${wallet}`,
    ADMIN_USER: "/api-v1/users/admin",

    // Propiedades
    PROPERTIES: "/api-v1/properties",
    PROPERTIES_BY_WALLET: (wallet: string) => `/api-v1/properties/${wallet}`,
    PROPERTY_BY_ID: (id: string | number) => `/api-v1/properties/${id}`,

    // Solana
    SOLANA_INIT_ATA: "/api-v1/solana/init-ata",
    SOLANA_TRANSFER_TOKEN: "/api-v1/solana/transfer-token",
  },
} as const;
