import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIdentitiesSearch } from '../../hooks/useIdentitiesSearch';
import { commonApiFetch } from '../../services/api/common-api';
import { useWaveById } from '../../hooks/useWaveById';

jest.mock('../../hooks/useWaveById');
jest.mock('../../services/api/common-api');

function TestComponent({ handle, waveId }: { handle: string; waveId: string | null }) {
  const { identities } = useIdentitiesSearch({ handle, waveId });
  return <div>{identities.map((i) => i.handle).join(',')}</div>;
}

describe('useIdentitiesSearch', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    jest.clearAllMocks();
    (useWaveById as jest.Mock).mockReturnValue({ wave: { visibility: { scope: { group: { id: 'g1' } } } } });
    (commonApiFetch as jest.Mock).mockResolvedValue([{ handle: 'alice' }]);
  });

  it('fetches identities with group id when wave has group', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="ali" waveId="1" />
      </QueryClientProvider>
    );
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: 'identities', params: { handle: 'ali', group_id: 'g1', ignore_authenticated_user: 'true' } });
    await screen.findByText('alice');
  });

  it('skips fetch when handle too short', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="al" waveId="1" />
      </QueryClientProvider>
    );
    await waitFor(() => expect(commonApiFetch).not.toHaveBeenCalled());
  });
});
