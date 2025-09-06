"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import InputModal from "../InputModal";
import {
  Edit2,
  Plus,
  User,
  Clock,
  Shield,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { sanitizeText } from "@/lib/sanitize";

interface RateLimitInfo {
  remaining: number;
  total: number;
  resetTime: Date;
}

interface EmailVerificationState {
  sent: boolean;
  email: string;
  expiresIn: number;
}

interface UsernameManagerProps {
  currentUsername?: string;
  userEmail?: string;
}

export default function UsernameManager({
  currentUsername,
  userEmail,
}: UsernameManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [emailVerification, setEmailVerification] =
    useState<EmailVerificationState | null>(null);
  const { data: session, update } = useSession();

  const hasUsername = !!currentUsername;

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
    console.log("🔍 DEBUG - Starting username change for:", username);
    console.log("🔍 DEBUG - Current session:", session?.user?.email);
    if (!username.trim()) return;

    const sanitizedUsername = sanitizeText(username.trim().toLowerCase(), 20);

    // Prevent setting the same username
    if (sanitizedUsername === currentUsername) {
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
      console.log("🔍 DEBUG - API Response:", result);
      // Handle email verification response
      if (result.message && result.email) {
        setEmailVerification({
          sent: true,
          email: result.email,
          expiresIn: result.expiresIn || 15,
        });

        toast.success("Verification email sent! Check your inbox.", {
          duration: 6000,
        });
        setIsModalOpen(false);
      } else if (result.username) {
        // Handle case where username didn't actually change (same username)
        await update({ username: result.username });

        const remainingChanges = rateLimitInfo?.remaining ?? "some";
        toast.success(
          `Username @${result.username} confirmed! ${remainingChanges} changes remaining this month.`,
          { duration: 5000 }
        );
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Username claim error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const resetEmailVerification = () => {
    setEmailVerification(null);
  };

  const resetRateLimitForDev = () => {
    setRateLimit(null);
    toast.success("Rate limit reset for development!", { duration: 3000 });
  };

  if (emailVerification) {
    return (
      <aside
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        aria-labelledby="username-heading"
      >
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2
              id="username-heading"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Username Verification
            </h2>
          </div>
        </header>

        {/* Email Verification Status */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Verification Email Sent
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                We've sent a verification email to{" "}
                <strong>{emailVerification.email}</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Link expires in {emailVerification.expiresIn} minutes
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Next Steps:
          </h4>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs flex items-center justify-center font-medium">
                1
              </span>
              Check your email inbox
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs flex items-center justify-center font-medium">
                2
              </span>
              Click the verification link
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs flex items-center justify-center font-medium">
                3
              </span>
              Your username will be updated automatically
            </li>
          </ol>
        </div>

        {/* Current username display */}
        <div className="mb-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Current:</span>
              <span className="font-mono text-lg text-gray-900 dark:text-gray-100">
                @{currentUsername || "Not set"}
              </span>
            </div>
          </div>
        </div>

        {/* Rate limit info (preserved) */}
        {rateLimit && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-200">
                {rateLimit.remaining} of {rateLimit.total} changes remaining
                this month
              </span>
            </div>
          </div>
        )}

        <footer>
          <button
            onClick={resetEmailVerification}
            className="w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400"
          >
            <Edit2 className="h-4 w-4" />
            Request Different Username
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Didn't receive the email? Check your spam folder or try a different
            username.
          </p>
        </footer>
      </aside>
    );
  }

  // Normal username management UI with security notice
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
                @{currentUsername}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No username set yet
          </div>
        )}
      </div>

      {/* Security Notice */}
      {!hasUsername && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700 dark:text-red-300">
              <strong>Email verification required:</strong> For security,
              username changes require email verification. You'll receive a
              verification link at {userEmail || "your email"}.
            </div>
          </div>
        </div>
      )}

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
        message="Enter your desired username. You'll receive an email to verify this change for security."
        placeholder="e.g., skillseeker"
        onConfirm={handleUsernameSubmit}
        onCancel={() => setIsModalOpen(false)}
        isSubmitting={isUpdating}
        submitText={isUpdating ? "Sending Email..." : "Send Verification Email"}
        validationPattern="^[a-z0-9]{3,20}$"
        validationMessage="Username must be 3-20 characters, lowercase letters and numbers only"
      />
    </aside>
  );
}
