import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveVoting from "@/components/waves/create-wave/voting/CreateWaveVoting";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

const mockTimeWeightedVoting = jest.fn((props: { errorMessage?: string }) => (
  <div data-testid="time-weighted">{props.errorMessage}</div>
));

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
  () => () => <div data-testid="negative" />
);
jest.mock(
  "@/components/waves/create-wave/voting/TimeWeightedVoting",
  () => (props: { errorMessage?: string }) => mockTimeWeightedVoting(props)
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
    maxVotesPerIdentityPerDrop: null,
    approvalThreshold: null,
    errors: [],
    onTypeChange: jest.fn(),
    setCategory: jest.fn(),
    setProfileId: jest.fn(),
    setCreditNfts: jest.fn(),
    setMaxVotesPerIdentityPerDrop: jest.fn(),
    setApprovalThreshold: jest.fn(),
    timeWeighted: {
      enabled: false,
      averagingInterval: 0,
      averagingIntervalUnit: "minutes",
    } as any,
    onTimeWeightedChange: jest.fn(),
  };

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
    expect(settingsGrid).toHaveClass("tw-grid-cols-1");
    expect(settingsGrid).not.toHaveClass("sm:tw-grid-cols-2");
    expect(
      screen.getByTestId("max-votes-per-identity-per-drop-setting")
    ).toHaveClass("tw-rounded-xl", "tw-border-white/5", "tw-bg-iron-900");
    expect(screen.queryByTestId("approval-threshold-setting")).toBeNull();
  });

  it("invokes onTypeChange when radio clicked", async () => {
    const user = userEvent.setup();
    render(<CreateWaveVoting {...baseProps} />);
    await user.click(screen.getByTestId(`radio-${ApiWaveCreditType.Tdh}`));
    expect(baseProps.onTypeChange).toHaveBeenCalledWith(ApiWaveCreditType.Tdh);
  });

  it("renders Meme Card TDH for rank and approve waves", () => {
    const { rerender } = render(<CreateWaveVoting {...baseProps} />);

    expect(
      screen.getByTestId(`radio-${ApiWaveCreditType.CardSetTdh}`)
    ).toHaveTextContent("By Meme Card TDH");

    rerender(
      <CreateWaveVoting {...baseProps} waveType={ApiWaveType.Approve} />
    );

    expect(
      screen.getByTestId(`radio-${ApiWaveCreditType.CardSetTdh}`)
    ).toHaveTextContent("By Meme Card TDH");
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
    expect(screen.queryByTestId("create-wave-voting-settings-grid")).toBeNull();
  });

  it("renders approve voting settings in separate rows", () => {
    render(<CreateWaveVoting {...baseProps} waveType={ApiWaveType.Approve} />);
    const settingsGrid = screen.getByTestId("create-wave-voting-settings-grid");
    const voteCapInput = screen.getByLabelText("Vote cap per identity");
    const thresholdInput = screen.getByLabelText("Approval threshold");

    expect(settingsGrid).toHaveClass("tw-grid-cols-1");
    expect(settingsGrid).not.toHaveClass("sm:tw-grid-cols-2");
    expect(settingsGrid).toContainElement(voteCapInput);
    expect(settingsGrid).toContainElement(thresholdInput);
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
    expect(screen.getByTestId("time-weighted")).toBeInTheDocument();
  });

  it("passes approve time lock duration errors to time weighted voting", () => {
    render(
      <CreateWaveVoting
        {...baseProps}
        waveType={ApiWaveType.Approve}
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
});
