require("@testing-library/jest-dom");

// Polyfill TextEncoder for Jest
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = require("util").TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = require("util").TextDecoder;
}

// Suppress common React warnings in test output
const suppressedWarnings = [
  "Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`.",
  "Warning: An update to AvatarUploader inside a test was not wrapped in act(...).",
  "Warning: An update to ProfileInfoForm inside a test was not wrapped in act(...).",
  "Warning: Received `true` for a non-boolean attribute `fill`.",
];

const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    suppressedWarnings.some((w) => args[0].includes(w))
  ) {
    return;
  }
  originalError(...args);
};
