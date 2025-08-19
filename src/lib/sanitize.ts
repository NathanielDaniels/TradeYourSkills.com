import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

const createSecureConfig = () => ({
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: false,
  IN_PLACE: false,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOW_SELF_CLOSE_IN_ATTR: false,
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  USE_PROFILES: { html: false, svg: false, svgFilters: false },
});

//Sanitizes string input to prevent XSS attacks
export function sanitizeString(input: unknown): string {
  if (input === null || input === undefined || input === "") return "";
  if (typeof input !== "string") return String(input);

  // Remove null bytes and control characters
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  cleaned = cleaned.replace(/javascript:/gi, "");
  cleaned = cleaned.replace(/data:/gi, "");
  cleaned = cleaned.replace(/vbscript:/gi, "");

  // Decode HTML entities to prevent entity-based bypasses
  cleaned = cleaned.replace(/&#x?[0-9a-f]+;?/gi, "");

  const sanitized = DOMPurify.sanitize(cleaned, createSecureConfig());

  // Additional safety: ensure no script-related content remains
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const finalCleaned = sanitized.replace(scriptPattern, "");

  return finalCleaned.trim();
}

// Sanitizes and validates input with Zod schema
export function sanitizeAndValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    const sanitized = sanitizeInput(data);
    return schema.parse(sanitized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation failed: ${error.issues.map((i) => i.message).join(", ")}`
      );
    }
    throw new Error("Sanitization failed");
  }
}

function sanitizeInput(data: unknown): unknown {
  if (typeof data === "string") {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (data !== null && typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize both keys and values
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
}

export function sanitizeUsername(input: unknown): string {
  const cleaned = sanitizeString(input);
  // Only allow alphanumeric characters for usernames
  return cleaned.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function sanitizeEmail(input: unknown): string {
  const cleaned = sanitizeString(input);
  // Only allow valid email characters
  return cleaned.replace(/[^a-zA-Z0-9@._-]/g, "").toLowerCase();
}

export function sanitizeText(input: unknown, maxLength: number = 1000): string {
  const cleaned = sanitizeString(input);
  return cleaned.slice(0, maxLength);
}
