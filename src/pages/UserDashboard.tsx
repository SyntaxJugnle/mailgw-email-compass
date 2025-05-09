
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useUserAuth } from "../hooks/useUserAuth";
import { useEmails } from "../hooks/useEmails";
import { useAccounts } from "../hooks/useAccounts";
import EmailList from "../components/EmailList";
import EmailViewer from "../components/EmailViewer";
import { useIsMobile } from "../hooks/use-mobile";
import { toast } from "sonner";
import { dbService } from "../services/dbService";
import { authService } from "../services/auth";
import { Button } from "@/components/ui/button";
import AccountForm from "../components/AccountForm";

const UserDashboard: React.FC = () => {
  const { isAuthenticated, logout, username, userId } = useUserAuth();
  const [showEmailList, setShowEmailList] = useState<boolean>(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(-1);
  const [showAccountForm, setShowAccountForm] = useState<boolean>(false);
  
  const isMobile = useIsMobile();
  
  const { 
    emails, 
    loading: emailsLoading, 
    refreshing,
    selectedEmail,
    getEmail,
    deleteEmail,
    refreshEmails,
    setSelectedEmail
  } = useEmails(true, 30000);
  
  const { createAccount } = useAccounts();
  
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace />;
  }
  
  // Load user accounts
  useEffect(() => {
    const loadAccounts = async () => {
      if (userId) {
        const userAccounts = await dbService.getAccountsByUserId(userId);
        setAccounts(userAccounts);
        
        // Automatically select the first account if available
        if (userAccounts.length > 0 && selectedAccountIndex === -1) {
          setSelectedAccountIndex(0);
          // Set the auth credentials for the selected account
          const account = userAccounts[0];
          authService.setAuthData(account.mail_gw_token, account.mail_gw_account_id, account.mail_gw_address);
          
          // Refresh emails for this account
          refreshEmails();
        }
      }
    };
    
    loadAccounts();
  }, [userId]);
  
  const handleSelectEmail = async (id: string) => {
    setSelectedEmailId(id);
    await getEmail(id);
    
    // On mobile, switch to email view
    if (isMobile) {
      setShowEmailList(false);
    }
  };
  
  const handleDeleteEmail = async (id: string) => {
    await deleteEmail(id);
    
    if (selectedEmailId === id) {
      setSelectedEmailId(null);
      setSelectedEmail(null);
    }
  };
  
  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
  };
  
  const handleBack = () => {
    setShowEmailList(true);
    setSelectedEmailId(null);
    setSelectedEmail(null);
  };
  
  const handleAccountCreated = async (address: string, password: string, accountId: string, token: string) => {
    if (userId) {
      // Save the account to the database
      await dbService.saveAccount(userId, accountId, address, token);
      
      // Reload accounts
      const userAccounts = await dbService.getAccountsByUserId(userId);
      setAccounts(userAccounts);
      
      // Select the newly created account
      const newIndex = userAccounts.findIndex(acc => acc.mail_gw_address === address);
      if (newIndex !== -1) {
        setSelectedAccountIndex(newIndex);
        // Set the auth credentials for the selected account
        authService.setAuthData(token, accountId, address);
        
        // Refresh emails for this account
        refreshEmails();
      }
      
      setShowAccountForm(false);
    }
  };
  
  const handleSwitchAccount = (index: number) => {
    if (index >= 0 && index < accounts.length) {
      setSelectedAccountIndex(index);
      
      // Set the auth credentials for the selected account
      const account = accounts[index];
      authService.setAuthData(account.mail_gw_token, account.mail_gw_account_id, account.mail_gw_address);
      
      // Reset selected email
      setSelectedEmailId(null);
      setSelectedEmail(null);
      
      // Refresh emails for this account
      refreshEmails();
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Mail.gw Compass</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:inline">
              Logged in as: {username}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={handleLogout}
                className="text-sm px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="bg-gray-100 border-b p-2">
        <div className="container mx-auto flex flex-wrap items-center gap-2">
          <div className="font-medium">Email Accounts:</div>
          {accounts.map((account, index) => (
            <Button 
              key={account.id}
              variant={selectedAccountIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => handleSwitchAccount(index)}
            >
              {account.mail_gw_address}
            </Button>
          ))}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAccountForm(true)}
          >
            + Add Account
          </Button>
        </div>
      </div>
      
      {showAccountForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Email Account</h2>
            <AccountForm 
              onSuccess={(account) => {
                if (account) {
                  handleAccountCreated(account.address, "", account.id, account.token || "");
                }
              }}
            />
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => setShowAccountForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      <main className="flex-1 flex overflow-hidden">
        {selectedAccountIndex === -1 ? (
          <div className="w-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">No Email Accounts</h2>
              <p className="text-gray-500 mb-4">You don't have any email accounts set up yet.</p>
              <Button onClick={() => setShowAccountForm(true)}>
                Create a New Email Account
              </Button>
            </div>
          </div>
        ) : isMobile ? (
          showEmailList ? (
            <div className="w-full">
              <EmailList
                emails={emails}
                loading={emailsLoading}
                refreshing={refreshing}
                selectedEmailId={selectedEmailId}
                onRefresh={refreshEmails}
                onSelectEmail={handleSelectEmail}
                onDeleteEmail={handleDeleteEmail}
              />
            </div>
          ) : (
            <div className="w-full">
              <EmailViewer
                email={selectedEmail}
                loading={emailsLoading}
                onDelete={handleDeleteEmail}
                onBack={handleBack}
              />
            </div>
          )
        ) : (
          <>
            <div className="w-1/3 xl:w-1/4 h-full overflow-hidden">
              <EmailList
                emails={emails}
                loading={emailsLoading}
                refreshing={refreshing}
                selectedEmailId={selectedEmailId}
                onRefresh={refreshEmails}
                onSelectEmail={handleSelectEmail}
                onDeleteEmail={handleDeleteEmail}
              />
            </div>
            <div className="w-2/3 xl:w-3/4 h-full overflow-hidden">
              <EmailViewer
                email={selectedEmail}
                loading={emailsLoading}
                onDelete={handleDeleteEmail}
                onBack={handleBack}
              />
            </div>
          </>
        )}
      </main>
      
      <footer className="bg-gray-100 p-2 text-xs text-gray-500">
        <div className="container mx-auto flex justify-between items-center">
          <span>© {new Date().getFullYear()} Mail.gw Compass</span>
          <span>User: {username}</span>
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;
