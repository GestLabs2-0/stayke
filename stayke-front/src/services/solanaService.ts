import { API_CONFIG } from "../constants/api";
import { apiService } from "./apiService";

/**
 * Service to handle Solana-specific backend interactions.
 */
class SolanaService {
  /**
   * Request the backend to initialize/check a user's ATA for Mock USDC.
   */
  async initATA(wallet: string) {
    return apiService.post<{ mint: string; wallet: string }>(
      API_CONFIG.ENDPOINTS.SOLANA_INIT_ATA,
      { wallet }
    );
  }

  /**
   * Request the backend to simulate an SPL token transfer.
   */
  async transferToken(from: string, to: string, amount: number) {
    return apiService.post<{ from: string; to: string; transaction: string }>(
      API_CONFIG.ENDPOINTS.SOLANA_TRANSFER_TOKEN,
      { amount, from, to }
    );
  }
}

export const solanaService = new SolanaService();
