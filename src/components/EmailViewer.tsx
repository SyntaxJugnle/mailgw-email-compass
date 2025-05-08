
import React from "react";
import { EmailResponse } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import { useSanitizeHtml } from "../hooks/useSanitizeHtml";
import { format } from "date-fns";

interface EmailViewerProps {
  email: EmailResponse | null;
  loading: boolean;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  loading,
  onDelete,
  onBack,
}) => {
  const sanitizedHtml = useSanitizeHtml(email?.html);

  const handleDelete = () => {
    if (email) {
      onDelete(email.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <p className="text-lg">No email selected</p>
        <p className="text-sm mt-2">Select an email from the list to view it here</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
  };

  // Determine which content to display
  const hasHtml = Boolean(sanitizedHtml && sanitizedHtml.trim());
  const hasText = Boolean(email.text && email.text.trim());

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <button
          onClick={onBack}
          className="md:hidden text-primary flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </button>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      </div>

      <div className="p-4 border-b">
        <h1 className="text-xl font-medium mb-3">{email.subject || "(No Subject)"}</h1>
        <div className="mb-3 flex flex-wrap justify-between items-start">
          <div>
            <p className="text-sm">
              <span className="font-medium">From:</span>{" "}
              {email.from.name ? `${email.from.name} <${email.from.address}>` : email.from.address}
            </p>
            <p className="text-sm">
              <span className="font-medium">To:</span>{" "}
              {email.to
                .map((recipient) =>
                  recipient.name
                    ? `${recipient.name} <${recipient.address}>`
                    : recipient.address
                )
                .join(", ")}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(email.createdAt)}
          </p>
        </div>
        {email.hasAttachments && (
          <div className="p-2 bg-blue-50 text-sm text-blue-800 rounded mb-3">
            This email has attachments. Use the original Mail.gw interface to view them.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {hasHtml ? (
          <div 
            className="email-content"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : hasText ? (
          <pre className="whitespace-pre-wrap text-sm">{email.text}</pre>
        ) : (
          <div className="text-gray-500">This email has no content.</div>
        )}
      </div>
    </div>
  );
};

export default EmailViewer;
