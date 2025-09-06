/// <reference types="@testing-library/jest-dom" />;
import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileInfoForm from "./ProfileInfoForm";

test("renders Save Changes button", () => {
  render(
    <ProfileInfoForm
      bio=""
      location=""
      onSave={async () => {}}
      isSaving={false}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
});

test("disables button and shows spinner when saving", () => {
  render(
    <ProfileInfoForm
      bio=""
      location=""
      onSave={async () => {}}
      isSaving={true}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  const button = screen.getByRole("button", { name: /saving/i });
  expect(button).toBeDisabled();
  expect(button).toHaveTextContent(/saving/i);
});

test("renders bio and location fields", () => {
  render(
    <ProfileInfoForm
      bio="My bio"
      location="My location"
      onSave={async () => {}}
      isSaving={false}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  expect(screen.getByDisplayValue("My bio")).toBeInTheDocument();
  expect(screen.getByDisplayValue("My location")).toBeInTheDocument();
});

test("calls onSave when form is submitted", async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  render(
    <ProfileInfoForm
      bio="Bio"
      location="Location"
      onSave={onSave}
      isSaving={false}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  const button = screen.getByText(/Save Changes/i);
  button.click();
  expect(onSave).toHaveBeenCalled();
});

test("button is disabled when isSaving is true", () => {
  render(
    <ProfileInfoForm
      bio=""
      location=""
      onSave={async () => {}}
      isSaving={true}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  expect(screen.getByRole("button")).toBeDisabled();
});

test("renders email field", () => {
  render(
    <ProfileInfoForm
      bio=""
      location=""
      onSave={async () => {}}
      isSaving={false}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
});

test("has accessible role and label for the form", () => {
  render(
    <ProfileInfoForm
      bio=""
      location=""
      onSave={async () => {}}
      isSaving={false}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  const section = screen.getByRole("region", { name: /profile information/i });
  expect(section).toBeInTheDocument();
});

test("Save Changes button is focusable by keyboard", () => {
  render(
    <ProfileInfoForm
      bio=""
      location=""
      onSave={async () => {}}
      isSaving={false}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  const button = screen.getByText(/Save Changes/i);
  button.focus();
  expect(button).toHaveFocus();
});

test("shows bio validation error", () => {
  render(
    <ProfileInfoForm
      bio=""
      location=""
      onSave={async () => {}}
      isSaving={false}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
    />
  );
  const bioInput = screen.getByLabelText(/bio/i) as HTMLInputElement;
  bioInput.value = ""; // Simulate invalid input
  bioInput.dispatchEvent(new Event("input", { bubbles: true }));
  expect(screen.getByText(/bio/i)).toBeInTheDocument();
});

import userEvent from "@testing-library/user-event";
// ...existing imports...

test("shows and triggers Email Change button when email is changed", async () => {
  const onEmailChange = jest
    .fn()
    .mockResolvedValue({ message: "Email change requested" });

  render(
    <ProfileInfoForm
      bio=""
      location=""
      onSave={async () => {}}
      isSaving={false}
      userName="Test User"
      userEmail="test@example.com"
      userProvider="credentials"
      onEmailChange={onEmailChange}
    />
  );

  // Simulate user typing a new email
  const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
  await userEvent.clear(emailInput);
  await userEvent.type(emailInput, "new@example.com");

  // The "Change Email" button should appear
  const changeEmailButton = await screen.findByRole("button", {
    name: /change email/i,
  });
  expect(changeEmailButton).toBeInTheDocument();

  // Click the button
  await userEvent.click(changeEmailButton);
  expect(onEmailChange).toHaveBeenCalledWith("new@example.com");
});
