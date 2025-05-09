
import { useState, useEffect, useRef, useCallback } from "react";
import { createApiClient, Email, EmailResponse } from "../services/api";
import { authService } from "../services/auth";
import { toast } from "sonner";

// Constants for request management - adjusting for stricter limits
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 10000; // 10 seconds
const MAX_REQUEST_INTERVAL = 60000; // 60 seconds (1 minute)
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests

export const useEmails = (autoRefresh = true, refreshInterval = 120000) => { // 2 minutes refresh interval
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<boolean>(false);
  const refreshTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const lastRequestTimeRef = useRef<number>(0);
  const failedRequestsRef = useRef<number>(0);
  
  // Clean up function for the refresh timer
  const cleanupTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };
  
  // Calculate backoff time based on retry attempts
  const getBackoffTime = () => {
    const backoff = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
      MAX_REQUEST_INTERVAL
    );
    return backoff + Math.random() * 2000; // Add more jitter (up to 2s)
  };
  
  // Check if enough time has passed since last request
  const canMakeRequest = () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    
    // If rate limited, use backoff timing
    if (rateLimited) {
      return timeSinceLastRequest >= getBackoffTime();
    }
    
    // More conservative timing - at least MIN_REQUEST_INTERVAL between requests
    return timeSinceLastRequest >= MIN_REQUEST_INTERVAL;
  };
  
  // Reset rate limiting state after a successful request
  const resetRateLimiting = useCallback(() => {
    retryCountRef.current = 0;
    failedRequestsRef.current = 0;
    setRateLimited(false);
  }, []);
  
  // Fetch emails
  const fetchEmails = useCallback(async (showLoading = true) => {
    const { token } = authService.getAuthState();
    
    if (!token) {
      setError("Not authenticated");
      return;
    }
    
    // Check if we can make a request based on time constraints
    if (!canMakeRequest()) {
      console.log("Request throttled, waiting before retrying...");
      return;
    }
    
    // Update last request time
    lastRequestTimeRef.current = Date.now();
    
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    
    try {
      const api = createApiClient(token);
      const data = await api.getEmails();
      
      // Reset retry counter on success
      resetRateLimiting();
      
      setEmails(data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err: any) {
      console.error("Error fetching emails:", err);
      
      // Increment failed request counter
      failedRequestsRef.current += 1;
      
      // Handle rate limiting specifically
      if (err.status === 429) {
        setRateLimited(true);
        retryCountRef.current += 1;
        
        const backoffTime = getBackoffTime();
        console.log(`Rate limited. Backing off for ${backoffTime/1000}s. Retry attempt: ${retryCountRef.current}`);
        
        if (retryCountRef.current <= MAX_RETRY_ATTEMPTS) {
          toast.warning(`Rate limited by Mail.gw. Will retry in ${Math.round(backoffTime/1000)}s`);
        } else {
          setError("Rate limited. Try again later.");
          toast.error("Too many requests. Please wait a few minutes before trying again.");
        }
      } else if (err.message && typeof err.message === 'string' && err.message.includes("CORS")) {
        setError("CORS error: Cannot access emails directly from browser");
        toast.error("Cannot access emails due to CORS restrictions");
      } else {
        setError("Failed to load emails");
        // If this was an auto-refresh, don't show toast
        if (showLoading) {
          toast.error("Failed to load emails");
        }
      }
      
      // If we've had multiple consecutive failures, increase backoff
      if (failedRequestsRef.current > 3) {
        setRateLimited(true);
        retryCountRef.current = Math.min(retryCountRef.current + 1, MAX_RETRY_ATTEMPTS);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resetRateLimiting]);
  
  // Get a specific email by ID
  const getEmail = useCallback(async (id: string) => {
    const { token } = authService.getAuthState();
    
    if (!token) {
      setError("Not authenticated");
      return null;
    }
    
    // Check if we can make a request based on time constraints
    if (!canMakeRequest()) {
      toast.warning("Too many requests. Please wait a moment before trying again.");
      return null;
    }
    
    // Update last request time
    lastRequestTimeRef.current = Date.now();
    
    setLoading(true);
    setError(null);
    
    try {
      const api = createApiClient(token);
      const email = await api.getEmail(id);
      setSelectedEmail(email);
      
      // Reset retry counter on success
      resetRateLimiting();
      
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
    } catch (err: any) {
      console.error("Error fetching email:", err);
      
      // Increment failed request counter
      failedRequestsRef.current += 1;
      
      // Handle rate limiting specifically
      if (err.status === 429) {
        setRateLimited(true);
        retryCountRef.current += 1;
        setError("Rate limited. Try again later.");
        toast.error("Too many requests. Please try again in a few minutes.");
      } else {
        setError("Failed to load email content");
        toast.error("Failed to load email content");
      }
      
      // If we've had multiple consecutive failures, increase backoff
      if (failedRequestsRef.current > 3) {
        setRateLimited(true);
        retryCountRef.current = Math.min(retryCountRef.current + 1, MAX_RETRY_ATTEMPTS);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [resetRateLimiting]);
  
  // Delete an email
  const deleteEmail = useCallback(async (id: string) => {
    const { token } = authService.getAuthState();
    
    if (!token) {
      setError("Not authenticated");
      return false;
    }
    
    // Check if we can make a request based on time constraints
    if (!canMakeRequest()) {
      toast.warning("Too many requests. Please wait a moment before trying again.");
      return false;
    }
    
    // Update last request time
    lastRequestTimeRef.current = Date.now();
    
    setLoading(true);
    setError(null);
    
    try {
      const api = createApiClient(token);
      await api.deleteEmail(id);
      
      // Reset retry counter on success
      resetRateLimiting();
      
      // Remove the email from the list
      setEmails(prev => prev.filter(email => email.id !== id));
      
      // If this was the selected email, clear it
      if (selectedEmail && selectedEmail.id === id) {
        setSelectedEmail(null);
      }
      
      toast.success("Email deleted");
      return true;
    } catch (err: any) {
      console.error("Error deleting email:", err);
      
      // Increment failed request counter
      failedRequestsRef.current += 1;
      
      // Handle rate limiting specifically
      if (err.status === 429) {
        setRateLimited(true);
        retryCountRef.current += 1;
        setError("Rate limited. Try again later.");
        toast.error("Too many requests. Please try again in a few minutes.");
      } else {
        setError("Failed to delete email");
        toast.error("Failed to delete email");
      }
      
      // If we've had multiple consecutive failures, increase backoff
      if (failedRequestsRef.current > 3) {
        setRateLimited(true);
        retryCountRef.current = Math.min(retryCountRef.current + 1, MAX_RETRY_ATTEMPTS);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedEmail, resetRateLimiting]);
  
  // Set up auto-refresh with respect to rate limiting and backoff
  useEffect(() => {
    // Clear any existing refresh timer
    cleanupTimer();
    
    if (autoRefresh) {
      // Initial fetch
      fetchEmails(true);
      
      // Set up interval for auto-refresh, with a smart interval that respects rate limiting
      refreshTimerRef.current = window.setInterval(() => {
        // Only try to fetch if we're not rate limited or if we've waited long enough
        if (canMakeRequest()) {
          fetchEmails(false);
        } else if (rateLimited) {
          console.log("Still rate limited, skipping auto-refresh");
        }
      }, refreshInterval);
    }
    
    // Cleanup function
    return () => {
      cleanupTimer();
    };
  }, [autoRefresh, fetchEmails, refreshInterval, rateLimited]);
  
  // Manual refresh with rate limiting protection
  const refreshEmails = () => {
    if (rateLimited && !canMakeRequest()) {
      const backoffTime = getBackoffTime();
      toast.warning(`Rate limited. Please wait ${Math.round(backoffTime/1000)} seconds before refreshing.`);
      return;
    }
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
    setSelectedEmail,
    rateLimited
  };
};
