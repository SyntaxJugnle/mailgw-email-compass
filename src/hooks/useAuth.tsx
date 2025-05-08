
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { authService, AuthState } from "../services/auth";

interface AuthContextType extends AuthState {
  login: (address: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  accountId: null,
  address: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  
  useEffect(() => {
    const handleAuthChange = () => {
      setAuthState(authService.getAuthState());
    };
    
    window.addEventListener("auth-change", handleAuthChange);
    
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);
  
  const login = async (address: string, password: string) => {
    await authService.login(address, password);
    setAuthState(authService.getAuthState());
  };
  
  const logout = () => {
    authService.logout();
    setAuthState(authService.getAuthState());
  };
  
  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
