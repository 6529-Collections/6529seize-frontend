import { render, fireEvent } from '@testing-library/react';
import VotingModalButton from '@/components/voting/VotingModalButton';
import { useDropInteractionRules } from '@/hooks/drops/useDropInteractionRules';

jest.mock('@/hooks/drops/useDropInteractionRules');
jest.mock('@/hooks/useWavesMovePhase', () => ({
  useWavesPausedReason: jest.fn(() => null),
}));

const useRules = useDropInteractionRules as jest.Mock;

const drop: any = { id: 'd' };

describe('VotingModalButton', () => {
  it('renders nothing when voting not allowed', () => {
    useRules.mockReturnValue({ canShowVote: false });
    const { container } = render(<VotingModalButton drop={drop} onClick={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onClick when allowed', () => {
    const onClick = jest.fn();
    useRules.mockReturnValue({ canShowVote: true });
    const { getByRole } = render(<VotingModalButton drop={drop} onClick={onClick} />);
    fireEvent.click(getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders custom label content when provided', () => {
    useRules.mockReturnValue({ canShowVote: true });
    const { getByRole } = render(
      <VotingModalButton drop={drop} onClick={jest.fn()}>
        You: 1 TDH
      </VotingModalButton>
    );

    expect(getByRole('button')).toHaveTextContent('You: 1 TDH');
  });
});

describe('VotingModalButton while votes are paused for the move', () => {
  const wavesMove = jest.requireMock('@/hooks/useWavesMovePhase');

  afterEach(() => {
    wavesMove.useWavesPausedReason.mockReturnValue(null);
  });

  it('shows a disabled vote with the reason', () => {
    const onClick = jest.fn();
    wavesMove.useWavesPausedReason.mockReturnValue(
      'Paused for the move to the 6529 Network.'
    );
    useRules.mockReturnValue({ canShowVote: true, voteState: 'PAUSED' });
    const { getByRole } = render(
      <VotingModalButton drop={drop} onClick={onClick} />
    );
    const button = getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName(
      'Vote Paused for the move to the 6529 Network.'
    );
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
