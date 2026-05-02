import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import MobileMemesArtSubmissionBtn from "@/components/waves/memes/submission/MobileMemesArtSubmissionBtn";
import { SubmissionStatus, useWave } from "@/hooks/useWave";

jest.mock("@/hooks/useWave");
jest.mock("@/components/waves/memes/MemesArtSubmissionModal", () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="modal">open</div> : null,
}));

const useWaveMock = useWave as jest.Mock;
const baseWave = {} as any;

function setup(waveInfo: any, isSubmissionLocked = false) {
  useWaveMock.mockReturnValue(waveInfo);
  render(
    <MobileMemesArtSubmissionBtn
      wave={baseWave}
      isSubmissionLocked={isSubmissionLocked}
    />
  );
  return screen.getByRole("button");
}

describe("MobileMemesArtSubmissionBtn", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("opens modal when button clicked", () => {
    const button = setup({
      participation: {
        canSubmitNow: true,
        isWithinPeriod: true,
        endTime: Date.now() + 7 * 60 * 60 * 1000,
        isEligible: true,
        hasReachedLimit: false,
        status: SubmissionStatus.ACTIVE,
      },
    });

    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-label", "Submit Work to The Memes");
    fireEvent.click(button);
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("shows closed label when submissions ended", () => {
    const button = setup({
      participation: {
        canSubmitNow: false,
        isWithinPeriod: false,
        endTime: Date.now() - 10_000,
        isEligible: true,
        hasReachedLimit: false,
        status: SubmissionStatus.ENDED,
      },
    });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-label", "Submissions are closed");
  });

  it("disables and does not open when submission is locked", () => {
    const button = setup(
      {
        participation: {
          canSubmitNow: true,
          isWithinPeriod: true,
          endTime: Date.now() + 7 * 60 * 60 * 1000,
          isEligible: true,
          hasReachedLimit: false,
          status: SubmissionStatus.ACTIVE,
        },
      },
      true
    );

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-label", "Submissions are closed");
    fireEvent.click(button);
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("adds urgent style when deadline approaching", async () => {
    setup({
      participation: {
        canSubmitNow: true,
        isWithinPeriod: true,
        endTime: Date.now() + 60_000,
        isEligible: true,
        hasReachedLimit: false,
        status: SubmissionStatus.ACTIVE,
      },
    });

    const button = await screen.findByRole("button", {
      name: "Submit Work to The Memes - Deadline approaching!",
    });

    expect(button).toHaveClass("tw-animate-pulse");
    expect(button).toHaveAttribute(
      "aria-label",
      "Submit Work to The Memes - Deadline approaching!"
    );
  });

  it("closes an open modal when submission becomes locked", () => {
    const waveInfo = {
      participation: {
        canSubmitNow: true,
        isWithinPeriod: true,
        endTime: Date.now() + 7 * 60 * 60 * 1000,
        isEligible: true,
        hasReachedLimit: false,
        status: SubmissionStatus.ACTIVE,
      },
    };
    useWaveMock.mockReturnValue(waveInfo);

    const { rerender } = render(
      <MobileMemesArtSubmissionBtn wave={baseWave} />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("modal")).toBeInTheDocument();

    rerender(
      <MobileMemesArtSubmissionBtn wave={baseWave} isSubmissionLocked={true} />
    );

    expect(screen.queryByTestId("modal")).toBeNull();
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Submissions are closed"
    );
  });
});
