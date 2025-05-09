
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-center text-primary mb-4">
            Mail.gw Compass
          </h1>
          <p className="text-gray-600 text-center mb-8">
            A temporary email client for Mail.gw
          </p>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-2">User Access</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/user/login">
                  <Button variant="default" className="w-full">
                    User Login
                  </Button>
                </Link>
                <Link to="/user/register">
                  <Button variant="outline" className="w-full">
                    User Register
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Create an account to manage multiple temporary emails.
              </p>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-lg font-medium mb-2">Legacy Access</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Direct Login
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="outline" className="w-full">
                    Admin
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Legacy direct login to mail.gw or admin access.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4">
          <p className="text-xs text-gray-500 text-center">
            This is an unofficial client for{" "}
            <a
              href="https://mail.gw"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              mail.gw
            </a>{" "}
            temporary email service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
