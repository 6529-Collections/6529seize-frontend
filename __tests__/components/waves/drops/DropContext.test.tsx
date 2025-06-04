import React from 'react';
import { renderHook } from '@testing-library/react';
import DropContext, { useDropContext } from '../../../../components/waves/drops/DropContext';

const contextValue = { drop: { id: '1' } as any, location: 'header' as any };
const wrapper = ({ children }: any) => (
  <DropContext.Provider value={contextValue}>
    {children}
  </DropContext.Provider>
);

describe('useDropContext', () => {
  it('provides drop and location from provider', () => {
    const { result, rerender } = renderHook(() => useDropContext(), { wrapper });
    expect(result.current.drop).toEqual({ id: '1' });
    expect(result.current.location).toBe('header');
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('throws when used outside provider', () => {
    const { result } = renderHook(() => {
      try { return useDropContext(); } catch (e) { return e; }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});
