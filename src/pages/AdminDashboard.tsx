import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountsStorage, GeneratedAccount } from "../services/accountsStorage";
import { useAccounts } from "../hooks/useAccounts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingSpinner from "../components/LoadingSpinner";
import EmailViewer from "../components/EmailViewer";
import EmailList from "../components/EmailList";
import { useEmails } from "../hooks/useEmails";
import { authService } from "../services/auth";
import { Eye, EyeOff } from "lucide-react";

const generateRandomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Modified debounce function to limit function invocation frequency
const debounce = (fn: Function, ms = 1000) => {
  let timer: number | null = null;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  };
};

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, logout } = useAdminAuth();
  const { createAccount, loading } = useAccounts();
  const [accounts, setAccounts] = useState<GeneratedAccount[]>(accountsStorage.getAccounts());
  const [selectedAccount, setSelectedAccount] = useState<GeneratedAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>("create-account");
  const [viewingEmails, setViewingEmails] = useState<boolean>(false);

  // Email viewing state with reduced auto-refresh frequency
  const {
    emails,
    loading: emailsLoading,
    refreshing,
    error,
    selectedEmail,
    getEmail,
    deleteEmail,
    refreshEmails,
    setSelectedEmail,
    rateLimited
  } = useEmails(viewingEmails, 120000); // 2 minutes refresh interval

  // Use effect to manage the email viewing state
  useEffect(() => {
    setViewingEmails(activeTab === "view-emails" && !!selectedAccount);
    
    if (selectedAccount && activeTab === "view-emails") {
      // Log in as the selected account to view emails
      const doLogin = async () => {
        try {
          await authService.login(selectedAccount.address, selectedAccount.password);
          // Use debounce to prevent rate limiting
          debounce(refreshEmails, 2000)();
        } catch (err) {
          console.error("Error logging in:", err);
          toast.error("Failed to login as the selected account");
        }
      };
      doLogin();
    }
  }, [selectedAccount, activeTab, refreshEmails]);

  // If not authenticated, redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const refreshAccounts = () => {
    setAccounts(accountsStorage.getAccounts());
  };
  
  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
  };
  
  const handleCreateRandomAccount = async () => {
    try {
      // Generate random username
      const username = generateRandomString(8);
      
      // Get available domains
      const response = await fetch("https://api.mail.gw/domains");
      const data = await response.json();
      
      let domain = "mail.gw";
      if (data["hydra:member"] && data["hydra:member"].length > 0) {
        const randomIndex = Math.floor(Math.random() * data["hydra:member"].length);
        domain = data["hydra:member"][randomIndex].domain;
      }
      
      const address = `${username}@${domain}`;
      const password = "Kac@11";
      
      // Create account on mail.gw
      const account = await createAccount({
        address,
        password,
      });
      
      if (account) {
        // Save to local storage
        const savedAccount: GeneratedAccount = {
          id: account.id,
          address: account.address,
          password,
          createdAt: new Date().toISOString(),
        };
        
        accountsStorage.saveAccount(savedAccount);
        refreshAccounts();
        
        toast.success(`Account ${address} created successfully!`);
      }
    } catch (error) {
      console.error("Error creating random account:", error);
      toast.error("Failed to create random account");
    }
  };
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };
  
  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard");
  };
  
  const handleDeleteAccount = (id: string, address: string) => {
    if (selectedAccount?.id === id) {
      setSelectedAccount(null);
    }
    accountsStorage.deleteAccount(id);
    refreshAccounts();
    toast.success(`Account ${address} removed from the list`);
  };

  const handleViewEmails = (account: GeneratedAccount) => {
    setSelectedAccount(account);
    setActiveTab("view-emails");
  };

  const handleBackToAccounts = () => {
    setSelectedAccount(null);
    setActiveTab("account-list");
    setViewingEmails(false);
    // Logout of the account
    authService.logout();
  };

  const handleEmailSelect = async (id: string) => {
    // Use debounce to prevent rate limiting
    debounce(async () => {
      await getEmail(id);
    }, 1000)();
  };

  const handleDeleteEmailClick = async (id: string) => {
    // Use debounce to prevent rate limiting
    debounce(async () => {
      await deleteEmail(id);
    }, 1000)();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Mail.gw Admin Panel</h1>
          <Button 
            onClick={handleLogout} 
            variant="destructive"
          >
            Logout
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="create-account">Create Account</TabsTrigger>
            <TabsTrigger value="account-list">Account List</TabsTrigger>
            {selectedAccount && (
              <TabsTrigger value="view-emails">
                Viewing: {selectedAccount.address}
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="create-account" className="p-6 bg-white rounded-md shadow">
            <h2 className="text-2xl font-semibold mb-4">Create Random Account</h2>
            <p className="text-gray-500 mb-6">
              This will create an account with a random username and domain, with the password "Kac@11".
            </p>
            
            <Button 
              onClick={handleCreateRandomAccount} 
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating Account...
                </span>
              ) : (
                "Generate Random Account"
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="account-list" className="p-6 bg-white rounded-md shadow">
            <h2 className="text-2xl font-semibold mb-4">Generated Accounts</h2>
            
            {accounts.length === 0 ? (
              <p className="text-gray-500">No accounts have been generated yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {account.address}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCopyAddress(account.address)}
                            >
                              Copy
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {account.password}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCopyPassword(account.password)}
                            >
                              Copy
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(account.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEmails(account)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Emails
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id, account.address)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="view-emails" className="bg-white rounded-md shadow">
            {selectedAccount ? (
              <div className="flex flex-col h-[calc(100vh-200px)]">
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleBackToAccounts}
                      variant="outline"
                      size="sm"
                    >
                      Back to Accounts
                    </Button>
                    <h2 className="text-lg font-medium">
                      Emails for: {selectedAccount.address}
                    </h2>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 h-full overflow-hidden">
                  <EmailList 
                    emails={emails}
                    loading={emailsLoading}
                    refreshing={refreshing}
                    selectedEmailId={selectedEmail?.id || null}
                    onRefresh={refreshEmails}
                    onSelectEmail={handleEmailSelect}
                    onDeleteEmail={handleDeleteEmailClick}
                    rateLimited={rateLimited}
                  />
                  <EmailViewer
                    email={selectedEmail}
                    loading={emailsLoading}
                    onDelete={handleDeleteEmailClick}
                    onBack={() => setSelectedEmail(null)}
                  />
                </div>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-gray-500">No account selected. Please select an account from the Account List tab.</p>
                <Button 
                  onClick={() => setActiveTab("account-list")}
                  variant="outline"
                  className="mt-4"
                >
                  Go to Account List
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
