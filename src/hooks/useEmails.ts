
import { useState, useEffect, useRef, useCallback } from "react";
import { createApiClient, Email, EmailResponse } from "../services/api";
import { authService } from "../services/auth";
import { toast } from "sonner";

export const useEmails = (autoRefresh = true, refreshInterval = 30000) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  
  // Clean up function for the refresh timer
  const cleanupTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };
  
  // Fetch emails
  const fetchEmails = useCallback(async (showLoading = true) => {
    const { token } = authService.getAuthState();
    
    if (!token) {
      setError("Not authenticated");
      return;
    }
    
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    
    try {
      const api = createApiClient(token);
      const data = await api.getEmails();
      setEmails(data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err) {
      console.error("Error fetching emails:", err);
      setError("Failed to load emails");
      // If this was an auto-refresh, don't show toast
      if (showLoading) {
        toast.error("Failed to load emails");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  // Get a specific email by ID
  const getEmail = useCallback(async (id: string) => {
    const { token } = authService.getAuthState();
    
    if (!token) {
      setError("Not authenticated");
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const api = createApiClient(token);
      const email = await api.getEmail(id);
      setSelectedEmail(email);
      
      // Mark as read if it's not already read
      if (!email.seen) {
        await api.markAsRead(id);
        
        // Update the emails list to mark this one as read
        setEmails(prev => 
          prev.map(e => 
            e.id === id 
              ? { ...e, isRead: true } 
              : e
          )
        );
      }
      
      return email;
    } catch (err) {
      console.error("Error fetching email:", err);
      setError("Failed to load email content");
      toast.error("Failed to load email content");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Delete an email
  const deleteEmail = useCallback(async (id: string) => {
    const { token } = authService.getAuthState();
    
    if (!token) {
      setError("Not authenticated");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const api = createApiClient(token);
      await api.deleteEmail(id);
      
      // Remove the email from the list
      setEmails(prev => prev.filter(email => email.id !== id));
      
      // If this was the selected email, clear it
      if (selectedEmail && selectedEmail.id === id) {
        setSelectedEmail(null);
      }
      
      toast.success("Email deleted");
      return true;
    } catch (err) {
      console.error("Error deleting email:", err);
      setError("Failed to delete email");
      toast.error("Failed to delete email");
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedEmail]);
  
  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      fetchEmails(true);
      
      // Set up interval for auto-refresh
      refreshTimerRef.current = window.setInterval(() => {
        fetchEmails(false);
      }, refreshInterval);
    } else {
      fetchEmails(true);
    }
    
    // Cleanup function
    return () => {
      cleanupTimer();
    };
  }, [autoRefresh, fetchEmails, refreshInterval]);
  
  // Manual refresh
  const refreshEmails = () => {
    return fetchEmails(false);
  };
  
  return {
    emails,
    loading,
    refreshing,
    error,
    selectedEmail,
    getEmail,
    deleteEmail,
    refreshEmails,
    setSelectedEmail
  };
};
