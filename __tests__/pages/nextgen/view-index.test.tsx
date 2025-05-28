import { getServerSideProps } from '../../../pages/nextgen/[[...view]]/index';
import { NextGenView } from '../../../components/nextGen/collections/NextGenNavigationHeader';
import { getCommonHeaders } from '../../../helpers/server.helpers';
import { commonApiFetch } from '../../../services/api/common-api';

jest.mock('../../../helpers/server.helpers', () => ({
  getCommonHeaders: jest.fn(() => ({ h: 'h' })),
}));

jest.mock('../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

const mockedHeaders = getCommonHeaders as jest.Mock;
const mockedFetch = commonApiFetch as jest.Mock;

describe('NextGen [[...view]] getServerSideProps', () => {
  beforeEach(() => {
    mockedFetch.mockClear();
    mockedHeaders.mockClear();
    process.env.BASE_ENDPOINT = 'http://base';
  });

  it('returns collection and parsed view', async () => {
    mockedFetch.mockResolvedValue({ id: 1 });
    const res = await getServerSideProps({ query: { view: ['artists'] } } as any, null as any, '/p');
    expect(mockedHeaders).toHaveBeenCalled();
    expect(mockedFetch).toHaveBeenCalledWith({ endpoint: 'nextgen/featured', headers: { h: 'h' } });
    expect(res).toEqual({
      props: {
        collection: { id: 1 },
        view: NextGenView.ARTISTS,
        metadata: {
          title: 'NextGen Artists',
          ogImage: 'http://base/nextgen.png',
          description: 'NextGen',
          twitterCard: 'summary_large_image',
        },
      },
    });
  });

  it('handles missing view', async () => {
    mockedFetch.mockResolvedValue({ id: 2 });
    const res = await getServerSideProps({ query: {} } as any, null as any, '/p');
    expect(res.props.view).toBeNull();
  });
});
