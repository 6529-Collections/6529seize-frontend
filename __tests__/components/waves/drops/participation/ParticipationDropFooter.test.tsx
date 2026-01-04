import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipationDropFooter from '@/components/waves/drops/participation/ParticipationDropFooter';
import type { ExtendedDrop } from '@/helpers/waves/drop.helpers';

jest.mock('date-fns', () => ({ format: jest.fn(() => 'DATE') }));

const useDropInteractionRules = jest.fn();
jest.mock('@/hooks/drops/useDropInteractionRules', () => ({
  useDropInteractionRules: (...args: any[]) => useDropInteractionRules(...args),
}));

const useIsMobileScreen = jest.fn();
jest.mock('@/hooks/isMobileScreen', () => ({
  __esModule: true,
  default: (...args: any[]) => useIsMobileScreen(...args),
}));

jest.mock('@/components/voting', () => ({
  VotingModal: (p: any) => <div data-testid="modal">{p.isOpen ? 'open' : 'closed'}</div>,
  MobileVotingModal: (p: any) => <div data-testid="mobile-modal">{p.isOpen ? 'open' : 'closed'}</div>,
}));

jest.mock('@/components/voting/VotingModalButton', () => (props: any) => (
  <button data-testid="vote-btn" onClick={props.onClick}>vote</button>
));

jest.mock('@/components/waves/drops/participation/ParticipationDropRatings', () => ({
  ParticipationDropRatings: (props: any) => (
    <div data-testid="ratings">{props.rank}</div>
  )
}));

const drop: ExtendedDrop = {
  created_at: '2023-01-01T00:00:00Z',
  raters_count: 2,
  rank: 3,
} as any;

beforeEach(() => {
  jest.clearAllMocks();
});

it('renders vote button and modal on click for desktop', async () => {
  useDropInteractionRules.mockReturnValue({ canShowVote: true });
  useIsMobileScreen.mockReturnValue(false);
  render(<ParticipationDropFooter drop={drop} />);
  expect(screen.getByTestId('ratings')).toBeInTheDocument();
  expect(screen.getByTestId('modal')).toHaveTextContent('closed');
  await userEvent.click(screen.getByTestId('vote-btn'));
  expect(screen.getByTestId('modal')).toHaveTextContent('open');
});

it('renders mobile modal when mobile screen', async () => {
  useDropInteractionRules.mockReturnValue({ canShowVote: true });
  useIsMobileScreen.mockReturnValue(true);
  render(<ParticipationDropFooter drop={drop} />);
  await userEvent.click(screen.getByTestId('vote-btn'));
  expect(screen.getByTestId('mobile-modal')).toHaveTextContent('open');
});

it('shows ratings only when voting not allowed', () => {
  useDropInteractionRules.mockReturnValue({ canShowVote: false });
  useIsMobileScreen.mockReturnValue(false);
  const { container } = render(<ParticipationDropFooter drop={drop} />);
  expect(screen.getByTestId('ratings')).toBeInTheDocument();
  expect(container.querySelector('[data-testid="vote-btn"]')).toBeNull();
});

it('displays formatted date', () => {
  useDropInteractionRules.mockReturnValue({ canShowVote: false });
  useIsMobileScreen.mockReturnValue(false);
  render(<ParticipationDropFooter drop={drop} />);
  expect(screen.getByText('DATE')).toBeInTheDocument();
});
