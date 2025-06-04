import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
const mockSetTitle = jest.fn();
jest.mock('../../../components/auth/Auth', () => ({ useAuth: jest.fn(() => ({ setTitle: mockSetTitle })) }));
jest.mock('next/dynamic', () => () => () => <div data-testid="dyn" />);
jest.mock('../../../components/nextGen/collections/NextGenNavigationHeader', () => {
  const actual = jest.requireActual('../../../components/nextGen/collections/NextGenNavigationHeader');
  return {
    __esModule: true,
    NextGenView: actual.NextGenView,
    default: ({ view, setView }: any) => (
      <button data-testid="nav" onClick={() => setView(actual.NextGenView.ARTISTS)}>{view}</button>
    ),
  };
});

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

describe('NextGen page component', () => {
  const push = jest.fn();
  const useRouterMock = require('next/router').useRouter as jest.Mock;

  beforeEach(() => {
    push.mockClear();
    mockSetTitle.mockClear();
    useRouterMock.mockReturnValue({ query: {}, push });
  });

  it('calls router.push when navigation header changes view', () => {
    const NextGen = require('../../../pages/nextgen/[[...view]]/index').default;
    render(<NextGen pageProps={{ collection: { id: 1 }, view: undefined }} />);
    fireEvent.click(screen.getByTestId('nav'));
    expect(push).toHaveBeenCalledWith('/nextgen/artists', undefined, { shallow: true });
  });

  it('sets title on mount and shows placeholder without collection', () => {
    const NextGen = require('../../../pages/nextgen/[[...view]]/index').default;
    render(<NextGen pageProps={{ collection: null, view: null }} />);
    expect(screen.getByAltText('questionmark')).toBeInTheDocument();
    expect(mockSetTitle).toHaveBeenCalledWith({ title: 'NextGen ' });
  });
});
