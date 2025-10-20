import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BrainLeftSidebarSearchWaveItem from '@/components/brain/left-sidebar/search-wave/BrainLeftSidebarSearchWaveItem';

const push = jest.fn();
const registerWave = jest.fn();
const prefetchWaveData = jest.fn();

jest.mock('next/navigation', () => ({ 
  useRouter: () => ({ push }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null)
  })
}));
jest.mock('@/hooks/usePrefetchWaveData', () => ({ usePrefetchWaveData: () => prefetchWaveData }));
jest.mock('@/contexts/wave/MyStreamContext', () => ({ useMyStream: () => ({ registerWave }) }));
jest.mock('@/hooks/useWave', () => ({ useWave: () => ({ isDm: false }) }));
jest.mock('@/components/waves/WavePicture', () => ({ __esModule: true, default: () => <div data-testid="pic" /> }));

describe('BrainLeftSidebarSearchWaveItem', () => {
  const wave = { id: 'w1', name: 'Wave', picture: 'p', contributors_overview: [], author: { handle: 'user' }, wave: { type: 'CHAT' } } as any;
  it('navigates on click and closes', () => {
    const onClose = jest.fn();
    render(<BrainLeftSidebarSearchWaveItem wave={wave} onClose={onClose} />);
    fireEvent.click(screen.getByRole('link'));
    expect(push).toHaveBeenCalledWith('/waves?wave=w1');
    expect(onClose).toHaveBeenCalled();
  });

  it('prefetches on hover when not active', () => {
    render(<BrainLeftSidebarSearchWaveItem wave={wave} onClose={jest.fn()} />);
    fireEvent.mouseEnter(screen.getByRole('link'));
    expect(registerWave).toHaveBeenCalledWith('w1');
    expect(prefetchWaveData).toHaveBeenCalledWith('w1');
  });
});
