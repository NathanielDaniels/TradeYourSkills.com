import { z } from "zod";

// User schemas
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

// Listing schemas
export const listingCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters")
    .trim(),
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional()
    .nullable(),
  availability: z
    .string()
    .max(200, "Availability must be less than 200 characters")
    .optional()
    .nullable(),
  skillId: z.string().min(1, "Skill is required"),
  isActive: z.boolean().default(true),
});

export const listingUpdateSchema = listingCreateSchema
  .partial()
  .omit({ skillId: true });

export const listingDeleteSchema = z.object({
  id: z.string().min(1, "Listing ID is required"),
});

export const listingStatusSchema = z.object({
  id: z.string().min(1, "Listing ID is required"),
  isActive: z.boolean(),
});

// Swap request schemas
export const swapRequestCreateSchema = z.object({
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must be less than 500 characters")
    .trim(),
  recipientId: z.string().min(1, "Recipient is required"),
  offeredListingId: z
    .string()
    .min(1, "Offered listing is required")
    .optional()
    .nullable(),
  requestedListingId: z.string().min(1, "Requested listing is required"),
});

export const swapRequestResponseSchema = z.object({
  status: z.enum(["accepted", "declined"]),
  responseMessage: z
    .string()
    .max(300, "Response message must be less than 300 characters")
    .optional()
    .nullable(),
});

export const swapRequestStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "declined", "cancelled"]),
});
