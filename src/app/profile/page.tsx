"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import InputModal from "@/components/InputModal";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useDragAndDrop, type ChangedItem } from "@/hooks/useDragAndDrop";
import { UploadButton } from "@uploadthing/react";
import { type OurFileRouter } from "@/app/api/uploadthing/core";
import ProgressBar from "@/components/ui/ProgressBar";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [originalSkills, setOriginalSkills] = useState<
    { id: string; name: string }[]
  >([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [skillToRemove, setSkillToRemove] = useState<string | null>(null);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    session?.user?.image || "/default-avatar.png"
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch current avatar URL
  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/profile/avatar")
        .then((res) => res.json())
        .then((data) => {
          setAvatarUrl(data.avatar || "/default-avatar.png");
        });
    }
  }, [session]);

  // Fetch profile details
  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          setBio(data.bio || "");
          setLocation(data.location || "");
          setSkills(data.skills || []);
          setOriginalSkills(data.skills || []);
        });
    }
  }, [session]);

  const handleAvatarUpload = async (uploadedUrl: string) => {
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: uploadedUrl }),
    });

    if (res.ok) {
      const data = await res.json();
      setAvatarUrl(data.avatar || "/default-avatar.png");
      toast.success("Avatar updated!");
    } else {
      toast.error("Failed to update avatar.");
    }
  };

  function AvatarUploader({
    onAvatarUploaded,
  }: {
    onAvatarUploaded: (url: string) => void;
  }) {
    const [progress, setProgress] = useState<number | null>(null);
    return (
      <div>
        <UploadButton<OurFileRouter, "avatar">
          endpoint="avatar"
          appearance={{
            button:
              "px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700",
            container: "",
          }}
          onClientUploadComplete={async (res) => {
            setProgress(null);
            const url = res[0].key;
            onAvatarUploaded(url);
          }}
          onUploadError={(error) => {
            setProgress(null);
            toast.error(`Upload failed: ${error.message}`);
          }}
          onUploadProgress={(p) => setProgress(p)}
        />
        {progress !== null && (
          <div className="mt-2 text-xs text-gray-500">
            Uploading: {Math.round(progress * 100)}%
            <ProgressBar progress={progress} />
          </div>
        )}
      </div>
    );
  }

  // Drag and drop logic
  const handleSkillsReorder = (
    newSkills: { id: string; name: string }[],
    _changedItems: ChangedItem[]
  ) => {
    setSkills(newSkills);
    // Check if the order has changed
    const originalOrder = originalSkills.map((s) => s.id).join(",");
    const newOrder = newSkills.map((s) => s.id).join(",");
    setHasOrderChanged(originalOrder !== newOrder);
  };

  const { getDragProps, getDragStyles } = useDragAndDrop({
    items: skills,
    onReorder: handleSkillsReorder,
    getItemId: (skill) => skill.id,
  });

  const Loading = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <span className="text-gray-600 dark:text-gray-300">Loading...</span>
      </div>
    </div>
  );

  const NotAuthenticated = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Authentication Required
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          You must be signed in to view your profile.
        </p>
      </div>
    </div>
  );

  if (session === undefined) return <Loading />;
  if (!session) return <NotAuthenticated />;

  // Save bio & location
  const handleSave = async () => {
    setIsSaving(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, location }),
    });
    setIsSaving(false);
    if (res.ok) {
      toast.success("Profile updated successfully!");
    } else {
      toast.error("Error updating profile, Please try again.");
    }
  };

  // const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onloadend = () => setAvatarPreview(reader.result as string);
  //   reader.readAsDataURL(file);

  //   const formData = new FormData();
  //   formData.append("avatar", file);

  //   const res = await fetch("/api/profile/avatar", {
  //     method: "POST",
  //     body: formData,
  //   });

  //   if (res.ok) {
  //     toast.success("Avatar updated successfully!");
  //   } else {
  //     toast.error("Failed to upload avatar.");
  //   }
  // };

  const handleAddSkill = () => setAddSkillOpen(true);

  const confirmAddSkill = async (skillName: string) => {
    if (!skillName.trim()) return;
    const skillExists = skills.some(
      (skill) => skill.name.toLowerCase() === skillName.trim().toLowerCase()
    );
    if (skillExists) {
      toast.error(
        `You already have "${skillName.trim()}" in your skills list!`
      );
      setAddSkillOpen(false);
      return;
    }
    if (skills.length >= 10) {
      toast.error("You can only have up to 10 skills.");
      setAddSkillOpen(false);
      return;
    }
    const res = await fetch("/api/profile/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: skillName }),
    });
    if (res.ok) {
      const newSkill = await res.json();
      setSkills((prev) => [...prev, newSkill]);
      setOriginalSkills((prev) => [...prev, newSkill]);
      toast.success("Skill added successfully!");
    } else {
      toast.error("Failed to add skill.");
    }
    setAddSkillOpen(false);
  };

  // Open confirm modal for skill removal
  const handleRemoveClick = (skillId: string) => {
    setSkillToRemove(skillId);
    setConfirmOpen(true);
  };

  const confirmRemoveSkill = async () => {
    if (!skillToRemove) return;
    const res = await fetch("/api/profile/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: skillToRemove }),
    });
    if (res.ok) {
      setSkills((prev) => prev.filter((s) => s.id !== skillToRemove));
      setOriginalSkills((prev) => prev.filter((s) => s.id !== skillToRemove));
      toast.success("Skill removed successfully!");
    } else {
      toast.error("Failed to remove skill. Please try again.");
    }
    setConfirmOpen(false);
    setSkillToRemove(null);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    const reorderRes = await fetch("/api/profile/skills/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: skills.map((s) => s.id) }),
    });

    if (reorderRes.ok) {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
        setOriginalSkills(data.skills || []);
        setHasOrderChanged(false);
        toast.success("Order saved!");
      }
    } else {
      toast.error("Failed to save skill order.");
    }
    setIsSaving(false);
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 cursor-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your profile information and skills
            </p>
          </header>

          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Profile Picture
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <Image
                  src={avatarUrl}
                  alt="Profile Avatar"
                  fill
                  className="rounded-full object-cover border border-gray-300"
                />
              </div>
              <div>
                <AvatarUploader onAvatarUploaded={handleAvatarUpload} />
                <p className="text-xs text-gray-500 mt-1">
                  JPG or PNG, max 4MB
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section
              className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
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

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <fieldset className="space-y-6">
                  <legend className="sr-only">Personal Information</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {session.user?.name || "Not provided"}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {session.user?.email}
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
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell others about yourself..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
                      rows={4}
                      aria-describedby="bio-help"
                    />
                    <p
                      id="bio-help"
                      className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                    >
                      Tell your story - help others understand what skills you
                      offer and want to trade
                    </p>
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
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Your city or region..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      aria-describedby="location-help"
                    />
                    <p
                      id="location-help"
                      className="text-xs py-2 text-gray-500 dark:text-gray-400 mt-1"
                    >
                      Help others find you for local trades
                    </p>
                  </div>
                  <footer className="pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed cursor-pointer"
                      aria-describedby={isSaving ? "save-status" : undefined}
                    >
                      {isSaving ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span aria-live="polite" id="save-status">
                            Saving...
                          </span>
                        </span>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </footer>
                </fieldset>
              </form>
            </section>

            <aside
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              aria-labelledby="skills-heading"
            >
              <header className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div
                    className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h2
                    id="skills-heading"
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    Skills
                  </h2>
                </div>
                {hasOrderChanged && (
                  <button
                    onClick={handleSaveOrder}
                    disabled={isSaving}
                    className="px-3 py-1 text-sm rounded bg-blue-500 text-white disabled:bg-blue-300"
                  >
                    {isSaving ? "Saving..." : "Save New Order"}
                  </button>
                )}
                <span
                  className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                  aria-label={`${skills.length} skills total`}
                >
                  {skills.length}
                </span>
              </header>

              {/* Skills List */}
              <section aria-labelledby="skills-list-heading">
                <h3 id="skills-list-heading" className="sr-only">
                  Your Current Skills
                </h3>
                <ul className="space-y-3 mb-4" role="list">
                  {skills.length > 0 ? (
                    skills.map((skill) => {
                      const dragProps = getDragProps(skill);
                      const dragStyles = getDragStyles(skill);
                      return (
                        <li
                          key={skill.id}
                          {...dragProps}
                          className={`flex items-center justify-between p-3 rounded-lg group transition-all duration-200 cursor-move ${
                            dragStyles.isDragOver
                              ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500"
                              : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                          } ${
                            dragStyles.isDragging ? "opacity-50 scale-95" : ""
                          }`}
                        >
                          <div className="flex items-center flex-1">
                            {/* Drag Handle */}
                            <div
                              className="mr-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200"
                              aria-hidden="true"
                              title="Drag to reorder"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 9h8M8 15h8"
                                />
                              </svg>
                            </div>

                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {skill.name}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveClick(skill.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200 cursor-pointer"
                            aria-label={`Remove ${skill.name} skill`}
                            title={`Remove ${skill.name}`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-center py-8">
                      <div
                        className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-8 h-8 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No skills added yet
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                        Add your first skill below
                      </p>
                    </li>
                  )}
                </ul>
              </section>

              {/* Add Skill Button */}
              <footer>
                <button
                  onClick={handleAddSkill}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent group"
                  aria-describedby="add-skill-help"
                >
                  <div className="flex items-center justify-center cursor-pointer">
                    <svg
                      className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add New Skill
                  </div>
                </button>
                <p
                  id="add-skill-help"
                  className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center"
                >
                  Maximum 10 skills • {10 - skills.length} remaining
                </p>
              </footer>
            </aside>
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Remove Skill?"
        message="Are you sure you want to remove this skill? This cannot be undone."
        onConfirm={confirmRemoveSkill}
        onCancel={() => setConfirmOpen(false)}
        showDefaultToast={false}
      />

      <InputModal
        isOpen={addSkillOpen}
        title="Add New Skill"
        message="Enter the name of the skill you want to add."
        placeholder="e.g., Web Design"
        onConfirm={confirmAddSkill}
        onCancel={() => setAddSkillOpen(false)}
      />
    </>
  );
}
