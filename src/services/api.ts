
import { toast } from "sonner";

// Base URL for all API calls
const API_BASE_URL = "https://api.mail.gw";

// Types for API responses
export interface Account {
  id: string;
  address: string;
  quota: number;
  used: number;
  isDisabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountResponse {
  "@context": string;
  "@id": string;
  "@type": string;
  id: string;
  address: string;
  quota: number;
  used: number;
  isDisabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountsListResponse {
  "@context": string;
  "@id": string;
  "@type": string;
  "hydra:totalItems": number;
  "hydra:member": AccountResponse[];
}

export interface CreateAccountRequest {
  address: string;
  password: string;
}

export interface AuthTokenResponse {
  token: string;
  id: string;
}

export interface Email {
  id: string;
  from: {
    address: string;
    name: string;
  };
  to: {
    address: string;
    name: string;
  }[];
  subject: string;
  intro: string;
  isRead: boolean;
  hasAttachments: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailResponse {
  "@context": string;
  "@id": string;
  "@type": string;
  id: string;
  accountId: string;
  msgid: string;
  from: {
    name: string;
    address: string;
  };
  to: {
    name: string;
    address: string;
  }[];
  cc: any[];
  bcc: any[];
  subject: string;
  seen: boolean;
  flagged: boolean;
  isDeleted: boolean;
  retention: boolean;
  retentionDate: string;
  text: string | null;
  html: string[] | null;
  intro?: string; // Added based on API docs
  hasAttachments: boolean;
  attachments: any[];
  size: number;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailsListResponse {
  "@context": string;
  "@id": string;
  "@type": string;
  "hydra:totalItems": number;
  "hydra:member": EmailResponse[];
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: response.statusText,
    };

    try {
      const errorBody = await response.json();
      error.details = errorBody;
    } catch (e) {
      // Ignore parsing errors
    }

    throw error;
  }

  return await response.json() as T;
}

// API client factory that includes auth token
export const createApiClient = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return {
    // Auth endpoints
    async login(address: string, password: string): Promise<AuthTokenResponse> {
      try {
        const response = await fetch(`${API_BASE_URL}/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address, password }),
        });
        
        return handleResponse<AuthTokenResponse>(response);
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },

    // Account endpoints
    async createAccount(data: CreateAccountRequest): Promise<Account> {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts`, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        const account = await handleResponse<AccountResponse>(response);
        return {
          id: account.id,
          address: account.address,
          quota: account.quota,
          used: account.used,
          isDisabled: account.isDisabled,
          isDeleted: account.isDeleted,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        };
      } catch (error) {
        console.error("Create account error:", error);
        toast.error("Failed to create account");
        throw error;
      }
    },

    async deleteAccount(id: string): Promise<void> {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          throw await handleResponse(response);
        }
      } catch (error) {
        console.error("Delete account error:", error);
        toast.error("Failed to delete account");
        throw error;
      }
    },

    async getAccount(id: string): Promise<Account> {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
          headers,
        });

        const account = await handleResponse<AccountResponse>(response);
        return {
          id: account.id,
          address: account.address,
          quota: account.quota,
          used: account.used,
          isDisabled: account.isDisabled,
          isDeleted: account.isDeleted,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        };
      } catch (error) {
        console.error("Get account error:", error);
        toast.error("Failed to get account details");
        throw error;
      }
    },

    // Email endpoints
    async getEmails(): Promise<Email[]> {
      try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
          headers,
        });

        const data = await handleResponse<EmailsListResponse>(response);
        
        return data["hydra:member"].map((email) => ({
          id: email.id,
          from: email.from || { address: "unknown", name: "Unknown Sender" },
          to: email.to || [{ address: "unknown", name: "Unknown Recipient" }],
          subject: email.subject || "(No Subject)",
          // The API documentation mentions that messages list includes 'intro', so preferentially use that
          // Fall back to text only if intro is unavailable
          intro: email.intro || 
                (email.text ? email.text.substring(0, 100) + (email.text.length > 100 ? '...' : '') : "(No content)"),
          isRead: email.seen,
          hasAttachments: email.hasAttachments,
          createdAt: email.createdAt,
          updatedAt: email.updatedAt,
        }));
      } catch (error) {
        console.error("Get emails error:", error);
        toast.error("Failed to load emails");
        throw error;
      }
    },

    async getEmail(id: string): Promise<EmailResponse> {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
          headers,
        });

        return handleResponse<EmailResponse>(response);
      } catch (error) {
        console.error("Get email error:", error);
        toast.error("Failed to load email content");
        throw error;
      }
    },

    async deleteEmail(id: string): Promise<void> {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          throw await handleResponse(response);
        }
      } catch (error) {
        console.error("Delete email error:", error);
        toast.error("Failed to delete email");
        throw error;
      }
    },

    async markAsRead(id: string): Promise<void> {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/merge-patch+json",
          },
          body: JSON.stringify({ seen: true }),
        });

        if (!response.ok) {
          throw await handleResponse(response);
        }
      } catch (error) {
        console.error("Mark as read error:", error);
        // Silent error as it's not critical
      }
    },
  };
};
