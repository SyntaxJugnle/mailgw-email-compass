
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { adminAuthService } from "../services/adminAuth";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState(adminAuthService.getAuthState());
  
  useEffect(() => {
    const handleAuthChange = () => {
      setAuthState(adminAuthService.getAuthState());
    };
    
    window.addEventListener("admin-auth-change", handleAuthChange);
    
    return () => {
      window.removeEventListener("admin-auth-change", handleAuthChange);
    };
  }, []);
  
  const login = (username: string, password: string) => {
    return adminAuthService.login(username, password);
  };
  
  const logout = () => {
    adminAuthService.logout();
  };
  
  const contextValue: AdminAuthContextType = {
    ...authState,
    login,
    logout,
  };
  
  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
