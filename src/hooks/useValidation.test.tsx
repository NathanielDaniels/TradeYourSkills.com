import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useValidation } from "./useValidation";

jest.mock("react-hot-toast", () => ({ toast: { error: jest.fn() } }));
const toast = require("react-hot-toast").toast;

function Harness() {
  const v = useValidation();
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");

  return (
    <div>
      <input
        placeholder="bio"
        value={bio}
        onChange={(e) => setBio((e.target as HTMLInputElement).value)}
      />
      <button
        data-testid="check-bio"
        onClick={() => {
          const res = v.validateBio(bio);
          // show result for assertions
          (document.getElementById("bio-res") as HTMLElement).textContent =
            String(res);
        }}
      >
        check bio
      </button>
      <div id="bio-res" data-testid="bio-res" />

      <input
        placeholder="location"
        value={location}
        onChange={(e) => setLocation((e.target as HTMLInputElement).value)}
      />
      <button
        data-testid="check-location"
        onClick={() => {
          const res = v.validateLocation(location);
          (document.getElementById("loc-res") as HTMLElement).textContent =
            String(res);
        }}
      >
        check location
      </button>
      <div id="loc-res" data-testid="loc-res" />

      <input
        placeholder="skill"
        value={skill}
        onChange={(e) => setSkill((e.target as HTMLInputElement).value)}
      />
      <button
        data-testid="check-skill"
        onClick={() => {
          const res = v.validateSkillName(skill, true);
          (document.getElementById("skill-res") as HTMLElement).textContent =
            String(res);
        }}
      >
        check skill (toast)
      </button>
      <button
        data-testid="check-skill-no-toast"
        onClick={() => {
          const res = v.validateSkillName(skill, false);
          (document.getElementById("skill-res") as HTMLElement).textContent =
            String(res);
        }}
      >
        check skill (no toast)
      </button>
      <div id="skill-res" data-testid="skill-res" />

      <button
        data-testid="clear-skill"
        onClick={() => {
          v.clearError("skill");
          (document.getElementById("errors") as HTMLElement).textContent =
            JSON.stringify(v.errors);
        }}
      >
        clear skill
      </button>

      <div data-testid="errors">{JSON.stringify({})}</div>
      <div id="errors" data-testid="errors-current">
        {JSON.stringify(v.errors)}
      </div>
    </div>
  );
}

describe("useValidation", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("validateBio accepts short bio and rejects too-long bio", () => {
    render(<Harness />);

    // short bio
    fireEvent.change(screen.getByPlaceholderText("bio"), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByTestId("check-bio"));
    expect(screen.getByTestId("bio-res").textContent).toBe("true");
    expect(screen.getByTestId("errors-current").textContent).not.toContain(
      "bio"
    );

    // too long
    const long = "a".repeat(301);
    fireEvent.change(screen.getByPlaceholderText("bio"), {
      target: { value: long },
    });
    fireEvent.click(screen.getByTestId("check-bio"));
    expect(screen.getByTestId("bio-res").textContent).toBe("false");
    expect(screen.getByTestId("errors-current").textContent).toContain(
      "Bio cannot exceed 300 characters."
    );
  });

  it("validateLocation enforces non-empty location", () => {
    render(<Harness />);

    // empty location
    fireEvent.change(screen.getByPlaceholderText("location"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByTestId("check-location"));
    expect(screen.getByTestId("loc-res").textContent).toBe("false");
    expect(screen.getByTestId("errors-current").textContent).toContain(
      "Location is required."
    );

    // valid location
    fireEvent.change(screen.getByPlaceholderText("location"), {
      target: { value: "NYC" },
    });
    fireEvent.click(screen.getByTestId("check-location"));
    expect(screen.getByTestId("loc-res").textContent).toBe("true");
    expect(screen.getByTestId("errors-current").textContent).not.toContain(
      "location"
    );
  });

  it("validateSkillName shows toast on invalid input (when useToast=true) and not when false", () => {
    render(<Harness />);

    // empty skill -> toast should be called
    fireEvent.change(screen.getByPlaceholderText("skill"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByTestId("check-skill"));
    expect(screen.getByTestId("skill-res").textContent).toBe("false");
    expect(toast.error).toHaveBeenCalledWith("Skill name is required.");
    expect(screen.getByTestId("errors-current").textContent).toContain(
      "Skill name is required."
    );

    jest.clearAllMocks();

    // long skill -> toast called
    const longSkill = "b".repeat(51);
    fireEvent.change(screen.getByPlaceholderText("skill"), {
      target: { value: longSkill },
    });
    fireEvent.click(screen.getByTestId("check-skill"));
    expect(screen.getByTestId("skill-res").textContent).toBe("false");
    expect(toast.error).toHaveBeenCalledWith(
      "Skill name too long (max 50 chars)."
    );

    jest.clearAllMocks();

    // when useToast = false, toast should not be called
    fireEvent.change(screen.getByPlaceholderText("skill"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByTestId("check-skill-no-toast"));
    expect(screen.getByTestId("skill-res").textContent).toBe("false");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("clearError removes an error field", () => {
    render(<Harness />);

    // set a skill error first
    fireEvent.change(screen.getByPlaceholderText("skill"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByTestId("check-skill"));
    expect(screen.getByTestId("errors-current").textContent).toContain(
      "Skill name is required."
    );

    // clear it
    fireEvent.click(screen.getByTestId("clear-skill"));
    // after clearError we update the displayed errors via handler, expect no skill error
    expect(screen.getByTestId("errors-current").textContent).not.toContain(
      "Skill name is required."
    );
  });
});
