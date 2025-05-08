
import { useState } from "react";
import { createApiClient, Account, CreateAccountRequest } from "../services/api";
import { authService } from "../services/auth";
import { toast } from "sonner";

export const useAccounts = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const createAccount = async (data: CreateAccountRequest): Promise<Account | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const api = createApiClient();
      const account = await api.createAccount(data);
      
      // Auto login with the new account
      try {
        await authService.login(data.address, data.password);
        toast.success("Account created and logged in successfully!");
      } catch (loginError) {
        console.error("Auto-login after account creation failed:", loginError);
        toast.error("Account created, but login failed. Please login manually.");
      }
      
      return account;
    } catch (err) {
      console.error("Error creating account:", err);
      setError("Failed to create account. The address may already be taken.");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteAccount = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    const { token, accountId } = authService.getAuthState();
    
    if (!token || !accountId) {
      setError("You must be logged in to delete an account");
      setLoading(false);
      return false;
    }
    
    try {
      const api = createApiClient(token);
      await api.deleteAccount(accountId);
      
      // Logout after account deletion
      authService.logout();
      toast.success("Account deleted successfully");
      return true;
    } catch (err) {
      console.error("Error deleting account:", err);
      setError("Failed to delete account");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const getCurrentAccount = async (): Promise<Account | null> => {
    const { token, accountId } = authService.getAuthState();
    
    if (!token || !accountId) {
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const api = createApiClient(token);
      const account = await api.getAccount(accountId);
      return account;
    } catch (err) {
      console.error("Error getting account details:", err);
      setError("Failed to load account details");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    createAccount,
    deleteAccount,
    getCurrentAccount
  };
};
