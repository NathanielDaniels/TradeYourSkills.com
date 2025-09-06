import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSkillsManager } from "./useSkillsManager";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
  };
});

const toast = require("react-hot-toast").toast;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

function Harness({
  initial = [],
  onSkillsUpdate = () => {},
  userEmail,
}: {
  initial?: { id: string; name: string }[];
  onSkillsUpdate?: (s: any) => void;
  userEmail?: string;
}) {
  const hook = useSkillsManager(initial, onSkillsUpdate, userEmail);
  return (
    <div>
      <div data-testid="localSkills">{JSON.stringify(hook.localSkills)}</div>
      <div data-testid="hasOrderChanged">{String(hook.hasOrderChanged)}</div>
      <div data-testid="isSaving">{String(hook.isSaving)}</div>
      <button
        data-testid="add"
        onClick={() => hook.confirmAddSkill("NewSkill")}
      >
        add
      </button>
      <button data-testid="add-empty" onClick={() => hook.confirmAddSkill("")}>
        add-empty
      </button>
      <button
        data-testid="add-dup"
        onClick={() => hook.confirmAddSkill("duplicate")}
      >
        add-dup
      </button>
      <button
        data-testid="remove-click"
        onClick={() =>
          hook.handleRemoveClick(initial[0] ? initial[0].id : "noop")
        }
      >
        remove-click
      </button>
      <button
        data-testid="confirm-remove"
        onClick={() => hook.confirmRemoveSkill()}
      >
        confirm-remove
      </button>
      <button
        data-testid="reorder"
        onClick={() => hook.handleReorder([...initial].reverse())}
      >
        reorder
      </button>
      <button data-testid="save-order" onClick={() => hook.handleSaveOrder()}>
        save-order
      </button>
      <div data-testid="feedback">
        {hook.feedback ? hook.feedback.message : ""}
      </div>
    </div>
  );
}

describe("useSkillsManager", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it("initializes localSkills from initialSkills and exposes handlers", () => {
    const initial = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
    ];
    renderWithClient(<Harness initial={initial} />);
    expect(screen.getByTestId("localSkills").textContent).toContain(
      '"name":"a"'
    );
    expect(screen.getByTestId("localSkills").textContent).toContain(
      '"name":"b"'
    );
  });

  it("confirmAddSkill adds a skill on successful API response", async () => {
    const newSkill = { id: "3", name: "NewSkill" };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => newSkill,
    } as any);

    const onSkillsUpdate = jest.fn();
    renderWithClient(<Harness initial={[]} onSkillsUpdate={onSkillsUpdate} />);

    fireEvent.click(screen.getByTestId("add"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile/skills",
        expect.any(Object)
      );
      expect(onSkillsUpdate).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Skill added!");
      expect(screen.getByTestId("feedback").textContent).toMatch(/Skill added/);
    });
  });

  it("confirmAddSkill rejects empty name and shows error", async () => {
    renderWithClient(<Harness initial={[]} />);

    fireEvent.click(screen.getByTestId("add-empty"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Skill name cannot be empty.");
      expect(screen.getByTestId("feedback").textContent).toMatch(
        /cannot be empty/
      );
    });
  });

  it("confirmAddSkill rejects duplicates and shows error", async () => {
    const initial = [{ id: "1", name: "duplicate" }];
    renderWithClient(<Harness initial={initial} />);

    fireEvent.click(screen.getByTestId("add-dup"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(screen.getByTestId("feedback").textContent).toMatch(
        /already in your skills list/
      );
    });
  });

  it("confirmAddSkill prevents >10 skills", async () => {
    const ten = Array.from({ length: 10 }).map((_, i) => ({
      id: String(i),
      name: `s${i}`,
    }));
    renderWithClient(<Harness initial={ten} />);

    fireEvent.click(screen.getByTestId("add"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "You can only have up to 10 skills."
      );
      expect(screen.getByTestId("feedback").textContent).toMatch(
        /up to 10 skills/
      );
    });
  });

  it("confirmRemoveSkill calls API and updates local state on success", async () => {
    const initial = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any);

    const onSkillsUpdate = jest.fn();
    renderWithClient(<Harness initial={initial} onSkillsUpdate={onSkillsUpdate} />);

    // click remove (sets skillToRemove), then confirm
    fireEvent.click(screen.getByTestId("remove-click"));
    fireEvent.click(screen.getByTestId("confirm-remove"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile/skills",
        expect.any(Object)
      );
      expect(onSkillsUpdate).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Skill removed!");
    });
  });

  it("handleReorder toggles hasOrderChanged and handleSaveOrder calls API", async () => {
    const initial = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any);

    renderWithClient(<Harness initial={initial} />);

    // reorder (reverse)
    fireEvent.click(screen.getByTestId("reorder"));
    expect(screen.getByTestId("hasOrderChanged").textContent).toBe("true");

    // save -> calls reorder endpoint
    fireEvent.click(screen.getByTestId("save-order"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile/skills/reorder",
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith("Order saved!");
    });
  });
});
