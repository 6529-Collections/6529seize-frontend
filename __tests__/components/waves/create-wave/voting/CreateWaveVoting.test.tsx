import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveVoting from "@/components/waves/create-wave/voting/CreateWaveVoting";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

const mockTimeWeightedVoting = jest.fn(
  (props: {
    config: {
      enabled: boolean;
      averagingInterval: number;
      averagingIntervalUnit: "minutes" | "hours";
    };
    errorMessage?: string;
    showToggle?: boolean;
    onChange: (config: {
      enabled: boolean;
      averagingInterval: number;
      averagingIntervalUnit: "minutes" | "hours";
    }) => void;
  }) => (
    <button
      type="button"
      data-testid="time-weighted"
      data-enabled={String(props.config.enabled)}
      data-show-toggle={
        props.showToggle === undefined ? "" : String(props.showToggle)
      }
      onClick={() => props.onChange({ ...props.config, enabled: true })}
    >
      {props.errorMessage}
    </button>
  )
);
const mockNegativeVotingToggle = jest.fn(
  (props: {
    allowNegativeVotes: boolean;
    onChange: (allowNegativeVotes: boolean) => void;
    isDisabled?: boolean;
  }) => (
    <button
      type="button"
      data-testid="negative"
      data-disabled={props.isDisabled}
      onClick={() => props.onChange(!props.allowNegativeVotes)}
    >
      {String(props.allowNegativeVotes)}
    </button>
  )
);

jest.mock(
  "@/components/utils/radio/CommonBorderedRadioButton",
  () => (props: any) => (
    <button
      data-testid={`radio-${props.type}`}
      onClick={() => props.onChange(props.type)}
    >
      {props.children}
    </button>
  )
);

jest.mock(
  "@/components/waves/create-wave/voting/CreateWaveVotingRep",
  () => () => <div data-testid="rep" />
);
jest.mock(
  "@/components/waves/create-wave/voting/MemeCardSetPicker",
  () =>
    (props: {
      creditNfts: unknown[];
      memeCount: number | null;
      isMemeCountLoading: boolean;
      isMemeCountError: boolean;
    }) => (
      <div
        data-testid="meme-card-set-picker"
        data-meme-count={props.memeCount ?? ""}
        data-loading={props.isMemeCountLoading}
        data-error={props.isMemeCountError}
      >
        {props.creditNfts.length}
      </div>
    )
);
jest.mock(
  "@/components/waves/create-wave/voting/NegativeVotingToggle",
  () =>
    (props: {
      allowNegativeVotes: boolean;
      onChange: (allowNegativeVotes: boolean) => void;
      isDisabled?: boolean;
    }) =>
      mockNegativeVotingToggle(props)
);
jest.mock(
  "@/components/waves/create-wave/voting/TimeWeightedVoting",
  () => (props: {
    config: {
      enabled: boolean;
      averagingInterval: number;
      averagingIntervalUnit: "minutes" | "hours";
    };
    errorMessage?: string;
    showToggle?: boolean;
    onChange: (config: {
      enabled: boolean;
      averagingInterval: number;
      averagingIntervalUnit: "minutes" | "hours";
    }) => void;
  }) =>
    mockTimeWeightedVoting(props)
);

describe("CreateWaveVoting", () => {
  const baseProps = {
    waveType: ApiWaveType.Rank,
    selectedType: ApiWaveCreditType.Rep,
    category: null,
    profileId: null,
    creditNfts: [],
    creditScope: ApiWaveCreditScope.Wave,
    memeCount: null,
    isMemeCountLoading: false,
    isMemeCountError: false,
    allowNegativeVotes: true,
    maxVotesPerIdentityPerDrop: null,
    approvalThreshold: null,
    approvalThresholdTimeMs: null,
    errors: [],
    onTypeChange: jest.fn(),
    setCategory: jest.fn(),
    setProfileId: jest.fn(),
    setCreditNfts: jest.fn(),
    onCreditScopeChange: jest.fn(),
    onAllowNegativeVotesChange: jest.fn(),
    setMaxVotesPerIdentityPerDrop: jest.fn(),
    setApprovalThreshold: jest.fn(),
    setApprovalThresholdTimeMs: jest.fn(),
    timeWeighted: {
      enabled: false,
      averagingInterval: 0,
      averagingIntervalUnit: "minutes",
    } as any,
    onTimeWeightedChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when no selected type", () => {
    const { container } = render(
      <CreateWaveVoting {...baseProps} selectedType={null} />
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText("Voting power scope")).toBeNull();
  });

  it("renders only vote cap settings for rank waves", () => {
    render(<CreateWaveVoting {...baseProps} />);
    const settingsGrid = screen.getByTestId("create-wave-voting-settings-grid");

    expect(screen.getByTestId("rep")).toBeInTheDocument();
    expect(screen.getByText("Voting power scope")).toBeInTheDocument();
    expect(screen.getByTestId("negative")).toBeInTheDocument();
    expect(screen.getByTestId("time-weighted")).toBeInTheDocument();
    expect(screen.getByLabelText("Vote cap per identity")).toBeInTheDocument();
    expect(screen.queryByLabelText("Approval threshold")).toBeNull();
    expect(screen.queryByLabelText("Minimum time above threshold")).toBeNull();
    expect(settingsGrid).toHaveClass("tw-grid-cols-1");
    expect(settingsGrid).not.toHaveClass("sm:tw-grid-cols-2");
    expect(
      screen.getByTestId("max-votes-per-identity-per-drop-setting")
    ).toHaveClass("tw-rounded-xl", "tw-border-white/5", "tw-bg-iron-900");
    expect(screen.queryByTestId("approval-threshold-setting")).toBeNull();
  });

  it("renders voting power scope from props", () => {
    render(<CreateWaveVoting {...baseProps} />);

    expect(
      screen.getByRole("radio", { name: /^Whole wave/ })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /^Each drop/ })
    ).not.toBeChecked();
  });

  it("updates voting power scope", async () => {
    const user = userEvent.setup();
    const onCreditScopeChange = jest.fn();

    render(
      <CreateWaveVoting
        {...baseProps}
        onCreditScopeChange={onCreditScopeChange}
      />
    );

    await user.click(screen.getByRole("radio", { name: /^Each drop/ }));

    expect(onCreditScopeChange).toHaveBeenCalledWith(ApiWaveCreditScope.Drop);
  });

  it("passes enabled negative voting props from config", async () => {
    const user = userEvent.setup();
    const onAllowNegativeVotesChange = jest.fn();

    render(
      <CreateWaveVoting
        {...baseProps}
        allowNegativeVotes={false}
        onAllowNegativeVotesChange={onAllowNegativeVotesChange}
      />
    );

    const negativeVotingProps = mockNegativeVotingToggle.mock.calls[0]?.[0];

    expect(negativeVotingProps).toMatchObject({
      allowNegativeVotes: false,
      isDisabled: false,
    });
    expect(negativeVotingProps?.onChange).toBe(onAllowNegativeVotesChange);

    await user.click(screen.getByTestId("negative"));

    expect(onAllowNegativeVotesChange).toHaveBeenCalledWith(true);
  });

  it("invokes onTypeChange when radio clicked", async () => {
    const user = userEvent.setup();
    render(<CreateWaveVoting {...baseProps} />);
    await user.click(screen.getByTestId(`radio-${ApiWaveCreditType.Tdh}`));
    expect(baseProps.onTypeChange).toHaveBeenCalledWith(ApiWaveCreditType.Tdh);
  });

  it("renders compact voting option labels", () => {
    const { rerender } = render(<CreateWaveVoting {...baseProps} />);

    expect(
      screen.getByTestId(`radio-${ApiWaveCreditType.TdhPlusXtdh}`)
    ).toHaveTextContent("TDH + XTDH");
    expect(
      screen.getByTestId(`radio-${ApiWaveCreditType.Tdh}`)
    ).toHaveTextContent("TDH");
    expect(
      screen.getByTestId(`radio-${ApiWaveCreditType.Rep}`)
    ).toHaveTextContent("Rep");
    expect(
      screen.getByTestId(`radio-${ApiWaveCreditType.CardSetTdh}`)
    ).toHaveTextContent("Card Set TDH");
    expect(screen.queryByText(/^By /)).toBeNull();

    rerender(
      <CreateWaveVoting {...baseProps} waveType={ApiWaveType.Approve} />
    );

    expect(
      screen.getByTestId(`radio-${ApiWaveCreditType.CardSetTdh}`)
    ).toHaveTextContent("Card Set TDH");
    expect(screen.queryByText(/^By /)).toBeNull();
  });

  it("shows Meme card picker when Card Set TDH is selected", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        selectedType={ApiWaveCreditType.CardSetTdh}
        creditNfts={[{ contract: "contract", token_id: 1 }]}
        memeCount={100}
        isMemeCountLoading={true}
        isMemeCountError={false}
      />
    );

    expect(screen.getByTestId("meme-card-set-picker")).toHaveTextContent("1");
    expect(screen.getByTestId("meme-card-set-picker")).toHaveAttribute(
      "data-meme-count",
      "100"
    );
    expect(screen.getByTestId("meme-card-set-picker")).toHaveAttribute(
      "data-loading",
      "true"
    );
    expect(screen.getByTestId("meme-card-set-picker")).toHaveAttribute(
      "data-error",
      "false"
    );
    expect(screen.queryByTestId("rep")).toBeNull();
  });

  it("omits negative voting for chat waves", () => {
    render(<CreateWaveVoting {...baseProps} waveType={ApiWaveType.Chat} />);
    expect(screen.queryByTestId("negative")).toBeNull();
    expect(screen.queryByLabelText("Vote cap per identity")).toBeNull();
    expect(screen.queryByTestId("time-weighted")).toBeNull();
    expect(screen.queryByLabelText("Approval threshold")).toBeNull();
    expect(screen.queryByLabelText("Minimum time above threshold")).toBeNull();
    expect(screen.queryByTestId("create-wave-voting-settings-grid")).toBeNull();
  });

  it("renders approve voting settings with independent timing controls by default", () => {
    render(<CreateWaveVoting {...baseProps} waveType={ApiWaveType.Approve} />);
    const settingsGrid = screen.getByTestId("create-wave-voting-settings-grid");
    const voteCapInput = screen.getByLabelText("Vote cap per identity");
    const thresholdInput = screen.getByLabelText("Approval threshold");

    expect(settingsGrid).toHaveClass("tw-grid-cols-1");
    expect(settingsGrid).not.toHaveClass("sm:tw-grid-cols-2");
    expect(settingsGrid).toContainElement(voteCapInput);
    expect(settingsGrid).toContainElement(thresholdInput);
    expect(screen.getByTestId("time-weighted")).toHaveAttribute(
      "data-enabled",
      "false"
    );
    expect(screen.getByText("Approval hold")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^No hold/ })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /^Require hold time/ })
    ).not.toBeChecked();
    expect(
      screen.queryByLabelText("Minimum time above threshold")
    ).toBeNull();
    expect(screen.queryByTestId("approval-hold-detail")).toBeNull();
    expect(
      screen.getByTestId("max-votes-per-identity-per-drop-setting")
    ).toHaveClass(
      "tw-rounded-xl",
      "tw-border-white/5",
      "tw-bg-iron-900",
      "tw-shadow-inner",
      "tw-ring-inset"
    );
    expect(screen.getByTestId("approval-threshold-setting")).toHaveClass(
      "tw-rounded-xl",
      "tw-border-white/5",
      "tw-bg-iron-900",
      "tw-shadow-inner",
      "tw-ring-inset"
    );
    expect(
      voteCapInput.compareDocumentPosition(thresholdInput) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("renders approve threshold time when hold is set", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        approvalThresholdTimeMs={60_000}
      />
    );

    expect(
      screen.getByRole("radio", { name: /^Require hold time/ })
    ).toBeChecked();
    expect(
      screen.getByLabelText("Minimum time above threshold")
    ).toBeInTheDocument();
    expect(screen.getByTestId("approval-hold-detail")).toHaveClass(
      "tw-mt-3"
    );
    expect(screen.getByTestId("time-weighted")).toBeInTheDocument();
  });

  it("renders approve threshold time when the stored duration is invalid", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        approvalThresholdTimeMs={0}
      />
    );

    expect(
      screen.getByRole("radio", { name: /^Require hold time/ })
    ).toBeChecked();
    expect(
      screen.getByLabelText("Minimum time above threshold")
    ).toBeInTheDocument();
  });

  it("renders approve time weighted settings separately from approval hold", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        timeWeighted={{
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "hours",
        }}
      />
    );

    expect(screen.getByTestId("time-weighted")).toHaveAttribute(
      "data-enabled",
      "true"
    );
    expect(screen.getByRole("radio", { name: /^No hold/ })).toBeChecked();
    expect(
      screen.queryByLabelText("Minimum time above threshold")
    ).toBeNull();
  });

  it("selecting hold preserves approve time weighted voting", () => {
    const setApprovalThresholdTimeMs = jest.fn();
    const onTimeWeightedChange = jest.fn();

    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        setApprovalThresholdTimeMs={setApprovalThresholdTimeMs}
        onTimeWeightedChange={onTimeWeightedChange}
        timeWeighted={{
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "hours",
        }}
      />
    );

    fireEvent.click(
      screen.getByRole("radio", { name: /^Require hold time/ })
    );

    expect(setApprovalThresholdTimeMs).toHaveBeenCalledWith(60_000);
    expect(onTimeWeightedChange).not.toHaveBeenCalled();
  });

  it("selecting time weighted preserves approve threshold time", () => {
    const setApprovalThresholdTimeMs = jest.fn();
    const onTimeWeightedChange = jest.fn();

    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        approvalThresholdTimeMs={120_000}
        setApprovalThresholdTimeMs={setApprovalThresholdTimeMs}
        onTimeWeightedChange={onTimeWeightedChange}
      />
    );

    fireEvent.click(screen.getByTestId("time-weighted"));

    expect(setApprovalThresholdTimeMs).not.toHaveBeenCalled();
    expect(onTimeWeightedChange).toHaveBeenCalledWith({
      enabled: true,
      averagingInterval: 0,
      averagingIntervalUnit: "minutes",
    });
  });

  it("selecting no hold clears only approve threshold time", () => {
    const setApprovalThresholdTimeMs = jest.fn();
    const onTimeWeightedChange = jest.fn();

    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        approvalThresholdTimeMs={120_000}
        timeWeighted={{
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "hours",
        }}
        setApprovalThresholdTimeMs={setApprovalThresholdTimeMs}
        onTimeWeightedChange={onTimeWeightedChange}
      />
    );

    fireEvent.click(screen.getByRole("radio", { name: /^No hold/ }));

    expect(setApprovalThresholdTimeMs).toHaveBeenCalledWith(null);
    expect(onTimeWeightedChange).not.toHaveBeenCalled();
  });

  it("passes approve time lock duration errors to time weighted voting", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        timeWeighted={{
          enabled: true,
          averagingInterval: 2,
          averagingIntervalUnit: "hours",
        }}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION,
        ]}
      />
    );

    expect(screen.getByTestId("time-weighted")).toHaveTextContent(
      "This interval is longer than the wave duration. Choose a shorter interval, extend the wave end date, or clear the end date."
    );
  });

  it("updates max votes per identity per drop", async () => {
    const user = userEvent.setup();
    const setMaxVotesPerIdentityPerDrop = jest.fn();

    render(
      <CreateWaveVoting
        {...baseProps}
        setMaxVotesPerIdentityPerDrop={setMaxVotesPerIdentityPerDrop}
      />
    );

    await user.type(screen.getByLabelText("Vote cap per identity"), "1");

    expect(setMaxVotesPerIdentityPerDrop).toHaveBeenCalledWith(1);
  });

  it("updates approval threshold for approve waves", () => {
    const setApprovalThreshold = jest.fn();

    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        setApprovalThreshold={setApprovalThreshold}
      />
    );

    fireEvent.change(screen.getByLabelText("Approval threshold"), {
      target: { value: "50" },
    });

    expect(setApprovalThreshold).toHaveBeenCalledWith(50);
  });

  it("updates approval threshold time for approve waves", () => {
    const setApprovalThresholdTimeMs = jest.fn();

    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        approvalThresholdTimeMs={60_000}
        setApprovalThresholdTimeMs={setApprovalThresholdTimeMs}
      />
    );

    fireEvent.change(
      screen.getByLabelText("Minimum time above threshold unit"),
      {
        target: { value: "hours" },
      }
    );
    fireEvent.change(screen.getByLabelText("Minimum time above threshold"), {
      target: { value: "2" },
    });

    expect(setApprovalThresholdTimeMs).toHaveBeenLastCalledWith(7_200_000);
  });

  it("keeps hold timing visible after clearing or entering an invalid duration", () => {
    const thresholdTimeChanges = jest.fn();

    function StatefulVoting() {
      const [approvalThresholdTimeMs, setApprovalThresholdTimeMs] =
        useState<number | null>(120_000);
      const [timeWeighted, setTimeWeighted] = useState(baseProps.timeWeighted);

      return (
        <CreateWaveVoting
          {...baseProps}
          waveType={ApiWaveType.Approve}
          approvalThresholdTimeMs={approvalThresholdTimeMs}
          setApprovalThresholdTimeMs={(value) => {
            thresholdTimeChanges(value);
            setApprovalThresholdTimeMs(value);
          }}
          timeWeighted={timeWeighted}
          onTimeWeightedChange={setTimeWeighted}
        />
      );
    }

    render(<StatefulVoting />);

    fireEvent.change(screen.getByLabelText("Minimum time above threshold"), {
      target: { value: "" },
    });

    expect(thresholdTimeChanges).toHaveBeenLastCalledWith(null);
    expect(
      screen.getByRole("radio", { name: /^Require hold time/ })
    ).toBeChecked();
    expect(screen.getByLabelText("Minimum time above threshold")).toHaveValue(
      ""
    );

    fireEvent.change(screen.getByLabelText("Minimum time above threshold"), {
      target: { value: "1.5" },
    });

    expect(thresholdTimeChanges).toHaveBeenLastCalledWith(0);
    expect(
      screen.getByRole("radio", { name: /^Require hold time/ })
    ).toBeChecked();
    expect(screen.getByLabelText("Minimum time above threshold")).toHaveValue(
      "1.5"
    );
  });

  it("shows approval threshold time errors near the field", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        approvalThresholdTimeMs={60_000}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID,
        ]}
      />
    );

    expect(
      screen.getByText(
        "Enter a whole number greater than 0, or leave blank for immediate approval."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Minimum time above threshold")
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("explains that hold checks the time-weighted score when both are enabled", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        approvalThresholdTimeMs={60_000}
        timeWeighted={{
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "hours",
        }}
      />
    );

    expect(
      screen.getByText(/This hold checks the time-weighted score./)
    ).toBeInTheDocument();
  });
});
