"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface VerificationState {
  status: "loading" | "success" | "error" | "expired" | "invalid";
  message: string;
  newUsername?: string;
}

function VerificationFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Loading Verification...
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsernameVerificationContent() {
  const [hasVerified, setHasVerified] = useState(false);
  const [verification, setVerification] = useState<VerificationState>({
    status: "loading",
    message: "Verifying your username change...",
  });

  const { status, message, newUsername } = verification;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const token = searchParams.get("token");

  const verifyUsernameChange = useCallback(async () => {
    if (!token || hasVerified) return;

    console.log(
      "🔍 DEBUG - Starting verification for token:",
      token.slice(0, 8) + "..."
    );

    setHasVerified(true);

    try {
      const response = await fetch("/api/verify/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      console.log("🔍 DEBUG - API Response:", data);
      console.log("🔍 DEBUG - Response status:", response.status);
      const { username } = data;

      if (response.ok) {
        console.log(
          "🔍 DEBUG - Before session update, current session username:",
          session?.user?.username
        );
        // Update session with new username
        await update({username});

        const updatedSession = await update();

        console.log(
          "🔍 DEBUG - After session update:",
          updatedSession?.user?.username
        );
        console.log("🔍 DEBUG - New username from API:", username);

        setVerification({
          status: "success",
          message: "Username change verified successfully!",
          newUsername: username,
        });

        toast.success(`Username changed to @${username}!`);
      } else {
        const status = response.status === 410 ? "expired" : "error";
        setVerification({
          status,
          message: data.error || "Verification failed",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerification({
        status: "error",
        message: "Network error. Please try again.",
      });
      setHasVerified(false); // Allow retry on network error
    }
  }, [token, update, session, hasVerified]);

  // Handle token validation and verification
  useEffect(() => {
    if (!token) {
      setVerification({
        status: "invalid",
        message: "Invalid verification link. No token provided.",
      });
      return;
    }

    if (!hasVerified) {
      // Only verify if not already attempted
      verifyUsernameChange();
    }
  }, [token, hasVerified, verifyUsernameChange]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (status === "success") {
      timeoutId = setTimeout(() => {
        // router.push("/profile");
        // router.refresh();
        window.location.href = "/profile";
      }, 3000);
    }

    // Cleanup timeout on unmount or status change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [status, router]);

  const getIcon = useCallback(() => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-16 w-16 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "error":
      case "expired":
        return <XCircle className="h-16 w-16 text-red-500" />;
      case "invalid":
        return <AlertCircle className="h-16 w-16 text-orange-500" />;
      default:
        return <Loader2 className="h-16 w-16 animate-spin text-blue-500" />;
    }
  }, [status]);

  const getStatusColor = useCallback(() => {
    switch (status) {
      case "success":
        return "text-green-700 dark:text-green-300";
      case "error":
      case "expired":
        return "text-red-700 dark:text-red-300";
      case "invalid":
        return "text-orange-700 dark:text-orange-300";
      default:
        return "text-blue-700 dark:text-blue-300";
    }
  }, [status]);

  const handleGoToProfile = useCallback(() => {
    // router.push("/profile");
    // Add a small delay to ensure refresh completes
    window.location.href = "/profile";
  }, [router]);

  const handleGoToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">{getIcon()}</div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Username Verification
            </h1>

            <p className={`text-lg ${getStatusColor()} mb-6`}>{message}</p>

            {newUsername && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your new username:
                </p>
                <p className="font-mono text-xl text-green-800 dark:text-green-200">
                  @{newUsername}
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Redirecting to your profile in 3 seconds...
                </p>
                <button
                  onClick={handleGoToProfile}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Go to Profile Now
                </button>
              </div>
            )}

            {(status === "error" ||
              status === "expired" ||
              status === "invalid") && (
              <div className="space-y-4">
                {status === "expired" && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      The verification link has expired. Verification links are
                      only valid for 15 minutes for security purposes.
                    </p>
                  </div>
                )}

                {status === "invalid" && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This verification link is invalid or has been used
                      already.
                    </p>
                  </div>
                )}

                {status === "error" && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      An error occurred during verification. Please try
                      requesting a new username change.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleGoToProfile}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Go to Profile
                  </button>

                  <button
                    onClick={handleGoToDashboard}
                    className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsernameVerificationPage() {
  return (
    <Suspense fallback={<VerificationFallback />}>
      <UsernameVerificationContent />
    </Suspense>
  );
}
