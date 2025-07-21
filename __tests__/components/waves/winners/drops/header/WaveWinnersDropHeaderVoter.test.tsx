import { render, screen } from '@testing-library/react';
import WaveWinnersDropHeaderVoter from '../../../../../../components/waves/winners/drops/header/WaveWinnersDropHeaderVoter';

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

jest.mock('../../../../../../helpers/image.helpers', () => ({
  getScaledImageUri: jest.fn(() => 'scaled.jpg'),
  ImageScale: { W_AUTO_H_50: 'scale' },
}));

const baseVoter = {
  profile: { id: '1', handle: 'alice', pfp: 'alice.jpg' },
  rating: 10,
};
const baseWinner = {
  drop: { 
    wave: { voting_credit_type: 'REP' }, 
    top_raters: [baseVoter] 
  },
};

describe('WaveWinnersDropHeaderVoter', () => {
  it('shows voter image and tooltip', () => {
    render(<WaveWinnersDropHeaderVoter voter={baseVoter as any} winner={baseWinner as any} index={0} />);
    expect(screen.getByAltText("alice's Profile")).toHaveAttribute('src', 'scaled.jpg');
    
    // Check that the tooltip is rendered
    const tooltip = screen.getByTestId('react-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('data-tooltip-id', 'winner-voter-1');
    expect(tooltip.textContent).toContain('alice • 10 REP');
  });

  it('shows placeholder when no pfp', () => {
    const voter = { ...baseVoter, profile: { ...baseVoter.profile, pfp: null } };
    render(<WaveWinnersDropHeaderVoter voter={voter as any} winner={baseWinner as any} index={0} />);
    expect(screen.queryByAltText(/Profile/)).toBeNull();
    
    // Check that the tooltip is still rendered
    const tooltip = screen.getByTestId('react-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('data-tooltip-id', 'winner-voter-1');
  });
});
