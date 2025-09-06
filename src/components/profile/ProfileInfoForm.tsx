"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useValidation } from "@/hooks/useValidation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface ProfileInfoFormProps {
  bio: string;
  location: string;
  onSave: (bio: string, location: string) => Promise<void>;
  isSaving: boolean;
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userProvider: string | null | undefined;
  onEmailChange?: (
    newEmail: string
  ) => Promise<{ error?: string; message?: string } | void>;
}

export default function ProfileInfoForm({
  bio,
  location,
  onSave,
  isSaving,
  userName,
  userEmail,
  userProvider,
  onEmailChange,
}: ProfileInfoFormProps) {
  const [localBio, setLocalBio] = useState(bio);
  const [localEmail, setLocalEmail] = useState(userEmail || "");
  const [localLocation, setLocalLocation] = useState(location);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const { errors, validateBio, validateLocation } = useValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isBioValid = validateBio(localBio);
    const isLocationValid = validateLocation(localLocation);

    if (!isBioValid || !isLocationValid) return;

    try {
      await onSave(localBio, localLocation);
      setFeedback({
        type: "success",
        message: "Profile updated successfully!",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: "Failed to update profile. Try again.",
      });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
    setLocalBio(bio);
    setLocalLocation(location);
    setLocalEmail(userEmail || "");
  }, [bio, location, userEmail]);

  const emailChanged =
    userProvider === "credentials" &&
    localEmail.trim() &&
    localEmail.trim() !== (userEmail || "").trim();

  // Toast wrapper for email change
  const handleEmailChangeClick = async () => {
    if (onEmailChange) {
      try {
        const result = await onEmailChange(localEmail);
        if (result?.error) {
          toast.error(result.error);
        } else if (result?.message) {
          toast.success(result.message);
        }
      } catch (err: any) {
        toast.error(
          err?.message || "Failed to request email change. Try again."
        );
      }
    }
  };

  return (
    <section
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      aria-labelledby="profile-info-heading"
    >
      <header className="flex items-center mb-6">
        <div
          className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4"
          aria-hidden="true"
        >
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2
          id="profile-info-heading"
          className="text-xl font-semibold text-gray-900 dark:text-gray-100"
        >
          Profile Information
        </h2>
      </header>

      <AnimatePresence>
        {feedback && (
          <motion.p
            key="feedback"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className={`text-sm mb-3 ${
              feedback.type === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {feedback.message}
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <fieldset className="space-y-6">
          <legend className="sr-only">Personal Information</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <p className="p-3 border rounded-lg border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium">
                {userName || "Not provided"}
              </p>
            </div>
            {userProvider === "credentials" ? (
              <div className="rounded-lg">
                <label
                  htmlFor="email-input"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <div className="flex flex-row lg:flex-col lg:items-stretch gap-2 w-full max-w-full">
                  <input
                    id="email-input"
                    type="email"
                    aria-label="New Email"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    placeholder="Your city or region..."
                    className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {emailChanged && (
                    <button
                      type="button"
                      onClick={handleEmailChangeClick}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition whitespace-nowrap w-auto lg:w-full"
                    >
                      Change Email
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="p-4 border rounded-lg border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium">
                  {userEmail}
                </p>
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="bio-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Bio
            </label>
            <textarea
              id="bio-input"
              value={localBio}
              onChange={(e) => {
                setLocalBio(e.target.value);
                validateBio(e.target.value);
              }}
              placeholder="Tell others about yourself..."
              maxLength={300}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.bio
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 resize-none`}
              rows={4}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tell your story - help others understand what skills you offer and
              want to trade
            </p>
            {errors.bio && (
              <p className="text-red-500 text-xs mt-1 flex justify-end">
                {errors.bio}
              </p>
            )}
            {localBio.length > 1 && (
              <p className="text-xs mt-1 text-gray-300 dark:text-gray-300 flex justify-end">
                {300 - localBio.length} characters remaining
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="location-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Location
            </label>
            <input
              id="location-input"
              type="text"
              value={localLocation}
              onChange={(e) => setLocalLocation(e.target.value)}
              placeholder="Your city or region..."
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.location
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200`}
            />
            <p className="text-xs py-2 text-gray-500 dark:text-gray-400 mt-1">
              Help others find you for local trades
            </p>
            {errors.location && (
              <p className="text-red-500 text-xs mt-1">{errors.location}</p>
            )}
          </div>
          <footer className="pt-4">
            {/* <button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button> */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 rounded-lg"
                disabled={isSaving}
              >
                {isSaving && (
                  <svg
                    className="mx-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </footer>
        </fieldset>
      </form>
    </section>
  );
}
