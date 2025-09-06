import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SkillsManager from "./SkillsManager";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as useSkillsManagerHook from "@/hooks/useSkillsManager";

// Mock the hook instead of fetch
jest.mock("@/hooks/useSkillsManager");
const mockUseSkillsManager =
  useSkillsManagerHook.useSkillsManager as jest.MockedFunction<
    typeof useSkillsManagerHook.useSkillsManager
  >;

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

const defaultMockReturn = {
  localSkills: mockSkills,
  setLocalSkills: jest.fn(), // Add this missing property
  confirmOpen: false,
  setConfirmOpen: jest.fn(),
  addSkillOpen: false,
  setAddSkillOpen: jest.fn(),
  hasOrderChanged: false,
  isSaving: false,
  feedback: null,
  deletingSkillId: null,
  confirmAddSkill: jest.fn(),
  handleRemoveClick: jest.fn(),
  confirmRemoveSkill: jest.fn(),
  handleSaveOrder: jest.fn(),
  handleReorder: jest.fn(),
  skillToRemove: null,
  setSkillToRemove: jest.fn(),
};

describe("SkillsManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSkillsManager.mockReturnValue(defaultMockReturn);
  });

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
    mockUseSkillsManager.mockReturnValue({
      ...defaultMockReturn,
      localSkills: [],
    });

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
    const mockSetAddSkillOpen = jest.fn();
    mockUseSkillsManager.mockReturnValue({
      ...defaultMockReturn,
      setAddSkillOpen: mockSetAddSkillOpen,
    });

    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ Add New Skill/i }));
    expect(mockSetAddSkillOpen).toHaveBeenCalledWith(true);
  });

  it("calls handleRemoveClick when remove button is clicked", () => {
    const mockHandleRemoveClick = jest.fn();
    mockUseSkillsManager.mockReturnValue({
      ...defaultMockReturn,
      handleRemoveClick: mockHandleRemoveClick,
    });

    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );

    fireEvent.click(screen.getAllByLabelText(/remove/i)[0]);
    expect(mockHandleRemoveClick).toHaveBeenCalledWith("1");
  });

  it("shows feedback message", () => {
    mockUseSkillsManager.mockReturnValue({
      ...defaultMockReturn,
      feedback: { message: "Skill added successfully!", type: "success" },
    });

    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );

    expect(screen.getByText("Skill added successfully!")).toBeInTheDocument();
  });

  it("shows save order button when order changed", () => {
    const mockHandleSaveOrder = jest.fn();
    mockUseSkillsManager.mockReturnValue({
      ...defaultMockReturn,
      hasOrderChanged: true,
      handleSaveOrder: mockHandleSaveOrder,
    });

    renderWithQueryClient(
      <SkillsManager
        skills={mockSkills}
        onSkillsUpdate={jest.fn()}
        userEmail="test@example.com"
      />
    );

    const saveButton = screen.getByRole("button", { name: /save order/i });
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);
    expect(mockHandleSaveOrder).toHaveBeenCalled();
  });
});
