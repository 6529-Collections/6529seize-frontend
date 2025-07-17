import React from 'react';
import { render, screen } from '@testing-library/react';
import { SingleWaveDropVotes } from '../../../../components/waves/drop/SingleWaveDropVotes';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('../../../../components/drops/view/utils/DropVoteProgressing', () => ({ __esModule: true, default: (props: any) => <div data-testid='progress' data-current={props.current} data-projected={props.projected}/>}));

const useDropInteractionRules = jest.fn();
jest.mock('../../../../hooks/drops/useDropInteractionRules', () => ({ useDropInteractionRules: (...a: any[]) => useDropInteractionRules(...a) }));

const dropBase: any = {
  rating: -5,
  rating_prediction: -5,
  raters_count: 2,
  top_raters: [ { profile: { handle:'bob', pfp:null }, rating: 3 } ],
  wave: { voting_credit_type: 'CIC' },
  context_profile_context: { rating: -2 }
};

it('shows user vote when voting ended', () => {
  useDropInteractionRules.mockReturnValue({ isVotingEnded: true, isWinner: false });
  render(<SingleWaveDropVotes drop={dropBase} />);
  expect(screen.getByText('Your vote:')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
});

it('hides user vote when voting ongoing', () => {
  useDropInteractionRules.mockReturnValue({ isVotingEnded: false, isWinner: false });
  render(<SingleWaveDropVotes drop={dropBase} />);
  expect(screen.queryByText('Your vote:')).toBeNull();
});
