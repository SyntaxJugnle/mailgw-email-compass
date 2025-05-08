
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoginForm from "../components/LoginForm";
import AccountForm from "../components/AccountForm";

const Login: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showCreateAccount, setShowCreateAccount] = useState<boolean>(false);
  
  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Mail.gw Compass</h1>
          <p className="mt-2 text-sm text-gray-600">
            Temporary email made simple
          </p>
        </div>
        
        {showCreateAccount ? (
          <AccountForm
            onSuccess={() => setShowCreateAccount(false)}
          />
        ) : (
          <LoginForm
            onCreateAccount={() => setShowCreateAccount(true)}
          />
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>This is an unofficial client for <a href="https://mail.gw" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">mail.gw</a> temporary email service.</p>
            <p className="mt-1">Accounts may be deleted after periods of inactivity.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
