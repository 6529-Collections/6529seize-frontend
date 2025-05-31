import { render, screen } from '@testing-library/react';
import React from 'react';
import NextGenCollectionMintPage from '../../pages/nextgen/collection/[collection]/mint';
import NextGenCollectionToken from '../../pages/nextgen/token/[token]/[[...view]]';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    query: { token: '123', view: ['display'] }
  })
}));

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic-component" />);

jest.mock('../../pages/nextgen/collection/[collection]/[[...view]]', () => ({
  useShallowRedirect: jest.fn()
}));

jest.mock('../../components/nextGen/collections/collectionParts/NextGenCollectionHeader', () => ({
  NextGenCollectionHead: ({ collection }: any) => (
    <div data-testid="collection-head">{collection?.name}</div>
  ),
  getServerSideCollection: jest.fn().mockResolvedValue({
    props: {
      collection: { name: 'Test Collection' }
    }
  })
}));

jest.mock('../../components/nextGen/collections/NextGenNavigationHeader', () => () => (
  <div data-testid="navigation-header" />
));

const mockAuthContext = {
  setTitle: jest.fn(),
  connectedProfile: null,
  activeProfileProxy: null,
  requestAuth: jest.fn()
} as any;

function renderWithAuth(component: React.ReactElement) {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
}

const mockMintPageProps = {
  pageProps: {
    collection: {
      name: 'Test Collection',
      id: 1
    }
  }
};

const mockTokenPageProps = {
  pageProps: {
    token_id: 123,
    token: {
      id: 123,
      name: 'Test Token',
      collection_id: 1
    },
    traits: [],
    tokenCount: 100,
    collection: {
      name: 'Test Collection',
      id: 1
    },
    view: 'ABOUT'
  }
};

describe('NextGen pages render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders NextGen Collection Mint page', () => {
    render(<NextGenCollectionMintPage {...mockMintPageProps} />);
    expect(screen.getByTestId('collection-head')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-component')).toBeInTheDocument();
  });

  it('renders NextGen Token page with token', () => {
    renderWithAuth(<NextGenCollectionToken {...mockTokenPageProps} />);
    expect(screen.getByTestId('navigation-header')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-component')).toBeInTheDocument();
    expect(mockAuthContext.setTitle).toHaveBeenCalled();
  });

  it('renders NextGen Token page without token (on-chain)', () => {
    const propsWithoutToken = {
      ...mockTokenPageProps,
      pageProps: {
        ...mockTokenPageProps.pageProps,
        token: null
      }
    };
    renderWithAuth(<NextGenCollectionToken {...propsWithoutToken} />);
    expect(screen.getByTestId('navigation-header')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-component')).toBeInTheDocument();
  });

  it('calls setTitle on token page mount', () => {
    renderWithAuth(<NextGenCollectionToken {...mockTokenPageProps} />);
    expect(mockAuthContext.setTitle).toHaveBeenCalledWith({
      title: 'Test Token'
    });
  });
});