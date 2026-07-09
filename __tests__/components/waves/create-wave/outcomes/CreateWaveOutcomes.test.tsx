import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveOutcomes from "@/components/waves/create-wave/outcomes/CreateWaveOutcomes";
import { CreateWaveOutcomeType } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock(
  "@/components/waves/create-wave/outcomes/CreateWaveOutcomeTypes",
  () => ({
    __esModule: true,
    default: () => <div data-testid="types" />,
  })
);

jest.mock(
  "@/components/waves/create-wave/outcomes/manual/CreateWaveOutcomesManual",
  () => ({
    __esModule: true,
    default: () => <div data-testid="manual" />,
  })
);

jest.mock(
  "@/components/waves/create-wave/outcomes/rep/CreateWaveOutcomesRep",
  () => ({
    __esModule: true,
    default: () => <div data-testid="rep" />,
  })
);

jest.mock(
  "@/components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCIC",
  () => ({
    __esModule: true,
    default: () => <div data-testid="cic" />,
  })
);

jest.mock(
  "@/components/waves/create-wave/outcomes/winners/rows/CreateWaveOutcomesRows",
  () => ({
    __esModule: true,
    default: () => <div data-testid="rows" />,
  })
);

jest.mock("@/components/utils/animation/CommonAnimationHeight", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

describe("CreateWaveOutcomes", () => {
  const baseDisplay = {
    customRules: null,
    outcomesVisible: true,
    submissionButtonLabel: null,
    approve: {
      approvalsTabLabel: "",
      approvedTabLabel: "",
    },
  };

  const baseProps = {
    outcomes: [],
    outcomeType: null as CreateWaveOutcomeType | null,
    waveType: ApiWaveType.Approve,
    errors: [],
    dates: {} as any,
    display: baseDisplay,
    maxWinners: null,
    setOutcomeType: jest.fn(),
    setOutcomes: jest.fn(),
    setDisplay: jest.fn(),
    setMaxWinners: jest.fn(),
  };

  it("shows rows list when no outcome type selected", () => {
    render(<CreateWaveOutcomes {...baseProps} />);
    expect(screen.getByTestId("rows")).toBeInTheDocument();
  });

  it("renders manual component when selected", () => {
    render(
      <CreateWaveOutcomes
        {...baseProps}
        outcomeType={CreateWaveOutcomeType.MANUAL}
      />
    );
    expect(screen.getByTestId("manual")).toBeInTheDocument();
  });

  it("shows one global max winners input for approve waves", () => {
    const setMaxWinners = jest.fn();
    render(<CreateWaveOutcomes {...baseProps} setMaxWinners={setMaxWinners} />);

    expect(screen.queryByLabelText("Approval threshold")).toBeNull();
    fireEvent.change(screen.getByLabelText(/Max Winners/), {
      target: { value: "7" },
    });

    expect(setMaxWinners).toHaveBeenCalledWith(7);
  });

  it("explains that max winners is optional", () => {
    render(<CreateWaveOutcomes {...baseProps} />);
    const input = screen.getByLabelText("Max Winners (optional)");
    const label = screen.getByText("Max Winners (optional)");
    const helpText = screen.getByText("Leave blank for unlimited winners.");

    expect(input).toBeInTheDocument();
    expect(helpText).toBeInTheDocument();
    expect(input.parentElement).toContainElement(label);
    expect(input.parentElement).not.toContainElement(helpText);
  });

  it("rejects decimal max winners instead of truncating", () => {
    const setMaxWinners = jest.fn();
    render(<CreateWaveOutcomes {...baseProps} setMaxWinners={setMaxWinners} />);

    fireEvent.change(screen.getByLabelText(/Max Winners/), {
      target: { value: "7.5" },
    });

    expect(setMaxWinners).toHaveBeenCalledWith(null);
    expect(setMaxWinners).not.toHaveBeenCalledWith(7);
  });

  it("hides global max winners input for rank waves", () => {
    render(<CreateWaveOutcomes {...baseProps} waveType={ApiWaveType.Rank} />);

    expect(screen.queryByLabelText(/Max Winners/)).not.toBeInTheDocument();
  });

  it("shows an enabled outcomes-visibility toggle", () => {
    const setDisplay = jest.fn();
    render(<CreateWaveOutcomes {...baseProps} setDisplay={setDisplay} />);

    const toggle = screen.getByRole("checkbox");
    expect(toggle).toBeEnabled();
    expect(toggle).toBeChecked();

    fireEvent.click(toggle);

    expect(setDisplay).toHaveBeenCalledWith({
      ...baseDisplay,
      outcomesVisible: false,
    });
  });

  it("replaces outcome configuration with an explainer for perpetual rank waves", () => {
    render(
      <CreateWaveOutcomes
        {...baseProps}
        waveType={ApiWaveType.Rank}
        dates={{ ongoingRanking: true } as any}
      />
    );

    expect(
      screen.getByText("Outcome is leaderboard position")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("types")).toBeNull();
    expect(screen.queryByTestId("rows")).toBeNull();

    const toggle = screen.getByRole("checkbox");
    expect(toggle).toBeDisabled();
    expect(toggle).toBeChecked();
  });

  it("renders the perpetual toggle checked even when the stored preference is hidden", () => {
    render(
      <CreateWaveOutcomes
        {...baseProps}
        waveType={ApiWaveType.Rank}
        dates={{ ongoingRanking: true } as any}
        display={{ ...baseDisplay, outcomesVisible: false }}
      />
    );

    // The stored preference is preserved for a switch back to scheduled mode,
    // but the perpetual UI always presents the leaderboard as visible.
    const toggle = screen.getByRole("checkbox");
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
  });

  it("keeps outcome configuration for scheduled rank waves", () => {
    render(
      <CreateWaveOutcomes
        {...baseProps}
        waveType={ApiWaveType.Rank}
        dates={{ ongoingRanking: false } as any}
      />
    );

    expect(screen.getByTestId("types")).toBeInTheDocument();
    expect(screen.queryByText("Outcome is leaderboard position")).toBeNull();
  });
});
