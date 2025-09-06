import { z } from "zod";

// mock DOMPurify to strip HTML tags so sanitizeString behavior is deterministic in tests
jest.mock("isomorphic-dompurify", () => ({
  sanitize: (s: string) =>
    typeof s === "string" ? s.replace(/<[^>]*>/g, "") : s,
}));

const {
  sanitizeString,
  sanitizeAndValidate,
  maskEmail,
  sanitizeUsername,
  sanitizeEmail,
  sanitizeText,
} = require("./sanitize");

describe("sanitize utilities", () => {
  test("sanitizeString handles null/undefined/empty", () => {
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
    expect(sanitizeString("")).toBe("");
  });

  test("sanitizeString removes script tags and control characters", () => {
    const raw = "<script>alert(1)</script> Hello\x00\x07World ";
    const out = sanitizeString(raw);
    expect(out).toContain("Hello");
    expect(out).toContain("World");
    expect(out).not.toMatch(/script/i);
    expect(out).toBe(out.trim());
  });

  test("sanitizeUsername keeps only alphanumeric, lowercases", () => {
    expect(sanitizeUsername("Test@User123!")).toBe("testuser123");
    expect(sanitizeUsername("A B_C")).toBe("abc");
  });

  test("sanitizeEmail strips invalid characters and lowercases", () => {
    expect(sanitizeEmail("A!b@Ex.COM")).toBe("ab@ex.com");
    expect(sanitizeEmail("user+tag@example-domain.COM")).toBe(
      "usertag@example-domain.com"
    );
  });

  test("maskEmail masks local part correctly", () => {
    expect(maskEmail("alice@example.com")).toBe("a***e@example.com");
    expect(maskEmail("ab@example.com")).toBe("a***b@example.com");
    expect(maskEmail("badformat")).toBe("***");
  });

  test("sanitizeText respects maxLength", () => {
    const out = sanitizeText("abcdefghijklmnopqrstuvwxyz", 5);
    expect(out.length).toBeLessThanOrEqual(5);
    expect(out).toBe("abcde");
  });

  test("sanitizeAndValidate sanitizes nested input and validates with zod", () => {
    const schema = z.object({
      name: z.string().min(1),
      tags: z.array(z.string()),
    });
    const input = { name: "<b> Alice </b>", tags: [" one ", "<i>two</i>"] };
    const parsed = sanitizeAndValidate(schema, input);
    expect(parsed.name).toBe("Alice");
    expect(parsed.tags).toEqual(["one", "two"]);
  });

  test("sanitizeAndValidate throws with validation error", () => {
    const schema = z.object({ name: z.string().min(5) });
    expect(() => sanitizeAndValidate(schema, "nope")).toThrow(
      /Validation failed/
    );
  });
});
