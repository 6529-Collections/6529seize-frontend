import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import WaveApprovalStatusBar from "@/components/waves/approval/WaveApprovalStatusBar";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const makeWave = (waveConfig: Record<string, unknown> = {}) =>
  ({
    participation: { period: {} },
    voting: { period: {} },
    wave: {
      type: ApiWaveType.Approve,
      winning_threshold: 10,
      max_winners: 2,
      ...waveConfig,
    },
  }) as any;

describe("WaveApprovalStatusBar", () => {
  it("shows checking when the approved count is unknown", () => {
    const { container } = render(
      <WaveApprovalStatusBar
        approvedCount={null}
        closeStatus={null}
        wave={makeWave()}
      />
    );

    expect(screen.getAllByText("Checking")).toHaveLength(2);
    expect(container.firstElementChild).toHaveClass("tw-flex-none");
    expect(container.firstElementChild).not.toHaveClass("tw-overflow-hidden");
    expect(container.firstElementChild?.firstElementChild).toHaveClass(
      "tw-flex-wrap"
    );
  });

  it("shows an approval status error and retry action", () => {
    const retryApprovalStatus = jest.fn();

    render(
      <WaveApprovalStatusBar
        approvedCount={null}
        closeStatus={null}
        isApprovalStatusError={true}
        retryApprovalStatus={retryApprovalStatus}
        wave={makeWave()}
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

  it("shows an approved count error without the paused-controls message", () => {
    const retryApprovalCount = jest.fn();

    render(
      <WaveApprovalStatusBar
        approvedCount={null}
        closeStatus={null}
        isApprovalCountError={true}
        retryApprovalCount={retryApprovalCount}
        wave={makeWave()}
      />
    );

    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to load approved count.")
    ).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(
      screen.queryByText(/Voting and create controls are paused/)
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retryApprovalCount).toHaveBeenCalledTimes(1);
  });

  it("shows immediate approval hold time when the value is missing", () => {
    render(
      <WaveApprovalStatusBar
        approvedCount={1}
        closeStatus={null}
        wave={makeWave()}
      />
    );

    expect(screen.getByText("Min time")).toBeInTheDocument();
    expect(screen.getByText("Immediate")).toBeInTheDocument();
  });

  it.each([
    ["null", null, "Immediate"],
    ["zero", 0, "Immediate"],
    ["invalid", Number.NaN, "Immediate"],
    ["two minutes", 120_000, "2m"],
    ["two hours", 7_200_000, "2h"],
    ["one hour and thirty minutes", 5_400_000, "1h 30m"],
  ])("shows %s approval hold time", (_label, durationMs, expected) => {
    render(
      <WaveApprovalStatusBar
        approvedCount={1}
        closeStatus={null}
        wave={makeWave({
          winning_threshold_min_duration_ms: durationMs,
        })}
      />
    );

    expect(screen.getByText("Min time")).toBeInTheDocument();
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("orders approval status items", () => {
    render(
      <WaveApprovalStatusBar
        approvedCount={1}
        closeStatus={null}
        wave={makeWave({
          winning_threshold_min_duration_ms: 0,
        })}
      />
    );

    const statusItems = screen.getByText("Threshold").parentElement
      ?.parentElement;
    const labels = Array.from(statusItems?.children ?? []).map(
      (item) => item.firstElementChild?.textContent
    );

    expect(labels).toEqual(["Threshold", "Min time", "Approved", "Status"]);
  });
});
