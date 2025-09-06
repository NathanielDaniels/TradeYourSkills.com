import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useUsername } from "./useUsername";

// mocks
jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({ data: null, update: jest.fn() })),
}));

const { useSession } = require("next-auth/react");
const toast = require("react-hot-toast").toast;

function Harness() {
  const h = useUsername();
  const [value, setValue] = useState("");
  return (
    <div>
      <input
        placeholder="username"
        value={value}
        onChange={(e) => setValue((e.target as HTMLInputElement).value)}
      />
      <div data-testid="sanitized">{h.sanitizeUsername(value)}</div>
      <div data-testid="validation">
        {String(h.validateUsername(h.sanitizeUsername(value)))}
      </div>
      <div data-testid="isChecking">{String(h.validation.isChecking)}</div>
      <div data-testid="isAvailable">{String(h.validation.isAvailable)}</div>
      <button
        data-testid="check"
        onClick={() => h.checkAvailability(h.sanitizeUsername(value))}
      >
        check
      </button>
      <button data-testid="claim" onClick={() => h.claimUsername(value)}>
        claim
      </button>
      <div data-testid="rateLimit">
        {h.rateLimit ? JSON.stringify(h.rateLimit) : ""}
      </div>
      <div data-testid="isSubmitting">{String(h.isSubmitting)}</div>
    </div>
  );
}

describe("useUsername (hook)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it("sanitizes and validates input client-side", () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText("username");
    fireEvent.change(input, { target: { value: "Test@User123!" } });

    expect(screen.getByTestId("sanitized").textContent).toBe("testuser123");
    // validateUsername returns null for valid sanitized value; stringify gives "null"
    expect(screen.getByTestId("validation").textContent).toBe("null");
  });

  it("checkAvailability sets isAvailable when API returns available", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ available: true }),
    } as any);

    render(<Harness />);
    const input = screen.getByPlaceholderText("username");
    fireEvent.change(input, { target: { value: "goodname" } });

    fireEvent.click(screen.getByTestId("check"));

    // isChecking flips while awaiting, then isAvailable true
    await waitFor(() =>
      expect(screen.getByTestId("isAvailable").textContent).toBe("true")
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/profile/username/check",
      expect.any(Object)
    );
  });

  it("claimUsername success updates session and shows toast + parses rate limit", async () => {
    const mockUpdate = jest.fn();
    useSession.mockReturnValue({
      data: { user: { username: "old" } },
      update: mockUpdate,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: "newuser" }),
      headers: {
        get: (k: string) => {
          if (k === "X-RateLimit-Limit") return "3";
          if (k === "X-RateLimit-Remaining") return "2";
          if (k === "X-RateLimit-Reset") return `${Date.now()}`;
          return null;
        },
      },
    } as any);

    render(<Harness />);
    fireEvent.change(screen.getByPlaceholderText("username"), {
      target: { value: "NewUser" },
    });

    fireEvent.click(screen.getByTestId("claim"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile/username/claim",
        expect.any(Object)
      );
      expect(mockUpdate).toHaveBeenCalledWith({ username: "newuser" });
      expect(toast.success).toHaveBeenCalled();
      // rateLimit should be set and rendered
      expect(screen.getByTestId("rateLimit").textContent).toContain(
        '"remaining":2'
      );
    });
  });

  it("claimUsername short-circuits on client validation and calls toast.error", async () => {
    useSession.mockReturnValue({
      data: { user: { username: "old" } },
      update: jest.fn(),
    });

    // spy on fetch to ensure it's not called
    global.fetch = jest.fn();

    render(<Harness />);
    fireEvent.change(screen.getByPlaceholderText("username"), {
      target: { value: "ab" },
    });

    fireEvent.click(screen.getByTestId("claim"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
