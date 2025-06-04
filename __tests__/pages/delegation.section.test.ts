import { getServerSideProps } from '../../pages/delegation/[...section]';
import { DelegationCenterSection } from '../../components/delegation/DelegationCenterMenu';

describe('delegation getServerSideProps', () => {
  it('returns props for known section', async () => {
    const query = { section: ['delegation-center'], address: '0x1', collection: 'c', use_case: '2' } as any;
    const res = await getServerSideProps({ query } as any, null as any, null as any);
    expect(res).toEqual({
      props: {
        section: DelegationCenterSection.CENTER,
        addressQuery: '0x1',
        collectionQuery: 'c',
        useCaseQuery: 2,
        metadata: {
          title: 'Delegation Center',
          description: 'NFT Delegation',
          twitterCard: 'summary_large_image'
        }
      }
    });
  });

  it('returns html section for unknown path', async () => {
    const query = { section: ['unknown','path'] } as any;
    const res = await getServerSideProps({ query } as any, null as any, null as any);
    expect(res).toEqual({ props: { section: DelegationCenterSection.HTML, path: query.section } });
  });
});
