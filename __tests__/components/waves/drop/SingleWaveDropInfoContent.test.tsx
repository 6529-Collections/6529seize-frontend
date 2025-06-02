import { render, screen } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropInfoContent } from '../../../../components/waves/drop/SingleWaveDropInfoContent';
import { ApiDropType } from '../../../../generated/models/ObjectSerializer';
import { useSeizeSettings } from '../../../../contexts/SeizeSettingsContext';

jest.mock('../../../../contexts/SeizeSettingsContext');
const useSeizeSettingsMock = useSeizeSettings as jest.Mock;

jest.mock('../../../../components/waves/drop/SingleWaveDropPosition', () => ({ SingleWaveDropPosition: (p: any) => <div data-testid="pos">{p.rank}</div> }));
jest.mock('../../../../components/waves/drop/SingleWaveDropContent', () => ({ SingleWaveDropContent: () => <div data-testid="content" /> }));
jest.mock('../../../../components/waves/drop/MemesSingleWaveDropContent', () => ({ MemesSingleWaveDropContent: () => <div data-testid="memes" /> }));
jest.mock('../../../../components/waves/drop/WinnerBadge', () => ({ WinnerBadge: () => <div data-testid="badge" /> }));

describe('SingleWaveDropInfoContent', () => {
  beforeEach(() => {
    useSeizeSettingsMock.mockReturnValue({ isMemesWave: () => false });
  });
  it('returns null when no drop', () => {
    const { container } = render(<SingleWaveDropInfoContent drop={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows memes content when memes wave', () => {
    useSeizeSettingsMock.mockReturnValue({ isMemesWave: () => true });
    render(<SingleWaveDropInfoContent drop={{ drop_type: ApiDropType.Participatory, wave: { id: '1' } } as any} />);
    expect(screen.getByTestId('memes')).toBeInTheDocument();
  });

  it('shows position and badge accordingly', () => {
    useSeizeSettingsMock.mockReturnValue({ isMemesWave: () => false });
    const drop: any = { drop_type: ApiDropType.Participatory, rank: 1, wave: { id: '1' } };
    const { rerender } = render(<SingleWaveDropInfoContent drop={drop} />);
    expect(screen.getByTestId('pos')).toHaveTextContent('1');
    rerender(<SingleWaveDropInfoContent drop={{ ...drop, drop_type: ApiDropType.Winner }} />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });
});
