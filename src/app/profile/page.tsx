"use client";
import AvatarUploader from "@/components/profile/AvatarUploader";
import ProfileInfoForm from "@/components/profile/ProfileInfoForm";
import SkillsManager from "@/components/profile/SkillsManager";
import useProfileData from "@/hooks/useProfileData";
import Link from "next/link";
import UsernameClaimForm from "@/components/profile/UsernameClaimForm";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const {
    session,
    status,
    bio,
    location,
    skills,
    setSkills,
    avatarUrl,
    updateAvatar,
    saveProfile,
    isSaving,
  } = useProfileData();

  // Handle loading & authentication
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

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <AvatarUploader avatarUrl={avatarUrl} onUpload={updateAvatar} />
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Username</h2>
            <UsernameClaimForm
              onClaim={(username) => {
                console.log("Username claimed:", username);
                toast.success(`Username @${username} claimed successfully!`, {
                  duration: 4000,
                  position: "top-center",
                });
              }}
            />
          </section>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <ProfileInfoForm
            bio={bio}
            location={location}
            onSave={saveProfile}
            userName={session?.user?.name || ""}
            userEmail={session?.user?.email || ""}
            isSaving={isSaving}
          />
          <SkillsManager skills={skills} onSkillsUpdate={setSkills} />
        </div>
      </div>
    </main>
  );
}
