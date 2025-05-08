
import React, { useState } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "sonner";

interface AccountFormProps {
  onSuccess?: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ onSuccess }) => {
  const [address, setAddress] = useState<string>("");
  const [domain, setDomain] = useState<string>("mail.gw");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  
  const { createAccount, loading, error } = useAccounts();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validation
    if (!address) {
      setFormError("Username is required");
      return;
    }
    
    if (!password) {
      setFormError("Password is required");
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    
    const fullAddress = `${address}@${domain}`;
    
    try {
      const account = await createAccount({
        address: fullAddress,
        password,
      });
      
      if (account && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error during account creation:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-medium mb-6">Create a New Email Account</h2>
      
      <div>
        <Label htmlFor="address">Email Address</Label>
        <div className="flex mt-1">
          <Input
            id="address"
            type="text"
            placeholder="username"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-r-none"
          />
          <span className="inline-flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
            @{domain}
          </span>
        </div>
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
      
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1"
        />
      </div>
      
      {(formError || error) && (
        <div className="text-red-500 text-sm">
          {formError || error}
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
            Creating Account...
          </span>
        ) : (
          "Create Account"
        )}
      </Button>
      
      <p className="text-sm text-gray-500 text-center">
        Note: These accounts are temporary and may be deleted after inactivity.
      </p>
    </form>
  );
};

export default AccountForm;
