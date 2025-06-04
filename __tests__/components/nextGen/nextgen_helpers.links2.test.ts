import { getOpenseaLink } from '../../../components/nextGen/nextgen_helpers';
import { goerli } from 'viem/chains';

describe('nextgen_helpers links extra', () => {
  it('creates goerli opensea link', () => {
    const link = getOpenseaLink(goerli.id, 42);
    expect(link).toContain('/goerli/');
    expect(link).toContain('42');
  });
});
