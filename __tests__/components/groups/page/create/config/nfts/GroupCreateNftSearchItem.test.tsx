import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateNftSearchItem from '@/components/groups/page/create/config/nfts/GroupCreateNftSearchItem';
import { MEMES_CONTRACT } from '@/constants';
import { ApiGroupOwnsNftNameEnum } from '@/generated/models/ApiGroupOwnsNft';

jest.mock('@/helpers/image.helpers');
const imageHelpers = jest.requireMock('../../../../../../../helpers/image.helpers');
const getScaledImageUriMock = imageHelpers.getScaledImageUri as jest.Mock;
imageHelpers.ImageScale = { W_AUTO_H_50: 'scale' };
getScaledImageUriMock.mockReturnValue('scaled-url');

describe('GroupCreateNftSearchItem', () => {
  const item = {
    id: '1',
    contract: MEMES_CONTRACT,
    name: 'Cool NFT',
    image_url: 'img-url',
  } as any;

  it('renders item info and handles selection', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const { container } = render(<GroupCreateNftSearchItem item={item} selected={[]} onSelect={onSelect} />);

    expect(screen.getByText('Cool NFT')).toBeInTheDocument();
    expect(screen.getByText('The Memes')).toBeInTheDocument();
    expect(getScaledImageUriMock).toHaveBeenCalledWith('img-url', 'scale');

    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(item);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('shows check icon when token already selected', () => {
    const selected = [{ name: ApiGroupOwnsNftNameEnum.Memes, tokens: ['1'] }];
    const { container } = render(
      <GroupCreateNftSearchItem item={item} selected={selected} onSelect={jest.fn()} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
