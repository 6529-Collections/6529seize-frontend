import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import MyStreamWaveTabsLeaderboard from "@/components/brain/my-stream/MyStreamWaveTabsLeaderboard";
import { BrainView } from "@/components/brain/mobile/brainMobileViews";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: () => ({
    voting: { isCompleted: mockCompleted },
    decisions: { firstDecisionDone: mockFirstDecision },
  }),
}));

const mockApproveLabels = {
  approvals: "Proposals",
  approved: "Approved",
};

jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useApproveWaveCustomTabLabels: () => mockApproveLabels,
  useWaveSubmissionButtonLabel: () => "Drop",
  useWaveSubmissionButtonLabelOverride: () => null,
}));

let mockCompleted = false;
let mockFirstDecision = false;

function renderComponent(view: BrainView = BrainView.DEFAULT, props: any = {}) {
  const onViewChange = jest.fn();
  const registerTabRef = jest.fn();
  const { wave = { wave: { type: ApiWaveType.Rank } }, ...restProps } = props;
  render(
    <MyStreamWaveTabsLeaderboard
      wave={wave as any}
      activeView={view}
      onViewChange={onViewChange}
      registerTabRef={registerTabRef}
      {...restProps}
    />
  );
  return { onViewChange, registerTabRef };
}

describe("MyStreamWaveTabsLeaderboard", () => {
  beforeEach(() => {
    mockCompleted = false;
    mockFirstDecision = false;
    mockApproveLabels.approvals = "Proposals";
    mockApproveLabels.approved = "Approved";
  });

  it("shows leaderboard tab when voting ongoing", () => {
    const { registerTabRef } = renderComponent();
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    expect(registerTabRef).toHaveBeenCalledWith(
      BrainView.LEADERBOARD,
      expect.any(HTMLButtonElement)
    );
    expect(screen.queryByText("Winners")).toBeNull();
  });

  it("shows winners tab after first decision", async () => {
    mockFirstDecision = true;
    const { onViewChange } = renderComponent();
    const button = screen.getByText("Winners");
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onViewChange).toHaveBeenCalledWith(BrainView.WINNERS);
  });

  it("hides leaderboard when voting completed", () => {
    mockCompleted = true;
    renderComponent();
    expect(screen.queryByText("Leaderboard")).toBeNull();
    expect(screen.getByText("Submissions")).toBeInTheDocument();
  });

  it("renders injected content between leaderboard and winners", () => {
    mockFirstDecision = true;
    renderComponent(BrainView.DEFAULT, {
      renderAfterLeaderboard: <button type="button">Sales</button>,
    });

    expect(
      screen.getAllByRole("button").map((button) => button.textContent)
    ).toEqual(["Leaderboard", "Sales", "Winners"]);
  });

  it("routes the primary tab to submissions when voting completed", async () => {
    mockCompleted = true;
    const { onViewChange, registerTabRef } = renderComponent();
    const button = screen.getByText("Submissions");

    expect(registerTabRef).toHaveBeenCalledWith(
      BrainView.SUBMISSIONS,
      expect.any(HTMLButtonElement)
    );

    await userEvent.click(button);
    expect(onViewChange).toHaveBeenCalledWith(BrainView.SUBMISSIONS);
  });

  it("uses approval labels for approve waves", async () => {
    mockCompleted = true;
    const { onViewChange, registerTabRef } = renderComponent(
      BrainView.DEFAULT,
      { wave: { wave: { type: ApiWaveType.Approve } } }
    );

    const approvalsButton = screen.getByText("Proposals");
    const approvedButton = screen.getByText("Approved");

    expect(registerTabRef).toHaveBeenCalledWith(
      BrainView.LEADERBOARD,
      expect.any(HTMLButtonElement)
    );
    expect(screen.queryByText("Submissions")).toBeNull();

    await userEvent.click(approvalsButton);
    expect(onViewChange).toHaveBeenCalledWith(BrainView.LEADERBOARD);

    await userEvent.click(approvedButton);
    expect(onViewChange).toHaveBeenCalledWith(BrainView.WINNERS);
  });

  it("uses custom approval labels for approve waves", () => {
    mockApproveLabels.approvals = "Candidates";
    mockApproveLabels.approved = "Selected";
    mockCompleted = true;

    renderComponent(BrainView.DEFAULT, {
      wave: { wave: { type: ApiWaveType.Approve } },
    });

    expect(screen.getByText("Candidates")).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(screen.queryByText("Proposals")).toBeNull();
    expect(screen.queryByText("Approved")).toBeNull();
  });
});
