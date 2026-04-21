import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";

describe("ProfileNameWithAiMarker", () => {
  it("includes an accessible AI label while keeping the emoji decorative", () => {
    render(
      <a href="/ai-bot">
        <ProfileNameWithAiMarker classification={ApiProfileClassification.Ai}>
          ai-bot
        </ProfileNameWithAiMarker>
      </a>
    );

    expect(
      screen.getByRole("link", { name: /ai profile ai-bot/i })
    ).toBeInTheDocument();
    expect(screen.getByText("AI profile")).toHaveClass("tw-sr-only");
    expect(screen.getByText("🤖")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not add an AI label for non-AI profiles", () => {
    render(
      <a href="/human">
        <ProfileNameWithAiMarker
          classification={ApiProfileClassification.Pseudonym}
        >
          human
        </ProfileNameWithAiMarker>
      </a>
    );

    expect(screen.getByRole("link", { name: "human" })).toBeInTheDocument();
    expect(screen.queryByText("AI profile")).not.toBeInTheDocument();
    expect(screen.queryByText("🤖")).not.toBeInTheDocument();
  });
});
