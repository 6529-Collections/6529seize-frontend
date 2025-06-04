import { renderHook, act } from '@testing-library/react';
import { useActiveWaveManager } from '../../../../contexts/wave/hooks/useActiveWaveManager';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const push = jest.fn();
const router: any = { query: {}, push };
(useRouter as jest.Mock).mockReturnValue(router);

describe('useActiveWaveManager', () => {
  it('reads wave from query and updates via setActiveWave', () => {
    router.query = { wave: 'abc' };
    const { result, rerender } = renderHook(() => useActiveWaveManager());
    expect(result.current.activeWaveId).toBe('abc');

    act(() => {
      result.current.setActiveWave('def');
    });
    expect(push).toHaveBeenLastCalledWith('/my-stream?wave=def', undefined, { shallow: true });
    
    // Simulate router query change to trigger state update
    router.query = { wave: 'def' };
    rerender();
    expect(result.current.activeWaveId).toBe('def');

    act(() => {
      result.current.setActiveWave(null);
    });
    expect(push).toHaveBeenLastCalledWith('/my-stream', undefined, { shallow: true });
  });
});
