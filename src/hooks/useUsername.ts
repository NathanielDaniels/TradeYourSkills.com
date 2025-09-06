import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import type {
  UsernameClaimResponse,
  UsernameClaimError,
  UsernameValidationState,
  UsernameRateLimit,
} from "@/types/api";

const RESERVED_USERNAMES = [
  "admin",
  "root",
  "api",
  "www",
  "mail",
  "ftp",
  "support",
  "help",
  "contact",
  "about",
  "login",
  "signup",
  "register",
  "dashboard",
  "profile",
  "settings",
  "account",
  "user",
  "users",
  "moderator",
  "mod",
  "administrator",
  "system",
  "service",
  "bot",
  "null",
  "undefined",
];

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-z0-9]+$/,
    "Username can only contain lowercase letters and numbers"
  )
  .refine(
    (name) => !RESERVED_USERNAMES.includes(name.toLowerCase()),
    "Username is reserved"
  );

export function useUsername() {
  const { data: session, update } = useSession();
  const [validation, setValidation] = useState<UsernameValidationState>({
    isValid: false,
    error: null,
    isChecking: false,
    isAvailable: null,
  });
  const [rateLimit, setRateLimit] = useState<UsernameRateLimit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side validation
  const validateUsername = useCallback((username: string): string | null => {
    try {
      usernameSchema.parse(username);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || "Invalid username";
      }
      return "Invalid username";
    }
  }, []);

  // Sanitize username input
  const sanitizeUsername = useCallback((input: string): string => {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20);
  }, []);

  // Check if username is available (debounced)
  const checkAvailability = useCallback(
    async (username: string): Promise<void> => {
      if (!username || validateUsername(username)) {
        setValidation((prev) => ({
          ...prev,
          isAvailable: null,
          isChecking: false,
        }));
        return;
      }

      setValidation((prev) => ({ ...prev, isChecking: true }));

      try {
        const response = await fetch("/api/profile/username/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        if (response.ok) {
          const data = await response.json();
          setValidation((prev) => ({
            ...prev,
            isAvailable: data.available,
            isChecking: false,
          }));
        } else {
          setValidation((prev) => ({ ...prev, isChecking: false }));
        }
      } catch (error) {
        setValidation((prev) => ({ ...prev, isChecking: false }));
      }
    },
    [validateUsername]
  );

  // Parse rate limit headers
  const parseRateLimitHeaders = useCallback((headers: Headers) => {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");

    if (limit && remaining && reset) {
      return {
        remaining: parseInt(remaining),
        total: parseInt(limit),
        resetTime: new Date(parseInt(reset)),
        isNewUser: parseInt(limit) > 2, // New users get higher limits
      };
    }
    return null;
  }, []);

  // Claim username with full error handling
  const claimUsername = useCallback(
    async (
      username: string
    ): Promise<{ success: boolean; username?: string }> => {
      const sanitized = sanitizeUsername(username);
      const validationError = validateUsername(sanitized);

      if (validationError) {
        toast.error(validationError);
        return { success: false };
      }

      // Check if username is unchanged
      if (sanitized === session?.user?.username) {
        toast.error("This is already your current username");
        return { success: false };
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/profile/username/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: sanitized }),
        });

        // Parse rate limit headers
        const rateLimitInfo = parseRateLimitHeaders(response.headers);
        if (rateLimitInfo) {
          setRateLimit(rateLimitInfo);
        }

        if (response.ok) {
          const data: UsernameClaimResponse = await response.json();

          // Update session
          await update({ username: data.username });

          // Show success with rate limit info
          const remainingChanges = rateLimitInfo?.remaining ?? "some";
          toast.success(
            `Username @${data.username} set successfully! ${remainingChanges} changes remaining this month.`,
            { duration: 5000 }
          );

          return { success: true, username: data.username };
        } else {
          const errorData: UsernameClaimError = await response.json();

          if (response.status === 429) {
            // Rate limit exceeded
            const retryAfter = errorData.retryAfter;
            const resetDate = rateLimitInfo?.resetTime;

            let message = errorData.error;
            if (resetDate) {
              const resetDateStr = resetDate.toLocaleDateString();
              message += ` You can try again on ${resetDateStr}.`;
            } else if (retryAfter) {
              const hours = Math.ceil(retryAfter / 3600);
              message += ` Try again in ${hours} hours.`;
            }

            toast.error(message, { duration: 8000 });
          } else if (response.status === 409) {
            // Username taken
            toast.error("Username is already taken. Please try another one.");
          } else if (response.status === 400 && errorData.details) {
            // Validation errors
            const firstError = errorData.details[0];
            toast.error(firstError?.message || errorData.error);
          } else {
            // Generic error
            toast.error(errorData.error || "Failed to update username");
          }

          return { success: false };
        }
      } catch (error) {
        console.error("Username claim error:", error);
        toast.error(
          "Network error. Please check your connection and try again."
        );
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      sanitizeUsername,
      validateUsername,
      session?.user?.username,
      update,
      parseRateLimitHeaders,
    ]
  );

  return {
    validation,
    rateLimit,
    isSubmitting,
    validateUsername,
    sanitizeUsername,
    checkAvailability,
    claimUsername,
    currentUsername: session?.user?.username,
    hasUsername: !!session?.user?.username,
  };
}
