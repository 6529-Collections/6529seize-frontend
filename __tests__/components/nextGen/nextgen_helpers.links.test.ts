import { getOpenseaLink } from '@/components/nextGen/nextgen_helpers';
import { sepolia } from 'viem/chains';

describe('nextgen_helpers links', () => {
  it('generates opensea link for sepolia chain', () => {
    const link = getOpenseaLink(sepolia.id, 123);
    expect(link).toContain('/sepolia/');
    expect(link).toContain('123');
  });
});
