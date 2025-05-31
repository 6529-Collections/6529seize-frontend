import React from 'react';
import { render, screen } from '@testing-library/react';
import NFTActivityPage from '../../pages/nft-activity';
import { AuthContext } from '../../components/auth/Auth';

// Mock the LatestActivity component since it's dynamically imported and may have complex dependencies
jest.mock('../../components/latest-activity/LatestActivity', () => {
  return function MockLatestActivity({ page, pageSize, showMore }: any) {
    return (
      <div data-testid="latest-activity">
        <span data-testid="page">Page: {page}</span>
        <span data-testid="pageSize">Page Size: {pageSize}</span>
        <span data-testid="showMore">Show More: {showMore ? 'true' : 'false'}</span>
      </div>
    );
  };
});

// Mock react-bootstrap components
jest.mock('react-bootstrap', () => ({
  Container: ({ children, fluid, className }: any) => (
    <div data-testid="container" className={className} data-fluid={fluid}>
      {children}
    </div>
  ),
  Row: ({ children }: any) => (
    <div data-testid="row">{children}</div>
  ),
  Col: ({ children }: any) => (
    <div data-testid="col">{children}</div>
  ),
}));

// Mock styles
jest.mock('../../styles/Home.module.scss', () => ({
  main: 'main-class',
  leaderboardContainer: 'leaderboard-container-class',
}));

describe('NFTActivityPage', () => {
  const mockSetTitle = jest.fn();
  
  const mockAuthContext = {
    setTitle: mockSetTitle,
    connectedProfile: null,
    activeProfileProxy: null,
    requestAuth: jest.fn(),
    setRequestAuth: jest.fn(),
    receivedProfileProxies: [],
    setReceivedProfileProxies: jest.fn(),
    showWaves: false,
    setShowWaves: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <NFTActivityPage />
      </AuthContext.Provider>
    );
  };

  it('renders the main layout structure', () => {
    renderComponent();
    
    expect(screen.getByTestId('container')).toBeInTheDocument();
    expect(screen.getByTestId('row')).toBeInTheDocument();
    expect(screen.getByTestId('col')).toBeInTheDocument();
  });

  it('renders the LatestActivity component with correct props', () => {
    renderComponent();
    
    expect(screen.getByTestId('latest-activity')).toBeInTheDocument();
    expect(screen.getByTestId('page')).toHaveTextContent('Page: 1');
    expect(screen.getByTestId('pageSize')).toHaveTextContent('Page Size: 50');
    expect(screen.getByTestId('showMore')).toHaveTextContent('Show More: true');
  });

  it('applies correct CSS classes', () => {
    renderComponent();
    
    const container = screen.getByTestId('container');
    expect(container).toHaveClass('leaderboard-container-class');
    expect(container).toHaveAttribute('data-fluid', 'true');
  });

  it('sets the page title on mount', () => {
    renderComponent();
    
    expect(mockSetTitle).toHaveBeenCalledWith({
      title: 'NFT Activity | Network',
    });
  });

  it('has correct metadata', () => {
    expect(NFTActivityPage.metadata).toEqual({
      title: 'NFT Activity',
      description: 'Network',
    });
  });

  it('renders with main element having correct class', () => {
    const { container } = renderComponent();
    
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('main-class');
  });
});