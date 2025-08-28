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
    return <p className="text-center py-10">Loading...</p>;
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
          <SkillsManager skills={skills} onSkillsUpdate={setSkills} />
        </div>
      </div>
    </main>
  );
}
