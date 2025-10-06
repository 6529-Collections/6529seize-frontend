import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWaveActivityLogs } from '@/hooks/useWaveActivityLogs';

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve([{ id: '1' }, { id: '2' }])),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

test('fetches logs', async () => {
  const { result } = renderHook(() => useWaveActivityLogs({ waveId: 'w', connectedProfileHandle: 'h', reverse: false, dropId: null, logTypes: [] }), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.logs.length).toBe(2));
});

test('reverses logs when reverse true', async () => {
  const { result } = renderHook(() => useWaveActivityLogs({ waveId: 'w', connectedProfileHandle: 'h', reverse: true, dropId: null, logTypes: [] }), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.logs[0].id).toBe('2'));
});

test('prefetches logs on mount', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = jest.spyOn(queryClient, 'prefetchInfiniteQuery');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  renderHook(() => useWaveActivityLogs({ waveId: 'w', connectedProfileHandle: 'h', reverse: false, dropId: null, logTypes: [] }), { wrapper });
  expect(spy).toHaveBeenCalled();
});
