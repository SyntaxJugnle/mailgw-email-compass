
import React from "react";
import { EmailResponse } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import { useSanitizeHtml } from "../hooks/useSanitizeHtml";
import { ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface EmailViewerProps {
  email: EmailResponse | null;
  loading: boolean;
  onDelete?: (id: string) => void;
  onBack?: () => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({ email, loading, onDelete, onBack }) => {
  const sanitize = useSanitizeHtml();
  
  // Handle html content that can be an array or a string
  const getHtmlContent = () => {
    if (!email) return "";
    
    if (email.html) {
      if (Array.isArray(email.html)) {
        return email.html.join("");
      }
      return email.html;
    }
    
    return email.text || "";
  };
  
  const sanitizedHtml = sanitize(getHtmlContent());
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <p className="text-xl font-medium mb-2">No email selected</p>
        <p className="text-sm">Select an email from the list to view it here</p>
      </div>
    );
  }

  const formattedDate = email.createdAt
    ? format(new Date(email.createdAt), "PPpp")
    : "Unknown date";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with back button for mobile */}
      {onBack && (
        <div className="sm:hidden border-b p-2 flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to inbox</span>
          </button>
        </div>
      )}

      {/* Email header */}
      <div className="border-b p-4">
        <div className="flex justify-between">
          <h2 className="text-xl font-medium">{email.subject || "(No Subject)"}</h2>
          {onDelete && (
            <button
              onClick={() => onDelete(email.id)}
              className="text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">From: </span>
            {email.from.name ? `${email.from.name} <${email.from.address}>` : email.from.address}
          </div>
          <div>
            <span className="font-medium">To: </span>
            {email.to.map((recipient, i) => (
              <span key={i}>
                {recipient.name ? `${recipient.name} <${recipient.address}>` : recipient.address}
                {i < email.to.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
          <div>
            <span className="font-medium">Date: </span>
            {formattedDate}
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-auto p-4">
        {email.hasAttachments && (
          <div className="mb-4 p-3 bg-gray-50 border rounded">
            <p className="font-medium mb-2">Attachments:</p>
            <ul className="space-y-2">
              {email.attachments?.map((attachment) => (
                <li key={attachment.id} className="flex items-center">
                  <a
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    <span className="mr-2">📎</span>
                    <span>{attachment.filename}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({Math.round(attachment.size / 1024)} KB)
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="email-content" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      </div>
    </div>
  );
};

export default EmailViewer;
