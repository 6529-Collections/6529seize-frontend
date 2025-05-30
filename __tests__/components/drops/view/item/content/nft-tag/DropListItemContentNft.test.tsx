import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DropListItemContentNft from '../../../../../../../components/drops/view/item/content/nft-tag/DropListItemContentNft';

jest.mock('next/link', () => {
  return ({ href, children, target, onClick }: any) => (
    <a href={href} target={target} onClick={onClick} data-testid="link">{children}</a>
  );
});

jest.mock('../../../../../../../components/drops/view/item/content/nft-tag/DropListItemContentNftDetails', () => (props: any) => (
  <div data-testid="details" data-contract={props.referencedNft.contract}>{props.referencedNft.name}</div>
));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({ data: [{ token: { imageLarge: 'img' } }] }),
}));

describe('DropListItemContentNft', () => {
  const baseNft = { contract: '0x1', token: '5', name: 'Name' } as any;

  it('links to internal pages for known contracts', async () => {
    const { MEMES_CONTRACT, GRADIENT_CONTRACT } = require('../../../../../../../constants');

    const { rerender } = render(<DropListItemContentNft nft={{ ...baseNft, contract: MEMES_CONTRACT }} />);
    await waitFor(() => expect(screen.getByTestId('link')).toHaveAttribute('href', `/the-memes/${baseNft.token}`));
    expect(screen.getByTestId('link')).toHaveAttribute('target', '');

    rerender(<DropListItemContentNft nft={{ ...baseNft, contract: GRADIENT_CONTRACT }} />);
    await waitFor(() => expect(screen.getByTestId('link')).toHaveAttribute('href', `/6529-gradient/${baseNft.token}`));
  });

  it('defaults to external link for other contracts', async () => {
    const { MEMES_CONTRACT } = require('../../../../../../../constants');
    render(<DropListItemContentNft nft={{ ...baseNft, contract: '0xabc' }} />);
    await waitFor(() => expect(screen.getByTestId('link')).toHaveAttribute('href', `https://opensea.io/assets/ethereum/0xabc/${baseNft.token}`));
    expect(screen.getByTestId('link')).toHaveAttribute('target', '_blank');
  });
});
