import React, { useContext } from 'react';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactQueryWrapper, { ReactQueryWrapperContext, QueryKey } from '../../../components/react-query-wrapper/ReactQueryWrapper';

/** Additional tests for functions not covered in main test file */

describe('ReactQueryWrapper extra context methods', () => {
  it('onIdentityFollowChange invalidates related queries', () => {
    const client = new QueryClient();
    jest.spyOn(client, 'invalidateQueries');
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    act(() => ctx.onIdentityFollowChange());
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_FOLLOWING_ACTIONS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_FOLLOWERS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_NOTIFICATIONS] });
  });

  it('onGroupCreate invalidates groups list', () => {
    const client = new QueryClient();
    jest.spyOn(client, 'invalidateQueries');
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    act(() => ctx.onGroupCreate());
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUPS] });
  });

  it('onGroupRemoved invalidates group queries', () => {
    const client = new QueryClient();
    jest.spyOn(client, 'invalidateQueries');
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    act(() => ctx.onGroupRemoved({ groupId: '1' }));
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUPS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUP, '1'] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_LOGS, { groupId: '1' }] });
  });

  it('onGroupChanged invalidates group queries', () => {
    const client = new QueryClient();
    jest.spyOn(client, 'invalidateQueries');
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    act(() => ctx.onGroupChanged({ groupId: '2' }));
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUPS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.GROUP, '2'] });
  });

  it('onIdentityBulkRate invalidates multiple queries', () => {
    const client = new QueryClient();
    jest.spyOn(client, 'invalidateQueries');
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    act(() => ctx.onIdentityBulkRate());
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_LOGS] });
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.PROFILE_RATERS] });
  });

  it('invalidateNotifications invalidates notifications query', () => {
    const client = new QueryClient();
    jest.spyOn(client, 'invalidateQueries');
    let ctx: any;
    function Child() { ctx = useContext(ReactQueryWrapperContext); return null; }
    render(
      <QueryClientProvider client={client}>
        <ReactQueryWrapper><Child /></ReactQueryWrapper>
      </QueryClientProvider>
    );
    act(() => ctx.invalidateNotifications());
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: [QueryKey.IDENTITY_NOTIFICATIONS] });
  });
});
