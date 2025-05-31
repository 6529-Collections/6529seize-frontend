import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateNftsSelectedItem from '../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftsSelectedItem';
import { useQuery } from '@tanstack/react-query';
import { getScaledImageUri } from '../../../../../../../helpers/image.helpers';
import { ApiGroupOwnsNftNameEnum } from '../../../../../../../generated/models/ApiGroupOwnsNft';

jest.mock('@tanstack/react-query');
jest.mock('../../../../../../../helpers/image.helpers');

const mockUseQuery = useQuery as jest.Mock;
const getScaledImageUriMock = getScaledImageUri as jest.Mock;

const nft = { name: ApiGroupOwnsNftNameEnum.Memes, token: '1' } as const;

describe('GroupCreateNftsSelectedItem', () => {
  it('renders image and handles remove', async () => {
    const onRemove = jest.fn();
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({ data: { data: [{ image: 'img', name: 'NFT' }] } });
    getScaledImageUriMock.mockReturnValue('scaled-url');
    render(<GroupCreateNftsSelectedItem nft={nft} onRemove={onRemove} />);
    const img = screen.getByAltText('NFT');
    expect(img).toHaveAttribute('src', 'scaled-url');
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalled();
  });

  it('shows placeholder when image missing', () => {
    mockUseQuery.mockReturnValue({ data: { data: [{}] } });
    const { container } = render(<GroupCreateNftsSelectedItem nft={nft} onRemove={jest.fn()} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.tw-bg-iron-900')).toBeInTheDocument();
  });
});
