
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { userAuthService } from "../services/userAuth";
import { dbService } from "../services/dbService";

interface UserAuthContextType {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const UserAuthContext = createContext<UserAuthContextType>({
  isAuthenticated: false,
  userId: null,
  username: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  loading: false
});

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState(userAuthService.getAuthState());
  const [loading, setLoading] = useState<boolean>(false);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  
  useEffect(() => {
    // Initialize the database
    const initDb = async () => {
      try {
        await dbService.init();
        setDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };
    
    initDb();
  }, []);
  
  useEffect(() => {
    const handleAuthChange = () => {
      setAuthState(userAuthService.getAuthState());
    };
    
    window.addEventListener("user-auth-change", handleAuthChange);
    
    return () => {
      window.removeEventListener("user-auth-change", handleAuthChange);
    };
  }, []);
  
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const success = await userAuthService.login(username, password);
      if (success) {
        setAuthState(userAuthService.getAuthState());
      }
      return success;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (username: string, password: string) => {
    setLoading(true);
    try {
      return await userAuthService.register(username, password);
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    userAuthService.logout();
    setAuthState(userAuthService.getAuthState());
  };
  
  const contextValue: UserAuthContextType = {
    ...authState,
    login,
    register,
    logout,
    loading
  };
  
  return (
    <UserAuthContext.Provider value={contextValue}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => useContext(UserAuthContext);
