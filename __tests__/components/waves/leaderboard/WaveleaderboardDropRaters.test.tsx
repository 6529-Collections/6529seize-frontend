import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaveLeaderboardDropRaters } from '../../../../components/waves/leaderboard/drops/header/WaveleaderboardDropRaters';
import { ExtendedDrop } from '../../../../helpers/waves/drop.helpers';
import { ApiWaveCreditType } from '../../../../generated/models/ApiWaveCreditType';

jest.mock('@tippyjs/react', () => (props: any) => <div>{props.children}</div>);
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('../../../../helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => u, ImageScale: { W_AUTO_H_50: 'AUTO' } }));
jest.mock('../../../../components/drops/view/utils/DropVoteProgressing', () => ({ __esModule: true, default: () => <span data-testid="progress" /> }));

describe('WaveLeaderboardDropRaters', () => {
  const drop: ExtendedDrop = {
    id: '1',
    rating: 10,
    rating_prediction: 12,
    raters_count: 2,
    rank: 1,
    wave: { voting_credit_type: ApiWaveCreditType.Tdh } as any,
    top_raters: [
      { profile: { id: 'p1', handle: 'u1', pfp: '' }, rating: 5 },
      { profile: { id: 'p2', handle: 'u2', pfp: '' }, rating: 5 }
    ],
    context_profile_context: { rating: 3 }
  } as any;

  it('renders rating info and user vote', () => {
    render(<WaveLeaderboardDropRaters drop={drop} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('TDH total')).toBeInTheDocument();
    expect(screen.getByText('Your vote:')).toBeInTheDocument();
  });
});
