"use client";
import { useEffect, useState } from "react";
import { useValidation } from "@/hooks/useValidation";

interface ProfileInfoFormProps {
  bio: string;
  location: string;
  onSave: (bio: string, location: string) => Promise<void>;
  isSaving: boolean;
  userName: string | null | undefined;
  userEmail: string | null | undefined;
}

export default function ProfileInfoForm({
  bio,
  location,
  onSave,
  isSaving,
  userName,
  userEmail,
}: ProfileInfoFormProps) {
  const [localBio, setLocalBio] = useState(bio);
  const [localLocation, setLocalLocation] = useState(location);

  const { errors, validateBio, validateLocation } = useValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isBioValid = validateBio(localBio);
    const isLocationValid = validateLocation(localLocation);

    if (!isBioValid || !isLocationValid) return;

    await onSave(localBio, localLocation);
  };

  useEffect(() => {
    setLocalBio(bio);
    setLocalLocation(location);
  }, [bio, location]);

  return (
    <section
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      aria-labelledby="profile-info-heading"
    >
      <header className="flex items-center mb-6">
        <div
          className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4"
          aria-hidden="true"
        >
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
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

      <form onSubmit={handleSubmit}>
        <fieldset className="space-y-6">
          <legend className="sr-only">Personal Information</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {userName || "Not provided"}
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {userEmail}
              </p>
            </div>
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
              onChange={(e) => setLocalBio(e.target.value)}
              placeholder="Tell others about yourself..."
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
              <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
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
            <button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </fieldset>
      </form>
    </section>
  );
}
