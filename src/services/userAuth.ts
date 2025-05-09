
import { dbService } from './dbService';

interface UserAuthState {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
}

const USER_AUTH_KEY = "user_authenticated";
const USER_ID_KEY = "user_id";
const USER_NAME_KEY = "username";

export const userAuthService = {
  getAuthState(): UserAuthState {
    const isAuthenticated = localStorage.getItem(USER_AUTH_KEY) === "true";
    const userId = localStorage.getItem(USER_ID_KEY);
    const username = localStorage.getItem(USER_NAME_KEY);
    
    return {
      isAuthenticated,
      userId: userId ? parseInt(userId) : null,
      username
    };
  },

  async login(username: string, password: string): Promise<boolean> {
    try {
      const user = await dbService.getUserByUsername(username);
      
      if (user && user.password === password) { // In a real app, use proper password hashing
        localStorage.setItem(USER_AUTH_KEY, "true");
        localStorage.setItem(USER_ID_KEY, user.id.toString());
        localStorage.setItem(USER_NAME_KEY, user.username);
        window.dispatchEvent(new Event("user-auth-change"));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  },

  async register(username: string, password: string): Promise<boolean> {
    try {
      // Check if user already exists
      const existingUser = await dbService.getUserByUsername(username);
      if (existingUser) {
        return false;
      }
      
      // Create new user
      await dbService.createUser(username, password);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  },

  logout(): void {
    localStorage.removeItem(USER_AUTH_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    window.dispatchEvent(new Event("user-auth-change"));
  },
};
