import { getNftsForContractAndOwner } from '../../services/alchemy-api';
import { sepolia } from 'wagmi/chains';

it('fetches all pages and maps nfts', async () => {
  const responses = [
    { ownedNfts:[{ tokenId:'1', tokenType:'ERC721', name:'a', tokenUri:'u1', image:'i1' }], pageKey:'next' },
    { ownedNfts:[{ tokenId:'2', tokenType:'ERC721', name:'b', tokenUri:'u2', image:'i2' }] }
  ];
  let call = 0;
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(responses[call++]) })) as any;
  process.env.ALCHEMY_API_KEY = 'key';
  const result = await getNftsForContractAndOwner(sepolia.id, '0xc', '0xowner');
  expect(result).toHaveLength(2);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect((fetch as any).mock.calls[0][0]).toContain('eth-sepolia');
});
