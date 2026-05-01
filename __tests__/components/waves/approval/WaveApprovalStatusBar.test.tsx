import { render, screen } from "@testing-library/react";
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
});
