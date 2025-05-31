import React from 'react';
import { render, screen } from '@testing-library/react';
import MemeDropVoteStats from '../../../../../components/memes/drops/meme-participation-drop/MemeDropVoteStats';
import { ApiDropRater } from '../../../../generated/models/ApiDropRater';

jest.mock('next/link', () => ({__esModule:true, default: ({href,children}:any) => <a href={href}>{children}</a>}));
jest.mock('@tippyjs/react', () => (props:any) => <span>{props.children}</span>);

const voters: ApiDropRater[] = [
  { profile: { handle: 'bob', pfp: 'img' } as any, rating: 3 } as ApiDropRater
];

describe('MemeDropVoteStats', () => {
  it('renders totals and user vote', () => {
    render(
      <MemeDropVoteStats
        current={10}
        projected={12}
        votingCreditType="NIC"
        ratersCount={1}
        topVoters={voters}
        userContext={{ rating: -2 } as any}
      />
    );
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Your vote:')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'img');
    expect(screen.getByText((content, element) => {
      return element?.textContent === '-2 NIC';
    })).toBeInTheDocument();
  });
});
