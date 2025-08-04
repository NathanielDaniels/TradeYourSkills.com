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

  useEffect(() => {
    setLocalSkills(initialSkills);
    setOriginalSkills(initialSkills);
  }, [initialSkills]);

  const { errors, validateSkillName } = useValidation();

  const confirmAddSkill = async (skillName: string) => {
    if (!validateSkillName(skillName)) return;
    if (
      localSkills.some(
        (s) => s.name.toLowerCase() === skillName.trim().toLowerCase()
      )
    ) {
      toast.error(`"${skillName}" is already in your skills list.`);
      return;
    }
    if (localSkills.length >= 10) {
      toast.error("You can only have up to 10 skills.");
      return;
    }
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
    } else {
      toast.error("Failed to add skill.");
    }
    setAddSkillOpen(false);
  };

  const handleRemoveClick = (skillId: string) => {
    setSkillToRemove(skillId);
    setConfirmOpen(true);
  };


  const confirmRemoveSkill = async () => {
    if (!skillToRemove || deletingSkillId) return;
    setDeletingSkillId(skillToRemove);
    try {
      const res = await fetch("/api/profile/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: skillToRemove }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to remove skill.");
        return;
      }

      // Only update local state after backend confirms success
      const updated = localSkills.filter((s) => s.id !== skillToRemove);
      setLocalSkills(updated);
      setOriginalSkills(updated);
      onSkillsUpdate(updated);
      toast.success("Skill removed!");
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Something went wrong while deleting the skill.");
    } finally {
      setConfirmOpen(false);
      setSkillToRemove(null);
      setDeletingSkillId(null);
    }
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    const res = await fetch("/api/profile/skills/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: localSkills.map((s) => s.id) }),
    });
    if (res.ok) {
      setOriginalSkills(localSkills);
      setHasOrderChanged(false);
      toast.success("Order saved!");
    } else {
      toast.error("Failed to save order.");
    }
    setIsSaving(false);
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
    confirmAddSkill,
    handleRemoveClick,
    confirmRemoveSkill,
    handleSaveOrder,
    handleReorder,
    errors,
  };
}
