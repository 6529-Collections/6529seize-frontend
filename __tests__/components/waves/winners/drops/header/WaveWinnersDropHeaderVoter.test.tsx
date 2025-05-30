import { render, screen } from '@testing-library/react';
import WaveWinnersDropHeaderVoter from '../../../../../../components/waves/winners/drops/header/WaveWinnersDropHeaderVoter';

jest.mock('@tippyjs/react', () => ({
  __esModule: true,
  default: ({ children, content }: any) => (
    <div data-testid="tippy">{content}{children}</div>
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
    expect(screen.getByTestId('tippy').textContent).toContain('alice • 10 REP');
  });

  it('shows placeholder when no pfp', () => {
    const voter = { ...baseVoter, profile: { ...baseVoter.profile, pfp: null } };
    render(<WaveWinnersDropHeaderVoter voter={voter as any} winner={baseWinner as any} index={0} />);
    expect(screen.queryByAltText(/Profile/)).toBeNull();
    expect(screen.getByTestId('tippy').querySelector('div')).toBeInTheDocument();
  });
});
