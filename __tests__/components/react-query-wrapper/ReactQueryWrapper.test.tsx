import React, { useContext } from 'react';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactQueryWrapper, { ReactQueryWrapperContext, QueryKey } from '../../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('../../../helpers/Helpers', () => ({ ...jest.requireActual('../../../helpers/Helpers'), wait: jest.fn(() => Promise.resolve()) }));

const wait = require('../../../helpers/Helpers').wait as jest.Mock;

describe('ReactQueryWrapper context', () => {
  it('sets profile data in query cache', () => {
    const client = new QueryClient();
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    const profile = { handle: 'Alice', wallets: [{ wallet: '0x1', display: 'Alice' }] } as any;
    act(() => ctx.setProfile(profile));
    expect(client.getQueryData([QueryKey.PROFILE, 'alice'])).toEqual(profile);
    expect(client.getQueryData([QueryKey.PROFILE, '0x1'])).toEqual(profile);
  });

  it('waits then invalidates drops', async () => {
    const client = new QueryClient();
    jest.spyOn(client, 'invalidateQueries');
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    await act(async () => {
      await ctx.waitAndInvalidateDrops();
    });
    expect(wait).toHaveBeenCalledWith(500);
    expect((client.invalidateQueries as jest.Mock).mock.calls[0][0]).toEqual({ queryKey: [QueryKey.DROPS] });
  });
});
