import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateCollections from '@/components/groups/page/create/config/nfts/GroupCreateCollections';
import { ApiGroupOwnsNftNameEnum } from '@/generated/models/ApiGroupOwnsNft';

describe('GroupCreateCollections', () => {
  it('adds collection when button clicked', async () => {
    const setNfts = jest.fn();
    render(<GroupCreateCollections nfts={[]} setNfts={setNfts} />);

    const gradients = screen.getByRole('button', { name: 'Gradients' });
    expect(gradients).toHaveClass('tw-bg-iron-950');
    await userEvent.click(gradients);
    expect(setNfts).toHaveBeenCalledWith([{ name: ApiGroupOwnsNftNameEnum.Gradients, tokens: [] }]);
  });

  it('removes collection when already selected', async () => {
    const setNfts = jest.fn();
    render(
      <GroupCreateCollections
        nfts={[{ name: ApiGroupOwnsNftNameEnum.Memes, tokens: [] }]}
        setNfts={setNfts}
      />
    );

    const memes = screen.getByRole('button', { name: 'Memes' });
    expect(memes).toHaveClass('tw-bg-iron-800');
    await userEvent.click(memes);
    expect(setNfts).toHaveBeenCalledWith([]);
  });
});
