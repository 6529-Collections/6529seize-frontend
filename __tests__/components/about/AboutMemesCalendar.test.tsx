import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import AboutMemesCalendar from '../../../components/about/AboutMemesCalendar';

jest.mock('react-bootstrap', () => ({
  Container: (p:any) => <div>{p.children}</div>,
  Row: (p:any) => <div>{p.children}</div>,
  Col: (p:any) => <div>{p.children}</div>,
  Table: (p:any) => <table>{p.children}</table>,
}));

jest.mock('../../../helpers/time', () => {
  const actualTime = jest.requireActual('../../../helpers/time');
  return {
    Time: {
      ...actualTime.Time,
      now: jest.fn().mockReturnValue(actualTime.Time.fromString('2025-02-01')),
    }
  };
});

describe('AboutMemesCalendar', () => {
  it('renders calendar years and blocks', () => {
    render(<AboutMemesCalendar />);
    expect(screen.getByRole('heading', { name: /Memes Seasonal Calendar/i })).toBeInTheDocument();
    expect(screen.getByText(/2023: Year 1/)).toBeInTheDocument();
    expect(screen.getByText('Winter SZN2')).toBeInTheDocument();
  });

  it('marks active section based on current time', () => {
    const { Time: TimeMock } = require('../../../helpers/time');
    const actualTime = jest.requireActual('../../../helpers/time');
    TimeMock.now.mockReturnValue(actualTime.Time.fromString('2025-02-01'));
    render(<AboutMemesCalendar />);
    const active = document.querySelector('.activeSection');
    expect(active).toBeTruthy();
    expect(active?.textContent).toContain('Winter SZN10');
  });
});
