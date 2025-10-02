import { render } from '@testing-library/react';
import React from 'react';
import GroupCardChat from '@/components/groups/page/list/card/GroupCardChat';

const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({ useQuery: (...args: any) => mockUseQuery(...args) }));

const mockGroupCard = jest.fn(() => <div data-testid="card" />);
jest.mock('@/components/groups/page/list/card/GroupCard', () => (props: any) => { mockGroupCard(props); return <div data-testid="card" />; });

const mockButtons = jest.fn(() => <div data-testid="buttons" />);
jest.mock('@/components/waves/ChatItemHrefButtons', () => (props: any) => { mockButtons(props); return <div data-testid="buttons" />; });

jest.mock('@/services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

describe('GroupCardChat', () => {
  it('fetches group and renders components', () => {
    mockUseQuery.mockReturnValue({ data: { id: 'g1', name: 'name' } });
    render(<GroupCardChat href="/h" groupId="g1" />);
    expect(mockGroupCard).toHaveBeenCalledWith(
      expect.objectContaining({ group: { id: 'g1', name: 'name' }, userPlaceholder: '/h', titlePlaceholder: 'g1' })
    );
    expect(mockButtons).toHaveBeenCalledWith(expect.objectContaining({ href: '/h', relativeHref: '/network?group=g1' }));
  });
});
