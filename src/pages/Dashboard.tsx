
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEmails } from "../hooks/useEmails";
import { useAccounts } from "../hooks/useAccounts";
import EmailList from "../components/EmailList";
import EmailViewer from "../components/EmailViewer";
import { useIsMobile } from "../hooks/use-mobile";
import { toast } from "sonner";

const Dashboard: React.FC = () => {
  const { isAuthenticated, logout, address } = useAuth();
  const [showEmailList, setShowEmailList] = useState<boolean>(true);
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
  
  const { deleteAccount, loading: accountLoading } = useAccounts();
  
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
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
  
  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
      await deleteAccount();
    }
  };
  
  const handleBack = () => {
    setShowEmailList(true);
    setSelectedEmailId(null);
    setSelectedEmail(null);
  };
  
  const copyEmailToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Email address copied to clipboard");
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Mail.gw Compass</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:inline">
              {address}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={copyEmailToClipboard} 
                className="text-sm px-2 py-1 bg-primary-foreground text-primary rounded hover:bg-primary-foreground/90"
              >
                Copy Email
              </button>
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
      
      <main className="flex-1 flex overflow-hidden">
        {isMobile ? (
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
          <button 
            onClick={handleDeleteAccount} 
            className="text-red-500 hover:underline"
            disabled={accountLoading}
          >
            {accountLoading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
