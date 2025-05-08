
import { createApiClient } from "./api";

const TOKEN_KEY = "mail_gw_token";
const ACCOUNT_ID_KEY = "mail_gw_account_id";
const ADDRESS_KEY = "mail_gw_address";

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  accountId: string | null;
  address: string | null;
}

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getAccountId(): string | null {
    return localStorage.getItem(ACCOUNT_ID_KEY);
  },

  getAddress(): string | null {
    return localStorage.getItem(ADDRESS_KEY);
  },

  getAuthState(): AuthState {
    const token = this.getToken();
    const accountId = this.getAccountId();
    const address = this.getAddress();

    return {
      isAuthenticated: Boolean(token && accountId),
      token,
      accountId,
      address,
    };
  },

  setAuthData(token: string, accountId: string, address: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ACCOUNT_ID_KEY, accountId);
    localStorage.setItem(ADDRESS_KEY, address);
    
    // Dispatch an event to notify subscribers
    window.dispatchEvent(new Event("auth-change"));
  },

  async login(address: string, password: string): Promise<void> {
    const api = createApiClient();
    const response = await api.login(address, password);
    this.setAuthData(response.token, response.id, address);
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCOUNT_ID_KEY);
    localStorage.removeItem(ADDRESS_KEY);
    
    // Dispatch an event to notify subscribers
    window.dispatchEvent(new Event("auth-change"));
  },
};
