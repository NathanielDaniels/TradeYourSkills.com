import { useState } from "react";
import { toast } from "react-hot-toast";

export function useValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateBio = (bio: string) => {
    if (bio.length > 300) {
      setErrors((prev) => ({
        ...prev,
        bio: "Bio cannot exceed 300 characters.",
      }));
      return false;
    }
    clearError("bio");
    return true;
  };

  const validateLocation = (location: string) => {
    if (!location.trim()) {
      setErrors((prev) => ({ ...prev, location: "Location is required." }));
      return false;
    }
    clearError("location");
    return true;
  };

  const validateSkillName = (skill: string, useToast: boolean = true) => {
    if (!skill.trim()) {
      
      const message = "Skill name is required.";
      handleValidationError("skill", message, useToast);
      return false;
    }
    if (skill.length > 50) {
      const message = "Skill name too long (max 50 chars).";
      handleValidationError("skill", message, useToast);
      return false;
    }
    clearError("skill");
    return true;
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleValidationError = (
    field: string,
    message: string,
    useToast: boolean
  ) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
    if (useToast) toast.error(message);
  };

  return {
    errors,
    validateBio,
    validateLocation,
    validateSkillName,
    clearError,
  };
}
