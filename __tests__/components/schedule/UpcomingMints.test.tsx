import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateTime } from 'luxon';
import UpcomingMints from '@/components/schedule/UpcomingMints';

jest.mock('react-bootstrap', () => {
  const Card = ({ children }: any) => <div>{children}</div>;
  Card.Header = ({ children }: any) => <div>{children}</div>;
  Card.Body = ({ children }: any) => <div>{children}</div>;
  const Table = ({ children }: any) => <table>{children}</table>;
  const Button = (p: any) => <a href={p.href}>{p.children}</a>;
  return { __esModule: true, Card, Table, Button };
});

jest.mock('@/lib/mint', () => {
  const actual = jest.requireActual('@/lib/mint');
  return {
    ...actual,
    nextOccurrences: () => [
      DateTime.fromISO('2026-01-02T18:00:00Z'),
      DateTime.fromISO('2026-01-05T18:00:00Z'),
    ],
    mintNumberForDate: () => 439,
    googleCalendarLink: () => 'g',
  };
});

describe('UpcomingMints', () => {
  it('renders table with calendar links and subscribe button', () => {
    render(<UpcomingMints />);
    expect(screen.getAllByText('#439').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ICS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Google').length).toBeGreaterThan(0);
    expect(screen.getByText('Subscribe to all (ICS)')).toHaveAttribute(
      'href',
      '/api/mints',
    );
  });
});
