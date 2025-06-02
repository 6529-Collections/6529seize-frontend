import { render, screen } from '@testing-library/react';
import React from 'react';
import ParticipationDropHeader from '../../../../../components/waves/drops/participation/ParticipationDropHeader';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, onClick }: any) => <a href={href} onClick={onClick}>{children}</a> }));

jest.mock('../../../../../components/user/utils/UserCICAndLevel', () => ({ __esModule: true, default: () => <div data-testid="cic" />, UserCICAndLevelSize: { SMALL: 'SMALL' } }));
jest.mock('../../../../../components/waves/drops/winner/WinnerDropBadge', () => ({ __esModule: true, default: (p: any) => <div data-testid="badge">{p.rank}</div> }));
jest.mock('../../../../../components/waves/drops/time/WaveDropTime', () => ({ __esModule: true, default: (p: any) => <div data-testid="time">{p.timestamp}</div> }));

const drop: any = {
  author: { handle: 'alice', level: 1, cic: 1500 },
  created_at: 123,
  rank: 2,
  wave: { id: 'w1', name: 'WaveName' },
  winning_context: { decision_time: 999 },
};

describe('ParticipationDropHeader', () => {
  it('shows author info, time and badge', () => {
    render(<ParticipationDropHeader drop={drop} showWaveInfo />);
    expect(screen.getByTestId('cic')).toBeInTheDocument();
    expect(screen.getByText('alice')).toHaveAttribute('href', '/alice');
    expect(screen.getByTestId('time')).toHaveTextContent('123');
    expect(screen.getByTestId('badge')).toHaveTextContent('2');
    expect(screen.getByRole('link', { name: 'WaveName' })).toHaveAttribute('href', '/my-stream?wave=w1');
  });

  it('omits wave link when showWaveInfo is false', () => {
    render(<ParticipationDropHeader drop={drop} showWaveInfo={false} />);
    expect(screen.queryByText('WaveName')).toBeNull();
  });
});
