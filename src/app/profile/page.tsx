"use client";
import AvatarUploader from "@/components/profile/AvatarUploader";
import ProfileInfoForm from "@/components/profile/ProfileInfoForm";
import UsernameManager from "@/components/profile/UsernameManager";
import SkillsManager from "@/components/profile/SkillsManager";
import useProfileData from "@/hooks/useProfileData";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const {
    session,
    status,
    bio,
    location,
    skills,
    username,
    setSkills,
    avatarUrl,
    updateAvatar,
    saveProfile,
    isSaving,
  } = useProfileData();

  const userProvider =
    typeof session?.user?.provider === "string"
      ? session.user.provider
      : "credentials";

  const handleEmailChange = async (newEmail: string) => {
    try {
      const res = await fetch("/api/profile/email/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Show error to user (e.g., rate limit, invalid email, etc.)
        toast.error(data.error || "Failed to request email change.");
        return;
      }

      // Show success message (e.g., "Verification email sent!")
      toast.success("A verification email has been sent to your new address.");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (status === "loading")
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-8">
            <div className="w-1/3 h-10 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="w-1/2 h-5 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="w-1/3 h-5 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Avatar skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 animate-pulse" />
                <div className="w-36 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              {/* Image Preview */}
              <div className="flex items-center gap-6">
                <div className="w-26 h-26 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                {/* Button */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  {/* Feedback/Progress */}
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
            {/* Username skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 animate-pulse" />
                <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div>
                <div className="w-full h-15 mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="w-full h-13 mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="flex justify-center">
                  <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
            {/* Profile info skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 animate-pulse" />
                <div className="w-50 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              {/* Profile Info */}
              <div>
                {/* Name & Email */}
                <div className="flex justify-between mb-3 gap-3">
                  <div className="w-1/2 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="w-1/2 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
                {/* Bio */}
                <div className="my-10">
                  <div className="w-10 h-5 mb-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-full h-35 mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="w-full h-5 mb-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                {/* Location */}
                <div className="mb-10">
                  <div className="w-15 h-5 mb-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-full h-15 mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="w-1/3 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                {/* Button */}
                <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>
            {/* Skills skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 animate-pulse" />
                  <div className="w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div>
                  <div className="w-6 h-6 bg-gray-500 dark:bg-gray-500/30 rounded-full animate-pulse" />
                </div>
              </div>
              {/* Skills list */}
              <div>
                <div className="w-full h-15 mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="w-full h-13 mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                {/* Button */}
                <div className="flex justify-center">
                  <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  if (status === "unauthenticated")
    return (
      <p className="text-center py-10">Please sign in to view your profile.</p>
    );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your profile information and skills
          </p>
          <Link
            href={`/profile/${session?.user?.name}`}
            className="text-sm text-blue-600 hover:underline block mt-2"
          >
            View Public Profile
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AvatarUploader avatarUrl={avatarUrl} onUpload={updateAvatar} />
          <UsernameManager
            currentUsername={username} // Pass fresh username from API
            userEmail={session?.user?.email || undefined}
          />
          <ProfileInfoForm
            bio={bio}
            location={location}
            onSave={saveProfile}
            userName={session?.user?.name || ""}
            userEmail={session?.user?.email || ""}
            userProvider={userProvider}
            isSaving={isSaving}
            onEmailChange={handleEmailChange}
          />
          <SkillsManager
            skills={skills}
            onSkillsUpdate={setSkills}
            userEmail={session?.user?.email || undefined}
          />
        </div>
      </div>
    </main>
  );
}
