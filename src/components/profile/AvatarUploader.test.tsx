import React from "react";
import { render, screen } from "@testing-library/react";

// Mock next/image for Jest
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock useSession
jest.mock("next-auth/react", () => ({
  useSession: () => ({ update: jest.fn() }),
}));

// Control scenario for UploadButton mock
let mockUploadScenario: "success" | "progress" | "error" = "success";

jest.mock("@uploadthing/react", () => ({
  UploadButton: ({
    onClientUploadComplete,
    onUploadProgress,
    onUploadError,
    ...props
  }: any) => (
    <button
      onClick={() => {
        if (mockUploadScenario === "success") {
          onUploadProgress?.(50);
          onClientUploadComplete?.([{ key: "mock-key" }]);
        } else if (mockUploadScenario === "progress") {
          onUploadProgress?.(1);
        } else if (mockUploadScenario === "error") {
          onUploadError?.(new Error("Upload failed"));
        }
      }}
      {...props}
    >
      Change Avatar
    </button>
  ),
}));

test("renders avatar image", () => {
  mockUploadScenario = "success";
  const AvatarUploader = require("./AvatarUploader").default;
  render(
    <AvatarUploader
      avatarUrl="https://example.com/avatar.jpg"
      onUpload={async () => {}}
    />
  );
  expect(screen.getByAltText(/profile avatar/i)).toBeInTheDocument();
});

test("shows feedback message on successful upload", async () => {
  mockUploadScenario = "success";
  const AvatarUploader = require("./AvatarUploader").default;
  render(
    <AvatarUploader
      avatarUrl="https://example.com/avatar.jpg"
      onUpload={async () => {}}
    />
  );
  const button = screen.getByText(/change avatar/i);
  button.click();
  expect(
    await screen.findByText(/avatar updated successfully!/i)
  ).toBeInTheDocument();
});

// test("shows error feedback on upload error", async () => {
//   jest.resetModules();
//   jest.doMock("@uploadthing/react", () => ({
//     UploadButton: ({ onUploadError, ...props }: any) => (
//       <button
//         onClick={() => onUploadError?.(new Error("Upload failed"))}
//         {...props}
//       >
//         Change Avatar
//       </button>
//     ),
//   }));

//   const AvatarUploader = require("./AvatarUploader").default;
//   const { render, screen } = require("@testing-library/react");

//   render(
//     <AvatarUploader
//       avatarUrl="https://example.com/avatar.jpg"
//       onUpload={async () => {}}
//     />
//   );
//   const button = screen.getByText(/change avatar/i);
//   button.click();
//   expect(await screen.findByText(/upload failed/i)).toBeInTheDocument();
// });
