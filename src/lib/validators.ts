import { z } from "zod";

export const skillCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Skill name is required")
    .max(50, "Skill name must be less than 50 characters")
    .trim(),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional()
    .nullable(),
  category: z
    .string()
    .max(30, "Category must be less than 30 characters")
    .optional()
    .nullable(),
  experience: z
    .number()
    .min(1, "Experience must be at least 1")
    .max(5, "Experience must be at most 5")
    .optional()
    .nullable(),
});

export const skillUpdateSchema = skillCreateSchema.partial();

export const skillDeleteSchema = z.object({
  id: z.string().min(1, "Skill ID is required"),
});
