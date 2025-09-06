import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UsernameClaimForm from "./UsernameClaimForm";
import * as useUsernameHook from "@/hooks/useUsername";

// Mock the useUsername hook
jest.mock("@/hooks/useUsername");
const mockUseUsername = useUsernameHook.useUsername as jest.MockedFunction<
  typeof useUsernameHook.useUsername
>;

// Helper function to render with QueryClient
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// Default mock implementation
const defaultMockReturn = {
  validation: {
    isChecking: false,
    isAvailable: null,
    isValid: false,
    error: null,
  },
  rateLimit: null,
  isSubmitting: false,
  validateUsername: jest.fn(),
  sanitizeUsername: jest.fn((input: string) =>
    input.toLowerCase().replace(/[^a-z0-9]/g, "")
  ),
  checkAvailability: jest.fn(),
  claimUsername: jest.fn(),
  currentUsername: null,
  hasUsername: false,
};

describe("UsernameClaimForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUsername.mockReturnValue(defaultMockReturn);
  });

  it("renders the form with initial state", () => {
    renderWithQueryClient(<UsernameClaimForm />);

    expect(screen.getByLabelText(/choose username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("skillseeker")).toBeInTheDocument();
    expect(screen.getByText("0/20 characters")).toBeInTheDocument();
    expect(
      screen.getByText("• 3-20 characters • lowercase letters and numbers only")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /claim username/i })
    ).toBeDisabled();
  });

  it('shows "Change Username" label when user has existing username', () => {
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      hasUsername: true,
      currentUsername: "existinguser",
    });

    renderWithQueryClient(<UsernameClaimForm />);

    expect(screen.getByLabelText(/change username/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update username/i })
    ).toBeInTheDocument();
  });

  it("displays rate limit information when provided", () => {
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      rateLimit: {
        remaining: 2,
        total: 3,
        isNewUser: true,
        resetTime: new Date(Date.now() + 3600 * 1000),
      },
    });

    renderWithQueryClient(<UsernameClaimForm />);

    expect(
      screen.getByText(
        "2 of 3 username changes remaining this month (new user bonus)"
      )
    ).toBeInTheDocument();
  });

  it("sanitizes input and updates character count", async () => {
    const mockSanitize = jest.fn((input: string) =>
      input.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      sanitizeUsername: mockSanitize,
    });

    renderWithQueryClient(<UsernameClaimForm />);

    const raw = "Test@User123!";
    const input = screen.getByPlaceholderText("skillseeker");
    fireEvent.change(input, { target: { value: raw } });

    expect(mockSanitize).toHaveBeenCalledWith(raw);

    // compute expected sanitized string directly in the test
    const expectedSanitized = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    await waitFor(() =>
      expect(
        screen.getByText(`${expectedSanitized.length}/20 characters`)
      ).toBeInTheDocument()
    );
  });

  it("shows loading state while checking availability", () => {
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      validation: {
        isChecking: true,
        isAvailable: null,
        isValid: false,
        error: null,
      },
    });

    renderWithQueryClient(<UsernameClaimForm />);

    expect(screen.getByText("Checking availability...")).toBeInTheDocument();
    expect(screen.getByTestId("loader-icon")).toBeInTheDocument(); // You may need to add test-id to Loader2
  });

  it("shows validation error when username is invalid", () => {
    const mockValidate = jest.fn(
      () => "Username must be at least 3 characters"
    );
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      validateUsername: mockValidate,
    });

    renderWithQueryClient(<UsernameClaimForm />);

    const input = screen.getByPlaceholderText("skillseeker");
    fireEvent.change(input, { target: { value: "ab" } });

    expect(mockValidate).toHaveBeenCalled();
    expect(
      screen.getByText("Username must be at least 3 characters")
    ).toBeInTheDocument();
  });

  it("shows success state when username is available", () => {
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      validation: {
        isChecking: false,
        isAvailable: true,
        isValid: false,
        error: null,
      },
      validateUsername: jest.fn(() => null),
    });

    renderWithQueryClient(<UsernameClaimForm />);

    const input = screen.getByPlaceholderText("skillseeker");
    fireEvent.change(input, { target: { value: "availableuser" } });

    expect(screen.getByText("Username is available!")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /claim username/i })
    ).toBeEnabled();
  });

  it("shows error state when username is taken", () => {
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      validation: {
        isChecking: false,
        isAvailable: false,
        isValid: false,
        error: null,
      },
      validateUsername: jest.fn(() => null),
    });

    renderWithQueryClient(<UsernameClaimForm />);

    const input = screen.getByPlaceholderText("skillseeker");
    fireEvent.change(input, { target: { value: "takenuser" } });

    expect(screen.getByText("Username is already taken")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /claim username/i })
    ).toBeDisabled();
  });

  it("shows preview when username is valid", () => {
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      validation: {
        isChecking: false,
        isAvailable: true,
        isValid: false,
        error: null,
      },
      validateUsername: jest.fn(() => null),
    });

    renderWithQueryClient(<UsernameClaimForm />);

    const input = screen.getByPlaceholderText("skillseeker");
    fireEvent.change(input, { target: { value: "validuser" } });

    expect(screen.getByText("Preview:")).toBeInTheDocument();
    expect(screen.getByText("@validuser")).toBeInTheDocument();
  });

  it("calls checkAvailability after debounce delay", async () => {
    const mockCheckAvailability = jest.fn();
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      checkAvailability: mockCheckAvailability,
    });

    renderWithQueryClient(<UsernameClaimForm />);

    const input = screen.getByPlaceholderText("skillseeker");
    fireEvent.change(input, { target: { value: "testuser" } });

    // Should not be called immediately
    expect(mockCheckAvailability).not.toHaveBeenCalled();

    // Should be called after debounce delay
    await waitFor(
      () => {
        expect(mockCheckAvailability).toHaveBeenCalledWith("testuser");
      },
      { timeout: 600 }
    );
  });

  it("submits form and calls onSuccess when successful", async () => {
    const mockClaimUsername = jest.fn().mockResolvedValue({
      success: true,
      username: "newuser",
    });
    const mockOnSuccess = jest.fn();

    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      validation: {
        isChecking: false,
        isAvailable: true,
        isValid: false,
        error: null,
      },
      validateUsername: jest.fn(() => null),
      claimUsername: mockClaimUsername,
    });

    renderWithQueryClient(<UsernameClaimForm onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText("skillseeker");
    fireEvent.change(input, { target: { value: "newuser" } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /claim username/i })
      ).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /claim username/i }));

    await waitFor(() => {
      expect(mockClaimUsername).toHaveBeenCalledWith("newuser");
      expect(mockOnSuccess).toHaveBeenCalledWith("newuser");
    });
  });

  it("shows submitting state during form submission", async () => {
    const mockClaimUsername = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      validation: {
        isChecking: false,
        isAvailable: true,
        isValid: false,
        error: null,
      },
      validateUsername: jest.fn(() => null),
      claimUsername: mockClaimUsername,
      isSubmitting: true,
    });

    renderWithQueryClient(<UsernameClaimForm />);

    expect(screen.getByRole("button", { name: /claiming.../i })).toBeDisabled();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const mockOnCancel = jest.fn();

    renderWithQueryClient(<UsernameClaimForm onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("does not render cancel button when onCancel is not provided", () => {
    renderWithQueryClient(<UsernameClaimForm />);

    expect(
      screen.queryByRole("button", { name: /cancel/i })
    ).not.toBeInTheDocument();
  });

  it("prevents form submission when username is invalid", async () => {
    const mockClaimUsername = jest.fn();

    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      validation: {
        isChecking: false,
        isAvailable: false,
        isValid: false,
        error: null,
      },
      validateUsername: jest.fn(() => "Invalid username"),
      claimUsername: mockClaimUsername,
    });

    renderWithQueryClient(<UsernameClaimForm />);

    const form = screen
      .getByRole("button", { name: /claim username/i })
      .closest("form");
    fireEvent.submit(form!);

    expect(mockClaimUsername).not.toHaveBeenCalled();
  });

  it("shows current username message when input matches current username", () => {
    mockUseUsername.mockReturnValue({
      ...defaultMockReturn,
      currentUsername: "currentuser",
      hasUsername: true,
    });

    renderWithQueryClient(<UsernameClaimForm />);

    const input = screen.getByPlaceholderText("skillseeker");
    fireEvent.change(input, { target: { value: "currentuser" } });

    expect(
      screen.getByText("This is your current username")
    ).toBeInTheDocument();
  });
});
