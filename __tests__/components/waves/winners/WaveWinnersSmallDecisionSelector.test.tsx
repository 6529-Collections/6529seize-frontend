import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WaveWinnersSmallDecisionSelector } from '../../../../components/waves/winners/WaveWinnersSmallDecisionSelector';

jest.mock('framer-motion', () => ({ useAnimate: () => [React.createRef(), jest.fn()] }));

const decisionPoints = [
  { id: '1', date: '2024-01-01T00:00:00Z', winnersCount: 2 },
  { id: '2', date: '2024-02-01T00:00:00Z' },
];

describe('WaveWinnersSmallDecisionSelector', () => {
  it('shows placeholder label when no active decision', () => {
    render(
      <WaveWinnersSmallDecisionSelector decisionPoints={decisionPoints} activeDecisionPoint={null} onChange={jest.fn()} />
    );
    expect(screen.getByRole('button').textContent).toContain('Select decision point');
  });

  it('formats label when active decision provided', () => {
    render(
      <WaveWinnersSmallDecisionSelector decisionPoints={decisionPoints} activeDecisionPoint="1" onChange={jest.fn()} />
    );
    expect(screen.getByRole('button').textContent).toContain('Jan 1, 2024');
    expect(screen.getByRole('button').textContent).toContain('2 winners');
  });

  it('opens list and selects item', () => {
    const onChange = jest.fn();
    render(
      <WaveWinnersSmallDecisionSelector decisionPoints={decisionPoints} activeDecisionPoint={null} onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('button'));
    const option = screen.getByText((t) => t.startsWith('Jan 1, 2024'));
    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith('1');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
