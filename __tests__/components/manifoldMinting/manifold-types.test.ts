import { getTraitValue, ManifoldInstance } from '@/components/manifoldMinting/manifold-types';

describe('getTraitValue', () => {
  const instance: ManifoldInstance = {
    id: 1,
    creator: { id: 0, name: 'c', address: '0x' },
    slug: 's',
    publicData: {
      asset: {
        created_by: 'c',
        description: 'd',
        name: 'name',
        external_url: 'url',
        attributes: [
          { trait_type: 'foo', value: 'bar' },
          { trait_type: 'baz', value: 'qux' },
        ] as any,
        image_details: { bytes: 0, format: '', sha256: '', width: 0, height: 0 },
        image: '',
        image_url: '',
        animation_details: { bytes: 0, format: '', sha256: '' },
        animation: '',
        animation_url: '',
      },
      endDate: 0,
      network: 0,
      contract: { name: '', symbol: '', contractAddress: '', networkId: 0, spec: '' },
      mintPrice: { value: '0', decimals: 0, currency: '', erc20: '' },
      startDate: 0,
      description: '',
      instanceAllowlist: { merkleTreeId: 0 },
      mintingRestriction: '',
      extensionAddress721: { value: '', version: 0 },
      extensionAddress1155: { value: '', version: 0 },
    },
    appId: 0,
  };

  it('returns value when trait exists', () => {
    expect(getTraitValue(instance, 'foo')).toBe('bar');
  });

  it('returns undefined for missing trait', () => {
    expect(getTraitValue(instance, 'missing')).toBeUndefined();
  });
});
