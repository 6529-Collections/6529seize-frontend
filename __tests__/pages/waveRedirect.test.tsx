import { GetServerSidePropsContext } from 'next';
import { getServerSideProps } from '../../pages/waves/[wave]';
import WaveRedirect from '../../pages/waves/[wave]';

describe('Wave redirect page', () => {
  it('returns null component', () => {
    const result = WaveRedirect();
    expect(result).toBeNull();
  });

  it('redirects to my-stream with wave parameter', async () => {
    const context = {
      params: { wave: 'test-wave-123' }
    } as GetServerSidePropsContext;

    const result = await getServerSideProps(context);

    expect(result).toEqual({
      redirect: {
        destination: '/my-stream?wave=test-wave-123',
        permanent: false
      }
    });
  });

  it('handles different wave IDs correctly', async () => {
    const context = {
      params: { wave: 'another-wave' }
    } as GetServerSidePropsContext;

    const result = await getServerSideProps(context);

    expect(result).toEqual({
      redirect: {
        destination: '/my-stream?wave=another-wave',
        permanent: false
      }
    });
  });
});