import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveVoting from '../../../../../components/waves/create-wave/voting/CreateWaveVoting';
import { ApiWaveType } from '../../../../../generated/models/ApiWaveType';
import { ApiWaveCreditType } from '../../../../../generated/models/ApiWaveCreditType';

jest.mock('../../../../../components/utils/radio/CommonBorderedRadioButton', () => (props: any) => (
  <button data-testid={`radio-${props.type}`} onClick={() => props.onChange(props.type)}>{props.label}</button>
));

jest.mock('../../../../../components/waves/create-wave/voting/CreateWaveVotingRep', () => () => <div data-testid="rep" />);
jest.mock('../../../../../components/waves/create-wave/voting/NegativeVotingToggle', () => () => <div data-testid="negative" />);
jest.mock('../../../../../components/waves/create-wave/voting/TimeWeightedVoting', () => () => <div data-testid="time-weighted" />);

describe('CreateWaveVoting', () => {
  const baseProps = {
    waveType: ApiWaveType.Rank,
    selectedType: ApiWaveCreditType.Rep,
    category: null,
    profileId: null,
    errors: [],
    onTypeChange: jest.fn(),
    setCategory: jest.fn(),
    setProfileId: jest.fn(),
    timeWeighted: { enabled: false, averagingInterval: 0, averagingIntervalUnit: 'minutes' } as any,
    onTimeWeightedChange: jest.fn(),
  };

  it('returns null when no selected type', () => {
    const { container } = render(<CreateWaveVoting {...baseProps} selectedType={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders rep voting options for rank waves', () => {
    render(<CreateWaveVoting {...baseProps} />);
    expect(screen.getByTestId('rep')).toBeInTheDocument();
    expect(screen.getByTestId('negative')).toBeInTheDocument();
    expect(screen.getByTestId('time-weighted')).toBeInTheDocument();
  });

  it('invokes onTypeChange when radio clicked', async () => {
    const user = userEvent.setup();
    render(<CreateWaveVoting {...baseProps} />);
    await user.click(screen.getByTestId(`radio-${ApiWaveCreditType.Tdh}`));
    expect(baseProps.onTypeChange).toHaveBeenCalledWith(ApiWaveCreditType.Tdh);
  });

  it('omits negative voting for chat waves', () => {
    render(<CreateWaveVoting {...baseProps} waveType={ApiWaveType.Chat} />);
    expect(screen.queryByTestId('negative')).toBeNull();
  });
});
