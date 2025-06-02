import { render, screen } from '@testing-library/react';
import React from 'react';
import AboutMemesCalendar from '../../../components/about/AboutMemesCalendar';

jest.mock('react-bootstrap', () => ({
  Container: (p: any) => <div {...p} />,
  Row: (p: any) => <div {...p} />,
  Col: (p: any) => <div {...p} />,
  Table: (p: any) => <table {...p} />,
}));

describe('AboutMemesCalendar', () => {
  it('renders calendar years and blocks', () => {
    render(<AboutMemesCalendar />);
    expect(screen.getByRole('heading', { name: /Memes Seasonal Calendar/i })).toBeInTheDocument();
    expect(screen.getByText(/2023: Year 1/)).toBeInTheDocument();
    expect(screen.getByText('Winter SZN2')).toBeInTheDocument();
  });
});
