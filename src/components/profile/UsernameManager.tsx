"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import InputModal from "../InputModal";
import { Edit2, Plus, User, Clock, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { sanitizeText } from "@/lib/sanitize";

interface RateLimitInfo {
  remaining: number;
  total: number;
  resetTime: Date;
}

export default function UsernameManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const { data: session, update } = useSession();

  const hasUsername = !!session?.user?.username;

  // Parse rate limit headers from response
  const parseRateLimitHeaders = (headers: Headers): RateLimitInfo | null => {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");

    if (limit && remaining && reset) {
      return {
        remaining: parseInt(remaining),
        total: parseInt(limit),
        resetTime: new Date(parseInt(reset)),
      };
    }
    return null;
  };

  const handleUsernameSubmit = async (username: string) => {
    if (!username.trim()) return;

    const sanitizedUsername = sanitizeText(username.trim().toLowerCase(), 20);

    // Prevent setting the same username
    if (sanitizedUsername === session?.user?.username) {
      toast.error("This is already your current username");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/profile/username/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: sanitizedUsername }),
      });

      // Parse rate limit info from headers
      const rateLimitInfo = parseRateLimitHeaders(response.headers);
      if (rateLimitInfo) {
        setRateLimit(rateLimitInfo);
      }

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 429) {
          // Enhanced rate limit error message
          const retryAfter = data.retryAfter;
          let message = data.error;

          if (rateLimitInfo?.resetTime) {
            const resetDate = rateLimitInfo.resetTime.toLocaleDateString();
            message += ` You can try again on ${resetDate}.`;
          } else if (retryAfter) {
            const hours = Math.ceil(retryAfter / 3600);
            message += ` Try again in ${hours} hours.`;
          }

          toast.error(message, { duration: 8000 });
        } else {
          toast.error(data.error || "Failed to update username");
        }
        return;
      }

      const result = await response.json();

      // Update NextAuth session
      await update({ username: result.username });

      // Enhanced success message with rate limit info
      const remainingChanges = rateLimitInfo?.remaining ?? "some";
      toast.success(
        `Username @${result.username} set successfully! ${remainingChanges} changes remaining this month.`,
        { duration: 5000 }
      );

      setIsModalOpen(false);
    } catch (error) {
      console.error("Username claim error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <aside
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      aria-labelledby="username-heading"
    >
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2
            id="username-heading"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Username
          </h2>
        </div>

        {/* Rate limit indicator */}
        {rateLimit && rateLimit.remaining > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Shield className="h-3 w-3" />
            {rateLimit.remaining} changes left
          </div>
        )}
      </header>

      <div className="mb-4">
        {hasUsername ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Current:</span>
              <span className="font-mono text-lg text-gray-900 dark:text-gray-100">
                @{session?.user?.username}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No username set yet
          </div>
        )}
      </div>

      {/* Rate limit info */}
      {rateLimit && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-800 dark:text-blue-200">
              {rateLimit.remaining} of {rateLimit.total} changes remaining this
              month
            </span>
          </div>
          {rateLimit.remaining === 0 && (
            <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
              Next change available: {rateLimit.resetTime.toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      <footer>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={rateLimit?.remaining === 0}
          className={`
            w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors
            ${
              rateLimit?.remaining === 0
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400"
            }
          `}
        >
          {hasUsername ? (
            <>
              <Edit2 className="h-4 w-4" />
              Change Username
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Set Username
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          3-20 characters • lowercase letters and numbers only
        </p>

        {rateLimit?.remaining === 0 && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1 text-center">
            Username changes exhausted for this month
          </p>
        )}
      </footer>

      <InputModal
        isOpen={isModalOpen}
        title={hasUsername ? "Change Username" : "Set Your Username"}
        message="Enter your desired username. It must be 3-20 characters long and contain only lowercase letters and numbers."
        placeholder="e.g., skillseeker"
        onConfirm={handleUsernameSubmit}
        onCancel={() => setIsModalOpen(false)}
        isSubmitting={isUpdating}
        submitText={hasUsername ? "Update Username" : "Set Username"}
        validationPattern="^[a-z0-9]{3,20}$"
        validationMessage="Username must be 3-20 characters, lowercase letters and numbers only"
      />
    </aside>
  );
}
