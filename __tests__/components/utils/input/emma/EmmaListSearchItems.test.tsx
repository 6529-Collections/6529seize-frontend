import React from 'react';
import { render } from '@testing-library/react';
import EmmaListSearchItems from '../../../../../components/utils/input/emma/EmmaListSearchItems';
import { AuthContext } from '../../../../../components/auth/Auth';
import { useQuery } from '@tanstack/react-query';

let received: any;
jest.mock('../../../../../components/utils/input/emma/EmmaListSearchItemsContent', () => (props: any) => { received = props; return <div data-testid="content" />; });

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

describe('EmmaListSearchItems', () => {
  const item1 = { id: '1', name: 'Alpha' } as any;
  const item2 = { id: '2', name: 'Beta' } as any;
  const context = { connectedProfile: { handle: 'h' }, requestAuth: jest.fn().mockResolvedValue({ success: true }) } as any;

  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({ data: [item1, item2], isFetching: false });
    received = undefined;
  });

  it('filters items by search criteria', () => {
    render(
      <AuthContext.Provider value={context}>
        <EmmaListSearchItems open searchCriteria="be" selectedId={null} onSelect={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(received.items).toEqual([item2]);
  });

  it('returns all items when no criteria', () => {
    render(
      <AuthContext.Provider value={context}>
        <EmmaListSearchItems open searchCriteria={null} selectedId={null} onSelect={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(received.items).toEqual([item1, item2]);
  });
});
