import { render } from '@testing-library/react';
import React from 'react';
import WaveDropQuoteWithDropId from '@/components/waves/drops/WaveDropQuoteWithDropId';
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from '@/components/auth/Auth';

let capturedProps: any;
jest.mock('@/components/waves/drops/WaveDropQuote', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="quote" />;
});

const useQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: (opts: any) => useQuery(opts),
  keepPreviousData: 'keep',
}));

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(async () => ({ id: 'd1' })),
}));

const { commonApiFetch } = require('@/services/api/common-api');

const auth = { connectedProfile: null, setToast: jest.fn() } as any;

describe('WaveDropQuoteWithDropId', () => {
  it('fetches drop and renders quote', async () => {
    useQuery.mockImplementation((opts: any) => {
      return { data: { id: 'd1', wave: { id: 'w1' } } };
    });
    render(
      <AuthContext.Provider value={auth}>
        <WaveDropQuoteWithDropId dropId="d1" partId={2} maybeDrop={null} onQuoteClick={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(capturedProps.drop).toEqual({ id: 'd1', wave: { id: 'w1' } });
    const call = useQuery.mock.calls[0][0];
    expect(call.queryKey).toEqual([QueryKey.DROP, { drop_id: 'd1', context_profile: undefined }]);
    await call.queryFn();
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: 'drops/d1', params: {} });
  });
});
