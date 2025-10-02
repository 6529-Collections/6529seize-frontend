import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateNftsSelected from '@/components/groups/page/create/config/nfts/GroupCreateNftsSelected';
import { ApiGroupOwnsNftNameEnum } from '@/generated/models/ApiGroupOwnsNft';

const captured: { nft: any; onRemove: () => void }[] = [];

jest.mock('@/components/groups/page/create/config/nfts/GroupCreateNftsSelectedItem', () => ({
  __esModule: true,
  default: ({ nft, onRemove }: any) => {
    captured.push({ nft, onRemove });
    return <button data-testid={`item-${nft.name}-${nft.token}`} onClick={onRemove}></button>;
  }
}));

describe('GroupCreateNftsSelected', () => {
  beforeEach(() => {
    captured.length = 0;
  });

  it('renders selected tokens and handles removal', async () => {
    const onRemove = jest.fn();
    const selected = [
      { name: ApiGroupOwnsNftNameEnum.Memes, tokens: ['1', '2'] },
      { name: ApiGroupOwnsNftNameEnum.Gradients, tokens: ['5'] },
    ];
    render(<GroupCreateNftsSelected selected={selected} onRemove={onRemove} />);
    expect(captured.map(c => c.nft)).toEqual([
      { name: ApiGroupOwnsNftNameEnum.Memes, token: '1' },
      { name: ApiGroupOwnsNftNameEnum.Memes, token: '2' },
      { name: ApiGroupOwnsNftNameEnum.Gradients, token: '5' },
    ]);
    await userEvent.click(screen.getByTestId('item-MEMES-2'));
    expect(onRemove).toHaveBeenCalledWith({ name: ApiGroupOwnsNftNameEnum.Memes, token: '2' });
  });
});
