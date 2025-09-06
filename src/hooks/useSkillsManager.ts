import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface Skill {
  id: string;
  name: string;
}

export function useSkillsManager(
  initialSkills: Skill[],
  onSkillsUpdate: (skills: Skill[]) => void,
  userEmail: string | undefined
) {
  const [localSkills, setLocalSkills] = useState<Skill[]>(initialSkills);
  const [originalSkills, setOriginalSkills] = useState<Skill[]>(initialSkills);
  const [skillToRemove, setSkillToRemove] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setLocalSkills(initialSkills);
    setOriginalSkills(initialSkills);
  }, [initialSkills]);

  const addSkillMutation = useMutation({
    mutationFn: async (skillName: string) => {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: skillName }),
      });
      if (!res.ok) throw new Error("Failed to add skill");
      return res.json();
    },
    onSuccess: (newSkill: Skill) => {
      queryClient.invalidateQueries({ queryKey: ["profile", userEmail] });
      const updated = [...localSkills, newSkill];
      setLocalSkills(updated);
      setOriginalSkills(updated);
      onSkillsUpdate(updated);
      toast.success("Skill added!");
      setFeedback({ message: "Skill added successfully!", type: "success" });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add skill.");
      setFeedback({
        message: error.message || "Failed to add skill.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const res = await fetch("/api/profile/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: skillId }),
      });
      if (!res.ok) throw new Error("Failed to remove skill");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userEmail] });
      const updated = localSkills.filter((s) => s.id !== skillToRemove);
      setLocalSkills(updated);
      setOriginalSkills(updated);
      onSkillsUpdate(updated);
      setFeedback({
        message: "Skill removed successfully!",
        type: "success",
      });
      toast.success("Skill removed!");
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove skill.");
      setFeedback({
        message: error.message || "Failed to remove skill.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const reorderSkillsMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const res = await fetch("/api/profile/skills/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder skills");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userEmail] });
      setOriginalSkills(localSkills);
      setHasOrderChanged(false);
      toast.success("Order saved!");
      setFeedback({ message: "Order saved!", type: "success" });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save order.");
      setFeedback({
        message: error.message || "Failed to save order.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Handlers
  const confirmAddSkill = async (skillName: string): Promise<boolean> => {
    if (localSkills.length >= 10) {
      toast.error("You can only have up to 10 skills.");
      setFeedback({
        message: "You can only have up to 10 skills.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return false;
    }
    if (
      localSkills.some(
        (s) => s.name.trim().toLowerCase() === skillName.trim().toLowerCase()
      )
    ) {
      toast.error(`"${skillName}" is already in your skills list.`);
      setFeedback({
        message: `"${skillName}" is already in your skills list.`,
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return false;
    }
    if (!skillName.trim()) {
      toast.error("Skill name cannot be empty.");
      setFeedback({
        message: "Skill name cannot be empty.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return false;
    }
    try {
      setAddSkillOpen(false);
      await addSkillMutation.mutateAsync(skillName);
      return true;
    } catch {
      return false;
    }
  };

  const handleRemoveClick = (skillId: string) => {
    setSkillToRemove(skillId);
    setConfirmOpen(true);
  };

  const confirmRemoveSkill = async (): Promise<boolean> => {
    if (!skillToRemove || deletingSkillId) return false;
    setDeletingSkillId(skillToRemove);
    setFeedback(null);
    try {
      await removeSkillMutation.mutateAsync(skillToRemove);
      setConfirmOpen(false);
      setSkillToRemove(null);
      setDeletingSkillId(null);
      return true;
    } catch {
      setDeletingSkillId(null);
      return false;
    }
  };

  const handleSaveOrder = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      await reorderSkillsMutation.mutateAsync(localSkills.map((s) => s.id));
      setIsSaving(false);
      return true;
    } catch {
      setIsSaving(false);
      return false;
    }
  };

  // Reorder Handler
  const handleReorder = (newSkills: Skill[]) => {
    setLocalSkills(newSkills);
    const originalOrder = originalSkills.map((s) => s.id).join(",");
    const newOrder = newSkills.map((s) => s.id).join(",");
    setHasOrderChanged(originalOrder !== newOrder);
  };

  return {
    localSkills,
    setLocalSkills,
    confirmOpen,
    setConfirmOpen,
    addSkillOpen,
    setAddSkillOpen,
    hasOrderChanged,
    isSaving,
    feedback,
    deletingSkillId,
    handleRemoveClick,
    confirmAddSkill,
    confirmRemoveSkill,
    handleSaveOrder,
    handleReorder,
    skillToRemove,
    setSkillToRemove,
  };
}
