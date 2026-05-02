import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import WaveApprovalStatusBar from "@/components/waves/approval/WaveApprovalStatusBar";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const wave = {
  participation: { period: {} },
  voting: { period: {} },
  wave: {
    type: ApiWaveType.Approve,
    winning_threshold: 10,
    max_winners: 2,
  },
} as any;

describe("WaveApprovalStatusBar", () => {
  it("shows checking when the approved count is unknown", () => {
    render(
      <WaveApprovalStatusBar
        approvedCount={null}
        closeStatus={null}
        wave={wave}
      />
    );

    expect(screen.getAllByText("Checking")).toHaveLength(2);
  });

  it("shows an approval status error and retry action", () => {
    const retryApprovalStatus = jest.fn();

    render(
      <WaveApprovalStatusBar
        approvedCount={null}
        closeStatus={null}
        isApprovalStatusError={true}
        retryApprovalStatus={retryApprovalStatus}
        wave={wave}
      />
    );

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Unable to check approvals")).toBeInTheDocument();
    expect(
      screen.getByText(/Voting and create controls are paused/)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retryApprovalStatus).toHaveBeenCalledTimes(1);
  });
});
