import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { HeaderProvider, useHeaderContext } from '@/contexts/HeaderContext';

describe('HeaderContext', () => {
  it('provides ref setter and state', () => {
    const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
      <HeaderProvider>{children}</HeaderProvider>
    );
    const { result } = renderHook(() => useHeaderContext(), { wrapper });
    const div = document.createElement('div');
    act(() => result.current.setHeaderRef(div));
    expect(result.current.headerRef.current).toBe(div);
    expect(result.current.refState).toBe(div);
  });

  it('throws when used outside provider', () => {
    const { result } = renderHook(() => {
      try { return useHeaderContext(); } catch (e) { return e; }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});
