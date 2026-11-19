import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import VotingModal from "@/components/voting/VotingModal";
import { SingleWaveDropVoteSubmissionMode } from "@/components/waves/drop/SingleWaveDropVote.types";

const mockUseCapacitor = jest.fn();
const mockIsCompactLayout = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => mockUseCapacitor(),
}));

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => mockIsCompactLayout(),
}));

jest.mock("@/components/voting/MobileVotingModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div>
      <input aria-label="Mobile vote draft" defaultValue="0" />
      <button
        data-testid="mobile-voting-modal"
        data-open={String(isOpen)}
        onClick={onClose}
      >
        Close mobile voting
      </button>
    </div>
  ),
}));

jest.mock("@/components/waves/drop/SingleWaveDropVote", () => {
  const MockSingleWaveDropVote = (props: any) => (
    <button
      data-testid="vote"
      data-has-request-started={String(
        typeof props.onVoteRequestStarted === "function"
      )}
      data-has-success={String(typeof props.onVoteSuccess === "function")}
      data-submission-mode={props.submissionMode}
      onClick={props.onVoteRequestStarted}
    />
  );
  MockSingleWaveDropVote.displayName = "MockSingleWaveDropVote";
  return { SingleWaveDropVote: MockSingleWaveDropVote };
});

jest.mock("@/components/waves/memes/submission/layout/ModalLayout", () => {
  const MockModalLayout = (props: any) => (
    <div data-testid="layout">
      <button onClick={props.onCancel}>Cancel</button>
      {props.children}
    </div>
  );
  MockModalLayout.displayName = "MockModalLayout";
  return MockModalLayout;
});

jest.mock("@/components/utils/button/SecondaryButton", () => {
  const MockSecondaryButton = (props: any) => (
    <button onClick={props.onClicked}>{props.children}</button>
  );
  MockSecondaryButton.displayName = "MockSecondaryButton";
  return MockSecondaryButton;
});

describe("VotingModal", () => {
  const drop = { id: "d" } as any;

  beforeEach(() => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false, isIos: false });
    mockIsCompactLayout.mockReturnValue(false);
  });

  it.each([
    {
      platform: "iOS phone",
      isCapacitor: true,
      isIos: true,
      compact: true,
      mobile: true,
      preferMobile: false,
    },
    {
      platform: "wide iOS",
      isCapacitor: true,
      isIos: true,
      compact: false,
      mobile: false,
      preferMobile: false,
    },
    {
      platform: "Android phone",
      isCapacitor: true,
      isIos: false,
      compact: true,
      mobile: false,
      preferMobile: false,
    },
    {
      platform: "mobile browser",
      isCapacitor: false,
      isIos: false,
      compact: true,
      mobile: false,
      preferMobile: false,
    },
    {
      platform: "compact memes panel",
      isCapacitor: false,
      isIos: false,
      compact: true,
      mobile: true,
      preferMobile: true,
    },
    {
      platform: "wide memes panel",
      isCapacitor: false,
      isIos: false,
      compact: false,
      mobile: false,
      preferMobile: false,
    },
  ])(
    "uses the intended voting surface on $platform",
    ({ isCapacitor, isIos, compact, mobile, preferMobile }) => {
      mockUseCapacitor.mockReturnValue({ isCapacitor, isIos });
      mockIsCompactLayout.mockReturnValue(compact);
      const onClose = jest.fn();
      render(
        <VotingModal
          drop={drop}
          isOpen
          onClose={onClose}
          preferMobile={preferMobile}
        />
      );

      if (mobile) {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByTestId("mobile-voting-modal")).toHaveAttribute(
          "data-open",
          "true"
        );
        fireEvent.click(screen.getByTestId("mobile-voting-modal"));
        expect(onClose).toHaveBeenCalledTimes(1);
      } else {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
          screen.queryByTestId("mobile-voting-modal")
        ).not.toBeInTheDocument();
      }
    }
  );

  it("returns null when closed", () => {
    const { container } = render(
      <VotingModal drop={drop} isOpen={false} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("retains the open iPhone sheet and draft across a layout breakpoint", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: true, isIos: true });
    mockIsCompactLayout.mockReturnValue(true);
    const props = { drop, isOpen: true, onClose: jest.fn() };
    const { rerender } = render(<VotingModal {...props} />);
    const draft = screen.getByRole("textbox", { name: "Mobile vote draft" });
    fireEvent.change(draft, { target: { value: "42" } });

    mockIsCompactLayout.mockReturnValue(false);
    rerender(<VotingModal {...props} />);
    expect(screen.getByRole("textbox", { name: "Mobile vote draft" })).toBe(
      draft
    );
    expect(draft).toHaveValue("42");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<VotingModal {...props} isOpen={false} />);
    rerender(<VotingModal {...props} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-voting-modal")).not.toBeInTheDocument();
  });

  it("retains a wide iPhone dialog until it closes", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: true, isIos: true });
    const props = { drop, isOpen: true, onClose: jest.fn() };
    const { rerender } = render(<VotingModal {...props} />);
    const vote = screen.getByTestId("vote");

    mockIsCompactLayout.mockReturnValue(true);
    rerender(<VotingModal {...props} />);
    expect(screen.getByTestId("vote")).toBe(vote);
    expect(screen.queryByTestId("mobile-voting-modal")).not.toBeInTheDocument();

    rerender(<VotingModal {...props} isOpen={false} />);
    rerender(<VotingModal {...props} />);
    expect(screen.getByTestId("mobile-voting-modal")).toBeInTheDocument();
  });

  it("closes when cancel button is clicked", () => {
    const onClose = jest.fn();
    render(<VotingModal drop={drop} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("passes background submission mode to vote content", () => {
    render(<VotingModal drop={drop} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByRole("dialog")).toHaveClass(
      "tw-z-[1020]",
      "tw-bg-gray-700/75"
    );
    expect(screen.getByTestId("vote")).toHaveAttribute(
      "data-submission-mode",
      SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH
    );
    expect(screen.getByTestId("vote")).toHaveAttribute(
      "data-has-request-started",
      "true"
    );
    expect(screen.getByTestId("vote")).toHaveAttribute(
      "data-has-success",
      "false"
    );
  });

  it("closes when vote request starts", () => {
    const onClose = jest.fn();
    render(<VotingModal drop={drop} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("vote"));
    expect(onClose).toHaveBeenCalled();
  });
});
