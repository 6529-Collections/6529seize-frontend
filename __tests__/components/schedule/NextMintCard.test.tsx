import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateTime } from 'luxon';

jest.mock('react-bootstrap', () => {
  const Card = ({ children }: any) => <div>{children}</div>;
  Card.Header = ({ children }: any) => <div>{children}</div>;
  Card.Body = ({ children }: any) => <div>{children}</div>;
  Card.Title = ({ children }: any) => <div>{children}</div>;
  const Button = (p: any) => <a href={p.href}>{p.children}</a>;
  return { __esModule: true, Card, Button };
});

jest.mock('@/components/date-countdown/DateCountdown', () =>
  function MockCountdown(p: any) {
    return <div>Countdown {p.title}</div>;
  },
);

jest.mock('@/lib/mint', () => {
  const actual = jest.requireActual('@/lib/mint');
  return {
    ...actual,
    nextOccurrences: () => [DateTime.fromISO('2026-01-02T18:00:00Z')],
    mintNumberForDate: () => 439,
    timeCoordinate: () => ({ eon: 1, era: 1, period: 1, epoch: 0, year: 2026, season: 'Q1' }),
    googleCalendarLink: () => 'g',
  };
});

import NextMintCard from '@/components/schedule/NextMintCard';

describe('NextMintCard', () => {
  it('renders countdown and calendar links', () => {
    render(<NextMintCard />);
    expect(screen.getByText('Mint #439')).toBeInTheDocument();
    expect(screen.getByText('ICS')).toHaveAttribute('href', '/api/mints/439.ics');
    expect(screen.getByText('Google')).toHaveAttribute('href', 'g');
  });
});
