import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useValidation } from "@/hooks/useValidation";

export default function useProfileData() {
  const { data: session, status } = useSession();
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.png");
  const [isSaving, setIsSaving] = useState(false);

  const { errors, validateBio, validateLocation } = useValidation();

  // Fetch avatar
  useEffect(() => {
    if (status === "authenticated" && session.user?.email) {
      fetch("/api/profile/avatar")
        .then((res) => res.json())
        .then((data) => {
          let avatar = data.avatar;
          if (avatar && !avatar.startsWith("http")) {
            avatar = `https://utfs.io/f/${avatar}`;
          }
          setAvatarUrl(avatar || "/default-avatar.png");
        });
    }
  }, [status, session]);

  // Fetch profile data
  useEffect(() => {
    if (status === "authenticated" && session.user?.email) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          setBio(data.bio || "");
          setLocation(data.location || "");
          setSkills(data.skills || []);
        });
    }
  }, [status, session]);

  const updateAvatar = async (uploadedUrl: string): Promise<void> => {
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

  const saveProfile = async (newBio: string, newLocation: string) => {
    const isBioValid = validateBio(newBio);
    const isLocationValid = validateLocation(newLocation);

    if (!isBioValid || !isLocationValid) {
      toast.error("Please fix validation errors before saving.");
      return;
    }

    setIsSaving(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: newBio, location: newLocation }),
    });
    setIsSaving(false);

    if (res.ok) {
      setBio(newBio);
      setLocation(newLocation);
      toast.success("Profile updated successfully!");
    } else {
      toast.error("Error updating profile. Please try again.");
    }
  };

  return {
    session,
    status,
    bio,
    setBio,
    location,
    setLocation,
    skills,
    setSkills,
    avatarUrl,
    updateAvatar,
    saveProfile,
    isSaving,
    errors
  };
}
