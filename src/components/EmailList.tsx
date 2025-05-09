
import React from "react";
import { Email } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

interface EmailListProps {
  emails: Email[];
  loading: boolean;
  refreshing: boolean;
  selectedEmailId: string | null;
  onRefresh: () => void;
  onSelectEmail: (id: string) => void;
  onDeleteEmail: (id: string) => void;
  rateLimited?: boolean;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  loading,
  refreshing,
  selectedEmailId,
  onRefresh,
  onSelectEmail,
  onDeleteEmail,
  rateLimited = false,
}) => {
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRefresh();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteEmail(id);
  };

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Inbox</h2>
        <button
          className="text-sm flex items-center gap-1 text-primary hover:text-primary/80"
          onClick={handleRefreshClick}
          disabled={refreshing || rateLimited}
        >
          {refreshing ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
      
      {rateLimited && (
        <div className="p-2 bg-amber-50 border-b border-amber-100 text-amber-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Rate limited by Mail.gw API. Please wait before refreshing.</span>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loading && !refreshing ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : emails.length > 0 ? (
          <ul className="divide-y">
            {emails.map((email) => {
              const isSelected = selectedEmailId === email.id;
              const formattedDate = format(
                new Date(email.createdAt),
                "MMM d, h:mm a"
              );

              return (
                <li
                  key={email.id}
                  onClick={() => onSelectEmail(email.id)}
                  className={`p-4 cursor-pointer ${
                    !email.isRead ? "bg-email-unread" : ""
                  } ${isSelected ? "bg-email-selected" : "hover:bg-email-hover"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium truncate flex-1 mr-2">
                      {email.from.name || email.from.address}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formattedDate}
                    </div>
                  </div>
                  <div className="text-sm font-medium truncate mb-1">
                    {email.subject || "(No Subject)"}
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {email.intro || "No content"}
                  </div>
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      {email.hasAttachments && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          Attachment
                        </span>
                      )}
                      {!email.isRead && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(e, email.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No emails to display</p>
            <p className="text-sm mt-2">
              {rateLimited 
                ? "API rate limited. Wait a moment and try again."
                : "Emails will appear here once you receive them"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList;
