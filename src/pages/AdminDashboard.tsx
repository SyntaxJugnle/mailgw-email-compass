
import React, { useState } from "react";
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

const generateRandomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, logout } = useAdminAuth();
  const { createAccount, loading } = useAccounts();
  const [accounts, setAccounts] = useState<GeneratedAccount[]>(accountsStorage.getAccounts());
  
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
    accountsStorage.deleteAccount(id);
    refreshAccounts();
    toast.success(`Account ${address} removed from the list`);
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
        <Tabs defaultValue="create-account" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create-account">Create Account</TabsTrigger>
            <TabsTrigger value="account-list">Account List</TabsTrigger>
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
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id, account.address)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
