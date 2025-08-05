import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useValidation } from "./useValidation";

interface Skill {
  id: string;
  name: string;
}

export function useSkillsManager(
  initialSkills: Skill[],
  onSkillsUpdate: (skills: Skill[]) => void
) {
  const [localSkills, setLocalSkills] = useState<Skill[]>(initialSkills);
  const [originalSkills, setOriginalSkills] = useState<Skill[]>(initialSkills);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [skillToRemove, setSkillToRemove] = useState<string | null>(null);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    setLocalSkills(initialSkills);
    setOriginalSkills(initialSkills);
  }, [initialSkills]);

  const { errors, validateSkillName } = useValidation();

  const confirmAddSkill = async (skillName: string): Promise<boolean> => {
    if (!validateSkillName(skillName)) return false;

    if (
      localSkills.some(
        (s) => s.name.toLowerCase() === skillName.trim().toLowerCase()
      )
    ) {
      toast.error(`"${skillName}" is already in your skills list.`);
      return false;
    }
    if (localSkills.length >= 10) {
      toast.error("You can only have up to 10 skills.");
      return false;
    }

    try {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: skillName }),
      });

      if (res.ok) {
        const newSkill = await res.json();
        const updated = [...localSkills, newSkill];
        setLocalSkills(updated);
        setOriginalSkills(updated);
        onSkillsUpdate(updated);
        toast.success("Skill added!");
        setFeedback({ message: "Skill added successfully!", type: "success" });
        return true;
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to add skill.");
        setFeedback({ message: errorData.error || "Failed to add skill.", type: "error" });
        return false;
      }
    } catch (error) {
      toast.error("Something went wrong while adding the skill.");
      setFeedback({ message: "Something went wrong while adding the skill.", type: "error" });
      return false;
    } finally {
      setAddSkillOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleRemoveClick = (skillId: string) => {
    setSkillToRemove(skillId);
    setConfirmOpen(true);
  };

  const confirmRemoveSkill = async () => {
    if (!skillToRemove || deletingSkillId) return false;
    setDeletingSkillId(skillToRemove);
    setFeedback(null);
    try {
      const res = await fetch("/api/profile/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: skillToRemove }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.error || "Failed to remove skill.";
        setFeedback({
          message: errorMessage,
          type: "error",
        });
        toast.error(errorMessage);
        return;
      }

      // Only update local state after backend confirms success
      const updated = localSkills.filter((s) => s.id !== skillToRemove);
      setLocalSkills(updated);
      setOriginalSkills(updated);
      onSkillsUpdate(updated);
      setFeedback({
        message: "Skill removed successfully!",
        type: "success",
      });
      toast.success("Skill removed!");
      return true;
    } catch (error) {
      console.error("Error deleting skill:", error);
      setFeedback({
        message: "Unexpected error deleting skill.",
        type: "error",
      });
      toast.error("Something went wrong while deleting the skill.");
      return false;
    } finally {
      setConfirmOpen(false);
      setSkillToRemove(null);
      setDeletingSkillId(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSaveOrder = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/skills/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: localSkills.map((s) => s.id) }),
      });
      if (res.ok) {
        setOriginalSkills(localSkills);
        setHasOrderChanged(false);
        toast.success("Order saved!");
        return true;
      } else {
        toast.error("Failed to save order.");
        return false;
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = (newSkills: Skill[]) => {
    setLocalSkills(newSkills);
    const originalOrder = originalSkills.map((s) => s.id).join(",");
    const newOrder = newSkills.map((s) => s.id).join(",");
    setHasOrderChanged(originalOrder !== newOrder);
  };

  return {
    localSkills,
    confirmOpen,
    setConfirmOpen,
    skillToRemove,
    addSkillOpen,
    setAddSkillOpen,
    hasOrderChanged,
    isSaving,
    deletingSkillId,
    feedback,
    confirmAddSkill,
    handleRemoveClick,
    confirmRemoveSkill,
    handleSaveOrder,
    handleReorder,
    errors,
  };
}
