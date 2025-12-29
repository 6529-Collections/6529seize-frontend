import { renderHook, act } from '@testing-library/react';
import {
  UnreadDividerProvider,
  useUnreadDivider,
  useUnreadDividerOptional,
} from '@/contexts/wave/UnreadDividerContext';
import { ReactNode } from 'react';

describe('UnreadDividerContext', () => {
  describe('useUnreadDivider', () => {
    it('throws when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const renderWithoutProvider = () => renderHook(() => useUnreadDivider());
      
      expect(renderWithoutProvider).toThrow('useUnreadDivider must be used within an UnreadDividerProvider');
      
      consoleError.mockRestore();
    });

    it('returns initial serial number', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UnreadDividerProvider initialSerialNo={42}>{children}</UnreadDividerProvider>
      );

      const { result } = renderHook(() => useUnreadDivider(), { wrapper });

      expect(result.current.unreadDividerSerialNo).toBe(42);
    });

    it('returns null when initialSerialNo is null', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UnreadDividerProvider initialSerialNo={null}>{children}</UnreadDividerProvider>
      );

      const { result } = renderHook(() => useUnreadDivider(), { wrapper });

      expect(result.current.unreadDividerSerialNo).toBeNull();
    });

    it('updates serial number when setUnreadDividerSerialNo is called', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UnreadDividerProvider initialSerialNo={null}>{children}</UnreadDividerProvider>
      );

      const { result } = renderHook(() => useUnreadDivider(), { wrapper });

      act(() => {
        result.current.setUnreadDividerSerialNo(99);
      });

      expect(result.current.unreadDividerSerialNo).toBe(99);
    });

    it('clears serial number when set to null', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UnreadDividerProvider initialSerialNo={42}>{children}</UnreadDividerProvider>
      );

      const { result } = renderHook(() => useUnreadDivider(), { wrapper });

      act(() => {
        result.current.setUnreadDividerSerialNo(null);
      });

      expect(result.current.unreadDividerSerialNo).toBeNull();
    });
  });

  describe('useUnreadDividerOptional', () => {
    it('returns null when used outside provider', () => {
      const { result } = renderHook(() => useUnreadDividerOptional());
      expect(result.current).toBeNull();
    });

    it('returns context when used inside provider', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UnreadDividerProvider initialSerialNo={42}>{children}</UnreadDividerProvider>
      );

      const { result } = renderHook(() => useUnreadDividerOptional(), { wrapper });

      expect(result.current?.unreadDividerSerialNo).toBe(42);
    });
  });
});

