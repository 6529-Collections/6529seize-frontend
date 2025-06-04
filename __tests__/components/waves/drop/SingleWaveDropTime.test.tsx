import { render, screen } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropTime } from '../../../../components/waves/drop/SingleWaveDropTime';

jest.mock('../../../../hooks/useWaveTimers', () => ({ useWaveTimers: jest.fn() }));
jest.mock('../../../../components/waves/drop/CountdownDisplay', () => ({ CountdownDisplay: ({ headerText }: any) => <div data-testid="count">{headerText}</div> }));

const { useWaveTimers } = require('../../../../hooks/useWaveTimers');

describe('SingleWaveDropTime', () => {
  const wave = {} as any;

  it('shows ended message when voting completed', () => {
    useWaveTimers.mockReturnValue({ voting: { timeLeft: {}, isUpcoming: false, isCompleted: true } });
    render(<SingleWaveDropTime wave={wave} />);
    expect(screen.getByText('The voting has ended')).toBeInTheDocument();
  });

  it('shows countdown with correct header', () => {
    useWaveTimers.mockReturnValue({ voting: { timeLeft: { h: 1 }, isUpcoming: true, isCompleted: false } });
    render(<SingleWaveDropTime wave={wave} />);
    expect(screen.getByTestId('count')).toHaveTextContent('Voting Starts In');
  });
});
