import { render, screen } from '@testing-library/react';
import React from 'react';
import { WaveWinners } from '../../../../components/waves/winners/WaveWinners';
import { useWaveDecisions } from '../../../../hooks/waves/useWaveDecisions';
import { useLayout } from '../../../../components/brain/my-stream/layout/LayoutContext';
import { useWave } from '../../../../hooks/useWave';

jest.mock('../../../../hooks/waves/useWaveDecisions');
jest.mock('../../../../hooks/useWave');
jest.mock('../../../../components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ winnersViewStyle: {} })
}));

const Timeline = jest.fn(() => <div data-testid="timeline" />);
const Podium = jest.fn(() => <div data-testid="podium" />);
const Drops = jest.fn(() => <div data-testid="drops" />);

jest.mock('../../../../components/waves/winners/WaveWinnersTimeline', () => ({
  WaveWinnersTimeline: (p: any) => Timeline(p)
}));
jest.mock('../../../../components/waves/winners/podium/WaveWinnersPodium', () => ({
  WaveWinnersPodium: (p: any) => Podium(p)
}));
jest.mock('../../../../components/waves/winners/drops/WaveWinnersDrops', () => ({
  WaveWinnersDrops: (p: any) => Drops(p)
}));

const wave = { id: 'w1' } as any;

describe('WaveWinners', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timeline when multi decision', () => {
    (useWave as jest.Mock).mockReturnValue({ decisions: { multiDecision: true } });
    (useWaveDecisions as jest.Mock).mockReturnValue({ decisionPoints: [], isFetching: false });
    render(<WaveWinners wave={wave} onDropClick={jest.fn()} />);
    expect(Timeline).toHaveBeenCalled();
  });

  it('renders podium and drops for single decision', () => {
    (useWave as jest.Mock).mockReturnValue({ decisions: { multiDecision: false } });
    (useWaveDecisions as jest.Mock).mockReturnValue({ decisionPoints: [{ winners: [] }], isFetching: false });
    render(<WaveWinners wave={wave} onDropClick={jest.fn()} />);
    expect(Podium).toHaveBeenCalled();
    expect(Drops).toHaveBeenCalled();
  });
});
