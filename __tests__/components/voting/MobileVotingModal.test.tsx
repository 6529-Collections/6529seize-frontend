import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import MobileVotingModal from "@/components/voting/MobileVotingModal";
import { SingleWaveDropVoteSubmissionMode } from "@/components/waves/drop/SingleWaveDropVote.types";

jest.mock("@/components/waves/drop/SingleWaveDropVote", () => ({
  __esModule: true,
  SingleWaveDropVote: (props: any) => (
    <button
      data-testid="vote"
      data-has-request-started={String(
        typeof props.onVoteRequestStarted === "function"
      )}
      data-has-success={String(typeof props.onVoteSuccess === "function")}
      data-submission-mode={props.submissionMode}
      onClick={props.onVoteRequestStarted}
    />
  ),
}));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="dialog">
      {props.isOpen ? "open" : "closed"}
      <button data-testid="dialog-close" onClick={props.onClose}>
        close
      </button>
      {props.children}
    </div>
  ),
}));

describe("MobileVotingModal", () => {
  const drop = { id: "d" } as any;

  it("does not mount dialog content while closed", () => {
    render(
      <MobileVotingModal drop={drop} isOpen={false} onClose={jest.fn()} />
    );

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vote")).not.toBeInTheDocument();
  });

  it("closes via dialog close", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<MobileVotingModal drop={drop} isOpen={true} onClose={onClose} />);
    await user.click(screen.getByTestId("dialog-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("passes background submission mode to vote content", () => {
    render(<MobileVotingModal drop={drop} isOpen={true} onClose={jest.fn()} />);

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

  it("closes when vote request starts", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<MobileVotingModal drop={drop} isOpen={true} onClose={onClose} />);
    await user.click(screen.getByTestId("vote"));
    expect(onClose).toHaveBeenCalled();
  });
});
