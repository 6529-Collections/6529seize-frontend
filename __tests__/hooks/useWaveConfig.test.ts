import { renderHook, act } from '@testing-library/react';
import { useWaveConfig } from '../../components/waves/create-wave/hooks/useWaveConfig';
import { CreateWaveStep } from '../../types/waves.types';


describe('useWaveConfig', () => {
  it('prevents step change when validation fails', () => {
    const { result } = renderHook(() => useWaveConfig());
    act(() => {
      result.current.onStep({ step: CreateWaveStep.GROUPS, direction: 'forward' });
    });
    expect(result.current.step).toBe(CreateWaveStep.OVERVIEW);
    expect(result.current.errors.length).toBeGreaterThan(0);
  });

  it('updates drops admin delete flag', () => {
    const { result } = renderHook(() => useWaveConfig());
    act(() => {
      result.current.setDropsAdminCanDelete(true);
    });
    expect(result.current.config.drops.adminCanDeleteDrops).toBe(true);
  });
});
