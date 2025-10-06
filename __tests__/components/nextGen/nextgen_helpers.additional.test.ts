import { getCollectionBaseBreadcrums, formatNameForUrl } from '@/components/nextGen/nextgen_helpers';
import { NextGenCollection } from '@/entities/INextgen';

describe('nextgen_helpers additional', () => {
  it('builds breadcrumbs for collection', () => {
    const collection = { name: 'My Collection' } as NextGenCollection;
    const crumbs = getCollectionBaseBreadcrums(collection, 'Page');
    expect(crumbs).toEqual([
      { display: 'Home', href: '/' },
      { display: 'NextGen', href: '/nextgen' },
      { display: 'My Collection', href: `/nextgen/collection/${formatNameForUrl('My Collection')}` },
      { display: 'Page' }
    ]);
  });
});
