
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  // If authenticated, redirect to dashboard, otherwise to login
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/" replace />
  );
};

export default Index;
