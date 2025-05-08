
interface AdminAuthState {
  isAuthenticated: boolean;
}

// Fixed admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Kacper11!";
const ADMIN_AUTH_KEY = "admin_authenticated";

export const adminAuthService = {
  getAuthState(): AdminAuthState {
    const isAuthenticated = localStorage.getItem(ADMIN_AUTH_KEY) === "true";
    return { isAuthenticated };
  },

  login(username: string, password: string): boolean {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
      window.dispatchEvent(new Event("admin-auth-change"));
      return true;
    }
    return false;
  },

  logout(): void {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    window.dispatchEvent(new Event("admin-auth-change"));
  },
};
