import { renderHook, act } from '@testing-library/react';
import { useVirtualizedWaveDrops } from '../../hooks/useVirtualizedWaveDrops';
import { DropSize } from '../../helpers/waves/drop.helpers';

jest.mock('../../hooks/useVirtualizedWaveMessages');
jest.mock('../../contexts/wave/MyStreamContext');

import { useVirtualizedWaveMessages } from '../../hooks/useVirtualizedWaveMessages';
import { useMyStream } from '../../contexts/wave/MyStreamContext';

const fetchNextPageForWave = jest.fn();
const fetchNextPageForDrop = jest.fn();
const waitAndRevealDrop = jest.fn();
const loadMoreLocally = jest.fn();

(useMyStream as jest.Mock).mockReturnValue({ fetchNextPageForWave });
(useVirtualizedWaveMessages as jest.Mock).mockReturnValue({
  loadMoreLocally,
  hasMoreLocal: true,
  fetchNextPageForDrop,
  waitAndRevealDrop,
});

describe('useVirtualizedWaveDrops', () => {
  it('loads more locally when available', async () => {
    const { result } = renderHook(() => useVirtualizedWaveDrops('wave', null));
    await act(async () => {
      await result.current.fetchNextPage({ waveId: 'wave', type: DropSize.FULL }, null);
    });
    expect(loadMoreLocally).toHaveBeenCalled();
    expect(fetchNextPageForWave).not.toHaveBeenCalled();
  });

  it('delegates to drop fetch when drop id provided', async () => {
    const { result } = renderHook(() => useVirtualizedWaveDrops('wave', 'drop'));
    await act(async () => {
      await result.current.fetchNextPage({ waveId: 'wave', type: DropSize.FULL }, 'drop');
    });
    expect(fetchNextPageForDrop).toHaveBeenCalled();
  });

  it('exposes waitAndRevealDrop', async () => {
    const { result } = renderHook(() => useVirtualizedWaveDrops('wave', null));
    await act(async () => {
      await result.current.waitAndRevealDrop(1);
    });
    expect(waitAndRevealDrop).toHaveBeenCalledWith(1, undefined, undefined);
  });
});
