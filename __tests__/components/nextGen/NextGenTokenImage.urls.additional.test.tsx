import { getNextGenImageUrl, getNextGenIconUrl, get8KUrl, get16KUrl } from '../../../components/nextGen/collections/nextgenToken/NextGenTokenImage';

describe('NextGenTokenImage url helpers', () => {
  it('builds urls for various sizes', () => {
    expect(getNextGenImageUrl(10)).toContain('/png/10');
    expect(getNextGenIconUrl(10)).toContain('/thumbnail/10');
    expect(get8KUrl(10)).toContain('/png8k/10');
    expect(get16KUrl(10)).toContain('/png16k/10');
  });
});
