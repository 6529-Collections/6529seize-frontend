import { render } from '@testing-library/react';
import React from 'react';
import { WaveWinnersSmall } from '@/components/waves/winners/WaveWinnersSmall';
import { useWaveDecisions } from '@/hooks/waves/useWaveDecisions';
import { useWave } from '@/hooks/useWave';

jest.mock('@/hooks/waves/useWaveDecisions');
jest.mock('@/hooks/useWave');

const ItemMock = jest.fn(() => <div data-testid="item" />);
const SelectorMock = jest.fn(() => <div data-testid="selector" />);
const LoadingMock = jest.fn(() => <div data-testid="loading" />);
const EmptyMock = jest.fn(() => <div data-testid="empty" />);

jest.mock('@/components/waves/winners/WaveWinnerItemSmall', () => ({ WaveWinnerItemSmall: (props: any) => ItemMock(props) }));
jest.mock('@/components/waves/winners/WaveWinnersSmallDecisionSelector', () => ({ WaveWinnersSmallDecisionSelector: (props: any) => SelectorMock(props) }));
jest.mock('@/components/waves/winners/WaveWinnersSmallLoading', () => ({ WaveWinnersSmallLoading: () => LoadingMock() }));
jest.mock('@/components/waves/winners/WaveWinnersSmallEmpty', () => ({ WaveWinnersSmallEmpty: (props: any) => EmptyMock(props) }));
const wave: any = { id: 'w' };
jest.mock('@/helpers/waves/drop.helpers', () => ({ convertApiDropToExtendedDrop: (d: any) => ({ ...d, type: 'FULL', wave }) }));

const wave: any = { id: 'w' };

describe('WaveWinnersSmall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({ decisionPoints: [], isFetching: true });
    (useWave as jest.Mock).mockReturnValue({ decisions: { multiDecision: false } });
    render(<WaveWinnersSmall wave={wave} onDropClick={jest.fn()} />);
    expect(LoadingMock).toHaveBeenCalled();
  });

  it('shows empty state', () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({ decisionPoints: [], isFetching: false });
    (useWave as jest.Mock).mockReturnValue({ decisions: { multiDecision: true } });
    render(<WaveWinnersSmall wave={wave} onDropClick={jest.fn()} />);
    expect(EmptyMock).toHaveBeenCalled();
  });

  it('renders winners for single decision', () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({ decisionPoints: [{ decision_time: 1, winners: [{ drop: { id: 'd' }, place: 1 }] }], isFetching: false });
    (useWave as jest.Mock).mockReturnValue({ decisions: { multiDecision: false } });
    render(<WaveWinnersSmall wave={wave} onDropClick={jest.fn()} />);
    expect(ItemMock).toHaveBeenCalled();
  });

  it('renders selector for multi decision', () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({ decisionPoints: [{ decision_time: 1, winners: [{ drop: { id: 'd' }, place: 1 }] }], isFetching: false });
    (useWave as jest.Mock).mockReturnValue({ decisions: { multiDecision: true } });
    render(<WaveWinnersSmall wave={wave} onDropClick={jest.fn()} />);
    expect(SelectorMock).toHaveBeenCalled();
  });
});
