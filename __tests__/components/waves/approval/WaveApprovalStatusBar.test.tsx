import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import WaveApprovalStatusBar from "@/components/waves/approval/WaveApprovalStatusBar";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import useDeviceInfo from "@/hooks/useDeviceInfo";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    children,
    isOpen,
    onClose,
    title,
  }: {
    readonly children: React.ReactNode;
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly title?: string;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onClose}>
          Close panel
        </button>
        {children}
      </div>
    ) : null,
}));

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

const makeWave = ({
  creditType = ApiWaveCreditType.TdhPlusXtdh,
  ...waveConfig
}: Record<string, unknown> & {
  readonly creditType?: ApiWaveCreditType;
} = {}) =>
  ({
    participation: { period: {} },
    voting: { credit_type: creditType, period: {} },
    wave: {
      type: ApiWaveType.Approve,
      winning_threshold: 10,
      max_winners: 2,
      ...waveConfig,
    },
  }) as any;

describe("WaveApprovalStatusBar", () => {
  beforeEach(() => {
    useDeviceInfoMock.mockReturnValue({
      hasTouchScreen: false,
      isApp: false,
      isAppleMobile: false,
      isMobileDevice: false,
    });
  });

  it("shows checking when the approved count is unknown", () => {
    const { container } = render(
      <WaveApprovalStatusBar
        approvedCount={null}
        closeStatus={null}
        wave={makeWave()}
      />
    );

    expect(screen.getAllByText("Checking")).toHaveLength(2);
    const statusGroup = screen.getByRole("group", {
      name: "Approval status",
    });
    expect(container.firstElementChild).toHaveClass("tw-flex-none");
    expect(container.firstElementChild).not.toHaveClass("tw-overflow-hidden");
    expect(statusGroup).toHaveClass("tw-flex-1");
    expect(statusGroup.firstElementChild).toHaveClass(
      "tw-grid",
      "tw-grid-cols-2",
      "md:tw-grid-cols-4"
    );
    expect(statusGroup.firstElementChild?.firstElementChild).toHaveClass(
      "tw-flex-col",
      "tw-items-center",
      "tw-text-center"
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

    expect(screen.getByText("Approved drops")).toBeInTheDocument();
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

    expect(screen.getByText("Hold time")).toBeInTheDocument();
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

    expect(screen.getByText("Hold time")).toBeInTheDocument();
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

    const statusGroup = screen.getByRole("group", {
      name: "Approval status",
    });
    const statusItems = statusGroup.firstElementChild;
    const labels = Array.from(statusItems?.children ?? [])
      .map((item) => item.firstElementChild?.textContent)
      .filter(Boolean);

    expect(labels).toEqual([
      "Credit needed",
      "Hold time",
      "Approved drops",
      "Approval window",
    ]);
    expect(screen.getByText("10 TDH + XTDH")).toBeInTheDocument();
    expect(
      within(statusGroup).queryByRole("button", { name: "Approval rules" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Approval rules" })
    ).toBeInTheDocument();
  });

  it("uses the wave credit label in approval rules", () => {
    useDeviceInfoMock.mockReturnValue({
      hasTouchScreen: true,
      isApp: false,
      isAppleMobile: false,
      isMobileDevice: true,
    });

    render(
      <WaveApprovalStatusBar
        approvedCount={1}
        closeStatus={null}
        wave={makeWave({
          creditType: ApiWaveCreditType.Rep,
          winning_threshold_min_duration_ms: 120_000,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Approval rules" }));

    const dialog = screen.getByRole("dialog", { name: "Approval rules" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText(
        "This wave uses Rep credit. A drop is approved when it reaches 10 Rep credit and keeps at least that much credit for 2m."
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Credit needed")).toBeInTheDocument();
    expect(
      screen.getByText(
        "How much Rep credit a drop must reach before it can be approved."
      )
    ).toBeInTheDocument();
  });

  it("explains immediate approval hold time", () => {
    useDeviceInfoMock.mockReturnValue({
      hasTouchScreen: true,
      isApp: false,
      isAppleMobile: false,
      isMobileDevice: true,
    });

    render(
      <WaveApprovalStatusBar
        approvedCount={1}
        closeStatus={null}
        wave={makeWave({
          winning_threshold_min_duration_ms: 0,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Approval rules" }));

    expect(
      screen.getByText(
        "This wave uses TDH + XTDH credit. A drop is approved as soon as it reaches 10 TDH + XTDH credit."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/for Immediate/)).not.toBeInTheDocument();
  });

  it("opens and closes approval rules in a mobile bottom sheet", () => {
    useDeviceInfoMock.mockReturnValue({
      hasTouchScreen: true,
      isApp: false,
      isAppleMobile: false,
      isMobileDevice: true,
    });

    render(
      <WaveApprovalStatusBar
        approvedCount={1}
        closeStatus={null}
        wave={makeWave()}
      />
    );

    expect(
      screen.queryByRole("dialog", { name: "Approval rules" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Approval rules" }));

    expect(
      screen.getByRole("dialog", { name: "Approval rules" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close panel" }));

    expect(
      screen.queryByRole("dialog", { name: "Approval rules" })
    ).not.toBeInTheDocument();
  });
});
