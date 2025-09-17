import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupCreateNftSearchItemsContent from '../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftSearchItemsContent';

jest.mock('../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftSearchItem', () => ({
  __esModule: true,
  default: ({ item }: any) => <div data-testid={`item-${item.id}`} />
}));

describe('GroupCreateNftSearchItemsContent', () => {
  const nft = { id: '1', contract: '0x' } as any;

  it('shows loading placeholder when loading', () => {
    render(
      <GroupCreateNftSearchItemsContent loading={true} items={[nft]} selected={[]} onSelect={jest.fn()} />
    );
    expect(screen.getByText('Loading...', { selector: 'li' })).toBeInTheDocument();
  });

  it('renders list of items when available', () => {
    render(
      <GroupCreateNftSearchItemsContent loading={false} items={[nft]} selected={[]} onSelect={jest.fn()} />
    );
    expect(screen.queryByText('No results')).toBeNull();
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
  });

  it('shows no results message when list empty', () => {
    render(
      <GroupCreateNftSearchItemsContent loading={false} items={[]} selected={[]} onSelect={jest.fn()} />
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});
