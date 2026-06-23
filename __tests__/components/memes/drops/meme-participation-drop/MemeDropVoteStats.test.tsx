import React from 'react';
import { render, screen } from '@testing-library/react';
import MemeDropVoteStats from '@/components/memes/drops/meme-participation-drop/MemeDropVoteStats';
import type { ApiDropRater } from '@/generated/models/ApiDropRater';

jest.mock('next/link', () => ({__esModule:true, default: ({href,children}:any) => <a href={href}>{children}</a>}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));

const voters: ApiDropRater[] = [
  { profile: { handle: 'bob', pfp: 'img' } as any, rating: 3 } as ApiDropRater
];

describe('MemeDropVoteStats', () => {
  const drop = {
    id: "drop-1",
    rating: 10,
    rating_prediction: 12,
    raters_count: 1,
    top_raters: voters,
    wave: { voting_credit_type: "NIC" },
    context_profile_context: { rating: -2 },
  } as any;

  it('renders totals and user vote', () => {
    render(<MemeDropVoteStats drop={drop} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Your vote:')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'img');
    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 1 voter",
      })
    ).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '-2 NIC';
    })).toBeInTheDocument();
  });
});
