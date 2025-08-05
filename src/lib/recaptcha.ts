export async function getRecaptchaToken(action: string): Promise<string> {
  // Use Google's test key in dev (bypasses real verification)
  if (process.env.NODE_ENV === "development") {
    console.log("[Recaptcha] Development mode - returning test token");
    return "test-recaptcha-token";
  }

  if (typeof grecaptcha === "undefined") {
    throw new Error("reCAPTCHA not loaded");
  }

  return new Promise<string>((resolve, reject) => {
    grecaptcha.ready(async () => {
      try {
        const token = await grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
          { action }
        );
        resolve(token);
      } catch (err) {
        reject(err);
      }
    });
  });
}

//? Usage example in a form submission handler:
// import { getRecaptchaToken } from "@/lib/recaptcha";
// const token = await getRecaptchaToken("submit");
// formData.append("g-recaptcha-response", token);
