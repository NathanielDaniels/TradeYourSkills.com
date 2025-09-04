import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SkillsManager from "./SkillsManager";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockSkills = [
  { id: "1", name: "React" },
  { id: "2", name: "TypeScript" },
];

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("SkillsManager", () => {
  it("renders the skills list", () => {
    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("shows 'No skills added yet' when empty", () => {
    renderWithQueryClient(
      <SkillsManager
        skills={[]}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );
    expect(screen.getByText(/no skills added yet/i)).toBeInTheDocument();
  });

  it("opens the Add Skill modal", () => {
    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /\+ Add New Skill/i }));
    expect(
      screen.getByRole("heading", { name: /add new skill/i })
    ).toBeInTheDocument();
  });

  it("opens the Remove Skill modal", () => {
    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );
    fireEvent.click(screen.getAllByLabelText(/remove/i)[0]);
    expect(screen.getByText(/remove skill\?/i)).toBeInTheDocument();
  });

  it("calls onSkillsUpdate when a skill is added", async () => {
    const onSkillsUpdate = jest.fn();
    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={onSkillsUpdate}
        userEmail="test@example.com"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /\+ Add New Skill/i }));
    fireEvent.change(screen.getByPlaceholderText(/web design/i), {
      target: { value: "Jest" },
    });
    const addButton = await screen.findByRole("button", {
      name: "confirm action",
    });
    fireEvent.click(addButton);
    await waitFor(() => expect(onSkillsUpdate).toHaveBeenCalled());
  });

  it("calls onSkillsUpdate when a skill is removed", async () => {
    const onSkillsUpdate = jest.fn();
    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={onSkillsUpdate}
        userEmail="test@example.com"
      />
    );
    fireEvent.click(screen.getAllByLabelText(/remove/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm action" }));
    await waitFor(() => expect(onSkillsUpdate).toHaveBeenCalled());
  });

  it("shows feedback message after adding a skill", async () => {
    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /\+ Add New Skill/i }));
    fireEvent.change(screen.getByPlaceholderText(/web design/i), {
      target: { value: "Jest" },
    });
    const addButton = await screen.findByRole("button", {
      name: "confirm action",
    });
    fireEvent.click(addButton);
    expect(await screen.findByText(/skill added/i)).toBeInTheDocument();
  });
});
