import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { DateTime } from 'luxon';
import AboutMemesCalendar from '../../../components/about/AboutMemesCalendar';

jest.mock('react-bootstrap', () => ({
  Container: (p: any) => <div>{p.children}</div>,
  Row: (p: any) => <div>{p.children}</div>,
  Col: (p: any) => <div>{p.children}</div>,
}));

jest.mock('@\/components/date-countdown/DateCountdown', () =>
  function MockCountdown(p: any) {
    return <div>Countdown {p.title}</div>;
  },
);

jest.mock('@\/lib/mint', () => {
  const actual = jest.requireActual('../../../lib/mint');
  return {
    ...actual,
    nextOccurrences: jest.fn(() => [
      DateTime.fromISO('2026-01-02T18:00:00Z'),
      DateTime.fromISO('2026-01-05T18:00:00Z'),
      DateTime.fromISO('2026-01-07T18:00:00Z'),
      DateTime.fromISO('2026-01-09T18:00:00Z'),
      DateTime.fromISO('2026-01-12T18:00:00Z'),
      DateTime.fromISO('2026-01-14T18:00:00Z'),
    ]),
  };
});

describe('AboutMemesCalendar', () => {
  it('renders next mint and upcoming list', () => {
    render(<AboutMemesCalendar />);
    expect(screen.getByText('Next Mint')).toBeInTheDocument();
    expect(screen.getByText('Countdown Mint #439')).toBeInTheDocument();
    expect(screen.getByText('#440')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Subscribe \(ICS\)/i })).toHaveAttribute(
      'href',
      '/api/mints',
    );
  });
});
