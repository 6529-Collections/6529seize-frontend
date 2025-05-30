import { render, screen } from '@testing-library/react';
import { WinnerBadge } from '../../../../components/waves/drop/WinnerBadge';
import { useDropInteractionRules } from '../../../../hooks/drops/useDropInteractionRules';

jest.mock('../../../../hooks/drops/useDropInteractionRules');
jest.mock('../../../../components/waves/drops/winner/WinnerDropBadge', () => ({ __esModule: true, default: (p: any) => <div data-testid="badge">{p.rank}</div> }));

const useRules = useDropInteractionRules as jest.Mock;

const drop = { id: 'd', winning_context: { decision_time: 1 } } as any;

describe('WinnerBadge', () => {
  it('returns null when no rank', () => {
    useRules.mockReturnValue({ winningRank: null });
    const { container } = render(<WinnerBadge drop={drop} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows badge when rank available', () => {
    useRules.mockReturnValue({ winningRank: 2 });
    render(<WinnerBadge drop={drop} />);
    expect(screen.getByTestId('badge')).toHaveTextContent('2');
  });

  it('respects showBadge prop', () => {
    useRules.mockReturnValue({ winningRank: 1 });
    const { container } = render(<WinnerBadge drop={drop} showBadge={false} />);
    expect(container.firstChild).toBeNull();
  });
});
