// src/types/global.d.ts
declare global {
  interface Window {
    grecaptcha: ReCaptchaV2.ReCaptcha;
  }
  var grecaptcha: ReCaptchaV2.ReCaptcha;
}

export {};
