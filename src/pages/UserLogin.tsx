
import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useUserAuth } from "../hooks/useUserAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "sonner";

const UserLogin: React.FC = () => {
  const { isAuthenticated, login, loading } = useUserAuth();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // If already authenticated, redirect to user dashboard
  if (isAuthenticated) {
    return <Navigate to="/user/dashboard" replace />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    
    try {
      const success = await login(username, password);
      if (success) {
        toast.success("Login successful!");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Mail.gw Compass</h1>
          <p className="mt-2 text-sm text-gray-600">
            Login to your account
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </Button>
          
          <div className="text-center">
            <span className="text-sm text-gray-500">Don't have an account? </span>
            <Link to="/user/register" className="text-sm text-primary hover:underline">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;
