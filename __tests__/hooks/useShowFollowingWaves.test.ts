import { renderHook, act } from '@testing-library/react';
import { useShowFollowingWaves } from '@/hooks/useShowFollowingWaves';

beforeEach(() => {
  localStorage.clear();
});

describe('useShowFollowingWaves', () => {
  it('initialises from localStorage', () => {
    localStorage.setItem('show_following_waves', 'true');
    const { result } = renderHook(() => useShowFollowingWaves());
    expect(result.current[0]).toBe(true);
  });

  it('persists and syncs value across instances', async () => {
    const { result: first } = renderHook(() => useShowFollowingWaves());
    const { result: second } = renderHook(() => useShowFollowingWaves());

    act(() => {
      first.current[1](true);
    });

    expect(localStorage.getItem('show_following_waves')).toBe('true');
    expect(second.current[0]).toBe(true);
  });
});
