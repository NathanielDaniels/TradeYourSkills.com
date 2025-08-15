"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";

interface UsernameClaimFormProps {
  onClaim?: (username: string) => void;
}

const MAX_LEN = 20;
const MIN_LEN = 3;
const USERNAME_RE = /^[a-z0-9]+$/; // lowercase letters and digits only

function normalizeUsername(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, MAX_LEN);
}

function validateUsername(username: string): string | null {
  if (!username) return "Username is required.";
  if (username.length < MIN_LEN)
    return `Username must be at least ${MIN_LEN} characters.`;
  if (username.length > MAX_LEN)
    return `Username must be at most ${MAX_LEN} characters.`;
  if (!USERNAME_RE.test(username))
    return "Only lowercase letters and numbers are allowed.";
  return null;
}

export default function UsernameClaimForm({ onClaim }: UsernameClaimFormProps) {
  const [username, setUsername] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { update } = useSession();

  const normalized = useMemo(() => normalizeUsername(username), [username]);
  const validationError = useMemo(
    () => validateUsername(normalized),
    [normalized]
  );
  const canSubmit = !validationError && !!normalized && !isSubmitting;

  const hasError = Boolean(validationError || submitError);
  const describedBy = hasError
    ? "username-help username-error"
    : "username-help";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Ensure we submit the normalized/validated value
    const desired = normalized;
    const clientError = validateUsername(desired);
    if (clientError) {
      setSubmitError(clientError);
      return;
    }

    const isDev = process.env.NODE_ENV !== "production";
    function logWarn(...args: any[]) {
      if (isDev) console.warn(...args);
    }
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/profile/username/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: desired }),
      });
      if (!res.ok) {
        let message = "Something went wrong";
        try {
          const data = await res.json();
          message = data?.error ?? message;
        } catch (e) {
          logWarn("[username-claim] Failed to parse error JSON:", e);
          try {
            const text = await res.text();
            if (text) message = text;
          } catch (inner) {
            logWarn("[username-claim] Failed to parse error text:", inner);
          }
        }
        setSubmitError(message);
        return;
      }

      // Notify parent (to persist or update local state)
      onClaim?.(desired);
      
      try {
        await update?.({ username: desired });
      } catch (e) {
        logWarn("[username-claim] Session update failed:", e);
        Sentry.captureException(e, { tags: { area: "username-claim" } });
      }
    } catch (err) {
      logWarn("[username-claim] Submit failed:", err);
      Sentry.captureException(err, {
        tags: { area: "username-claim", stage: "submit" },
      });
      setSubmitError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Choose a username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          maxLength={MAX_LEN}
          pattern="[a-z0-9]*"
          title="Only lowercase letters and numbers"
          value={username}
          onChange={(e) => {
            const raw = e.target.value;
            const sanitized = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
            setUsername(sanitized.slice(0, MAX_LEN));
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = (e.clipboardData.getData("text") || "")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, MAX_LEN);
            setUsername((prev) => (prev + pasted).slice(0, MAX_LEN));
          }}
          placeholder="e.g. skillseeker"
          {...(hasError
            ? { "aria-invalid": "true" }
            : { "aria-invalid": "false" })}
          aria-describedby={describedBy}
          aria-errormessage={hasError ? "username-error" : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div
          id="username-help"
          className="mt-1 text-xs text-gray-500 dark:text-gray-400"
        >
          • 3-20 chars • lowercase letters and numbers only
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {normalized.length}/{MAX_LEN}
        </div>
      </div>

      {(validationError || submitError) && (
        <div
          id="username-error"
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {validationError ?? submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white 
          ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              : "bg-blue-400 cursor-not-allowed"
          }
          transition-colors`}
      >
        {isSubmitting ? "Claiming..." : "Claim Username"}
      </button>

      {/* Preview of what will be submitted */}
      {normalized && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Will claim: <span className="font-mono">@{normalized}</span>
        </div>
      )}
    </form>
  );
}
