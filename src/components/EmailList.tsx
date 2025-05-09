
import React, { useState } from "react";
import { Email } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import { format } from "date-fns";
import { AlertCircle, RefreshCcw, Search } from "lucide-react";
import { Input } from "./ui/input";

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
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRefresh();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteEmail(id);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter emails based on search query
  const filteredEmails = emails.filter((email) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (email.subject && email.subject.toLowerCase().includes(query)) ||
      (email.intro && email.intro.toLowerCase().includes(query)) ||
      (email.from.name && email.from.name.toLowerCase().includes(query)) ||
      (email.from.address && email.from.address.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Inbox</h2>
        <button
          className={`text-sm flex items-center gap-1 ${
            rateLimited ? "text-gray-400" : "text-primary hover:text-primary/80"
          }`}
          onClick={handleRefreshClick}
          disabled={refreshing || rateLimited}
        >
          {refreshing ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
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
      
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 w-full"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && !refreshing ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredEmails.length > 0 ? (
          <ul className="divide-y">
            {filteredEmails.map((email) => {
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
                      {email.from.name || email.from.address || "Unknown Sender"}
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
            {searchQuery ? (
              <>
                <p>No emails match your search</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </>
            ) : (
              <>
                <p>No emails to display</p>
                <p className="text-sm mt-2">
                  {rateLimited 
                    ? "API rate limited. Wait a moment and try again."
                    : "Emails will appear here once you receive them"}
                </p>
              </>
            )}
          </div>
        )}
      </div>
      
      {filteredEmails.length > 0 && searchQuery && (
        <div className="p-2 border-t text-xs text-center text-gray-500">
          {filteredEmails.length} {filteredEmails.length === 1 ? 'result' : 'results'} found
        </div>
      )}
    </div>
  );
};

export default EmailList;
