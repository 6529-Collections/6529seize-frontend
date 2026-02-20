import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "@/components/auth/Auth";
import { SubmissionStatus } from "@/hooks/useWave";
import { WaveLeaderboardEmptyState } from "@/components/waves/leaderboard/drops/WaveLeaderboardEmptyState";
import React from "react";

jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));
jest.mock("@/components/utils/button/PrimaryButton", () => ({
  __esModule: true,
  default: ({ onClicked, children, disabled }: any) => (
    <button onClick={onClicked} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe("WaveLeaderboardEmptyState", () => {
  const wave = {} as any;
  const { useWave } = require("@/hooks/useWave");
  const renderWithAuth = (
    ui: React.ReactElement,
    authOverrides: Record<string, unknown> = {}
  ) =>
    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "tester" },
            activeProfileProxy: null,
            ...authOverrides,
          } as any
        }
      >
        {ui}
      </AuthContext.Provider>
    );

  beforeEach(() => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
        status: SubmissionStatus.ACTIVE,
      },
    });
  });

  it("shows memes message when memes wave", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: true,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
        status: SubmissionStatus.ACTIVE,
      },
    });
    renderWithAuth(
      <WaveLeaderboardEmptyState wave={wave} onCreateDrop={jest.fn()} />
    );
    expect(screen.getByText("No artwork submissions yet")).toBeInTheDocument();
  });

  it("shows dedicated curation empty state with button", async () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
        status: SubmissionStatus.ACTIVE,
      },
    });
    const onCreateDrop = jest.fn();
    const user = userEvent.setup();
    renderWithAuth(
      <WaveLeaderboardEmptyState wave={wave} onCreateDrop={onCreateDrop} />
    );
    expect(screen.getByText("No curated drops yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Drop" }));
    expect(onCreateDrop).toHaveBeenCalled();
  });

  it("shows Level 10 requirement message for curation waves when not eligible", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: {
        isEligible: false,
        canSubmitNow: false,
        hasReachedLimit: false,
        status: SubmissionStatus.ACTIVE,
      },
    });
    renderWithAuth(
      <WaveLeaderboardEmptyState wave={wave} onCreateDrop={jest.fn()} />
    );
    expect(
      screen.queryByRole("button", { name: "Drop" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Be the first to create a curated drop in this wave")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Curation wave submissions require at least Level 10.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Learn more about Network Levels" })
    ).toHaveAttribute("href", "https://6529.io/network/levels");
  });

  it("shows button in default state", async () => {
    const onCreateDrop = jest.fn();
    const user = userEvent.setup();
    renderWithAuth(
      <WaveLeaderboardEmptyState wave={wave} onCreateDrop={onCreateDrop} />
    );
    await user.click(screen.getByRole("button", { name: "Drop" }));
    expect(onCreateDrop).toHaveBeenCalled();
    expect(screen.getByText("No drops to show")).toBeInTheDocument();
  });

  it("prioritizes memes state when both wave flags are true", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: true,
      isCurationWave: true,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
        status: SubmissionStatus.ACTIVE,
      },
    });
    renderWithAuth(
      <WaveLeaderboardEmptyState wave={wave} onCreateDrop={jest.fn()} />
    );
    expect(screen.getByText("No artwork submissions yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Drop" })
    ).not.toBeInTheDocument();
  });

  it("shows disabled indicator message when user cannot submit", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: false,
        hasReachedLimit: true,
        status: SubmissionStatus.ACTIVE,
      },
    });
    renderWithAuth(
      <WaveLeaderboardEmptyState wave={wave} onCreateDrop={jest.fn()} />
    );
    expect(screen.getByRole("button", { name: "Drop" })).toBeDisabled();
    expect(
      screen.getByText("You have reached the maximum number of drops allowed")
    ).toBeInTheDocument();
  });
});
