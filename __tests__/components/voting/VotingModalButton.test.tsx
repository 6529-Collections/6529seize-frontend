import { render, fireEvent } from '@testing-library/react';
import VotingModalButton from '@/components/voting/VotingModalButton';
import { useDropInteractionRules } from '@/hooks/drops/useDropInteractionRules';

jest.mock('@/hooks/drops/useDropInteractionRules');

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
});
