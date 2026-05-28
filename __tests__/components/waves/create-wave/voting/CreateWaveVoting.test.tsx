import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveVoting from "@/components/waves/create-wave/voting/CreateWaveVoting";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

const mockTimeWeightedVoting = jest.fn(
  (props: { errorMessage?: string; showToggle?: boolean }) => (
    <div data-testid="time-weighted" data-show-toggle={props.showToggle}>
      {props.errorMessage}
    </div>
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
  () => (props: { errorMessage?: string; showToggle?: boolean }) =>
    mockTimeWeightedVoting(props)
);

describe("CreateWaveVoting", () => {
  const baseProps = {
    waveType: ApiWaveType.Rank,
    selectedType: ApiWaveCreditType.Rep,
    category: null,
    profileId: null,
    creditNfts: [],
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
  });

  it("renders only vote cap settings for rank waves", () => {
    render(<CreateWaveVoting {...baseProps} />);
    const settingsGrid = screen.getByTestId("create-wave-voting-settings-grid");

    expect(screen.getByTestId("rep")).toBeInTheDocument();
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
    ).toHaveTextContent("Memes TDH");
    expect(screen.queryByText(/^By /)).toBeNull();

    rerender(
      <CreateWaveVoting {...baseProps} waveType={ApiWaveType.Approve} />
    );

    expect(
      screen.getByTestId(`radio-${ApiWaveCreditType.CardSetTdh}`)
    ).toHaveTextContent("Memes TDH");
    expect(screen.queryByText(/^By /)).toBeNull();
  });

  it("shows Meme card picker when Meme Card TDH is selected", () => {
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

  it("renders approve voting settings with immediate timing by default", () => {
    render(<CreateWaveVoting {...baseProps} waveType={ApiWaveType.Approve} />);
    const settingsGrid = screen.getByTestId("create-wave-voting-settings-grid");
    const voteCapInput = screen.getByLabelText("Vote cap per identity");
    const thresholdInput = screen.getByLabelText("Approval threshold");

    expect(settingsGrid).toHaveClass("tw-grid-cols-1");
    expect(settingsGrid).not.toHaveClass("sm:tw-grid-cols-2");
    expect(settingsGrid).toContainElement(voteCapInput);
    expect(settingsGrid).toContainElement(thresholdInput);
    expect(screen.getByText("Approval timing")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^Immediate/ })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /^Minimum time/ })
    ).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: /^Time-weighted/ })
    ).not.toBeChecked();
    expect(
      screen.queryByLabelText("Minimum time above threshold")
    ).toBeNull();
    expect(screen.queryByTestId("time-weighted")).toBeNull();
    expect(screen.queryByTestId("approval-timing-detail")).toBeNull();
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

  it("renders approve threshold time when minimum timing is selected", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
        approvalThresholdTimeMs={60_000}
      />
    );

    expect(
      screen.getByRole("radio", { name: /^Minimum time/ })
    ).toBeChecked();
    expect(
      screen.getByLabelText("Minimum time above threshold")
    ).toBeInTheDocument();
    expect(screen.getByTestId("approval-timing-detail")).toHaveClass(
      "tw-mt-3"
    );
    expect(screen.queryByTestId("time-weighted")).toBeNull();
  });

  it("renders approve time weighted settings without the extra toggle", () => {
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

    expect(
      screen.getByRole("radio", { name: /^Time-weighted/ })
    ).toBeChecked();
    expect(screen.getByTestId("time-weighted")).toHaveAttribute(
      "data-show-toggle",
      "false"
    );
    expect(screen.getByTestId("approval-timing-detail")).toHaveClass(
      "tw-mt-3"
    );
    expect(
      screen.queryByLabelText("Minimum time above threshold")
    ).toBeNull();
  });

  it("selecting minimum timing disables approve time weighted voting", () => {
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

    fireEvent.click(screen.getByRole("radio", { name: /^Minimum time/ }));

    expect(setApprovalThresholdTimeMs).toHaveBeenCalledWith(60_000);
    expect(onTimeWeightedChange).toHaveBeenCalledWith({
      enabled: false,
      averagingInterval: 1,
      averagingIntervalUnit: "hours",
    });
  });

  it("selecting time weighted timing clears approve threshold time", () => {
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

    fireEvent.click(screen.getByRole("radio", { name: /^Time-weighted/ }));

    expect(setApprovalThresholdTimeMs).toHaveBeenCalledWith(null);
    expect(onTimeWeightedChange).toHaveBeenCalledWith({
      enabled: true,
      averagingInterval: 0,
      averagingIntervalUnit: "minutes",
    });
  });

  it("selecting immediate timing clears both approve timing options", () => {
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

    fireEvent.click(screen.getByRole("radio", { name: /^Immediate/ }));

    expect(setApprovalThresholdTimeMs).toHaveBeenCalledWith(null);
    expect(onTimeWeightedChange).toHaveBeenCalledWith({
      enabled: false,
      averagingInterval: 1,
      averagingIntervalUnit: "hours",
    });
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

  it("shows approve timing conflict errors near timing options", () => {
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
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.APPROVAL_TIMING_OPTIONS_MUTUALLY_EXCLUSIVE,
        ]}
      />
    );

    expect(
      screen.getByText(
        "Choose either minimum time above threshold or time-weighted voting."
      )
    ).toBeInTheDocument();
  });
});
