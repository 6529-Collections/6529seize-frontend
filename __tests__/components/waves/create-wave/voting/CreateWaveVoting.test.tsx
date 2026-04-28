import { render, screen } from "@testing-library/react";
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
      {props.label}
    </button>
  )
);

jest.mock(
  "@/components/waves/create-wave/voting/CreateWaveVotingRep",
  () => () => <div data-testid="rep" />
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
    maxVotesPerIdentityPerDrop: null,
    errors: [],
    onTypeChange: jest.fn(),
    setCategory: jest.fn(),
    setProfileId: jest.fn(),
    setMaxVotesPerIdentityPerDrop: jest.fn(),
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

  it("renders rep voting options for rank waves", () => {
    render(<CreateWaveVoting {...baseProps} />);
    expect(screen.getByTestId("rep")).toBeInTheDocument();
    expect(screen.getByTestId("negative")).toBeInTheDocument();
    expect(screen.getByTestId("time-weighted")).toBeInTheDocument();
    expect(screen.getByLabelText("Vote cap per identity")).toBeInTheDocument();
  });

  it("invokes onTypeChange when radio clicked", async () => {
    const user = userEvent.setup();
    render(<CreateWaveVoting {...baseProps} />);
    await user.click(screen.getByTestId(`radio-${ApiWaveCreditType.Tdh}`));
    expect(baseProps.onTypeChange).toHaveBeenCalledWith(ApiWaveCreditType.Tdh);
  });

  it("omits negative voting for chat waves", () => {
    render(<CreateWaveVoting {...baseProps} waveType={ApiWaveType.Chat} />);
    expect(screen.queryByTestId("negative")).toBeNull();
    expect(screen.queryByLabelText("Vote cap per identity")).toBeNull();
    expect(screen.queryByTestId("time-weighted")).toBeNull();
    expect(screen.queryByLabelText("Threshold")).toBeNull();
  });

  it("renders time weighted voting for approve waves", () => {
    render(<CreateWaveVoting {...baseProps} waveType={ApiWaveType.Approve} />);
    expect(screen.queryByLabelText("Threshold")).toBeNull();
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
});
