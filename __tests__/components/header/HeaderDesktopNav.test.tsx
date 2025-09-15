import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock all external dependencies first
jest.mock('react-bootstrap', () => {
  const MockNavDropdown = ({ title, children, className }: any) => 
    <div data-testid={`nav-dropdown-${title.toLowerCase()}`} className={className}>
      {title}
      {children}
    </div>;
  
  MockNavDropdown.Item = ({ children }: any) => <div data-testid="nav-item">{children}</div>;
  MockNavDropdown.Divider = () => <div data-testid="nav-divider" />;

  return {
    NavDropdown: MockNavDropdown
  };
});

jest.mock('../../../components/header/HeaderDesktopLink', () => ({ 
  __esModule: true, 
  default: ({ link }: any) => (
    <div data-testid={`link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}>
      {link.name}
    </div>
  )
}));

jest.mock('../../../components/header/Header.module.scss', () => ({ 
  mainNavLink: 'main-nav-link', 
  mainNavLinkPadding: 'main-nav-link-padding', 
  submenuContainer: 'submenu-container', 
  nestedMenu: 'nested-menu' 
}));

jest.mock('@fortawesome/react-fontawesome', () => ({ 
  FontAwesomeIcon: ({ height, width }: any) => (
    <span data-testid="chevron-icon" data-height={height} data-width={width} />
  )
}));

jest.mock('@fortawesome/free-solid-svg-icons', () => ({ 
  faChevronRight: 'chevron-right' 
}));

// Import the component after all mocks are set up
import HeaderDesktopNav from '../../../components/header/HeaderDesktopNav';

describe('HeaderDesktopNav', () => {
  it('renders navigation dropdowns', () => {
    const props = {
      showWaves: true,
      appWalletsSupported: true,
      capacitorIsIos: false,
      country: 'US',
      pathname: '/'
    };
    render(<HeaderDesktopNav {...props} />);
    
    // Should render all main dropdowns
    expect(screen.getByText('Brain')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('does not render brain dropdown when showWaves is false', () => {
    const props = {
      showWaves: false,
      appWalletsSupported: true,
      capacitorIsIos: false,
      country: 'US',
      pathname: '/'
    };
    render(<HeaderDesktopNav {...props} />);
    
    expect(screen.queryByText('Brain')).not.toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('renders links based on conditions', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={true} capacitorIsIos={false} country="US" pathname="/" />);
    
    expect(screen.getByTestId('link-my-stream')).toBeInTheDocument();
    expect(screen.getByTestId('link-waves')).toBeInTheDocument();
    expect(screen.getByTestId('link-app-wallets')).toBeInTheDocument();
  });

  it('hides app wallets when not supported', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={false} capacitorIsIos={false} country="US" pathname="/" />);
    
    expect(screen.queryByTestId('link-app-wallets')).not.toBeInTheDocument();
  });

  it('hides Memes Subscriptions on iOS for non-US countries', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={true} capacitorIsIos={true} country="CA" pathname="/" />);
    
    expect(screen.queryByTestId('link-memes-subscriptions')).not.toBeInTheDocument();
  });

  it('shows Memes Subscriptions on iOS for US country', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={true} capacitorIsIos={true} country="US" pathname="/" />);
    
    expect(screen.getByTestId('link-memes-subscriptions')).toBeInTheDocument();
  });

  it('shows Memes Subscriptions on non-iOS devices regardless of country', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={true} capacitorIsIos={false} country="CA" pathname="/" />);
    
    expect(screen.getByTestId('link-memes-subscriptions')).toBeInTheDocument();
  });

  it('applies active class to About dropdown when pathname contains /about', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={true} capacitorIsIos={false} country="US" pathname="/about/memes" />);
    
    expect(screen.getByTestId('nav-dropdown-about')).toHaveClass('active');
  });

  it('does not apply active class to About dropdown when pathname does not contain /about', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={true} capacitorIsIos={false} country="US" pathname="/waves" />);
    
    expect(screen.getByTestId('nav-dropdown-about')).not.toHaveClass('active');
  });

  it('renders toolsBottomItems in Tools dropdown', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={true} capacitorIsIos={false} country="US" pathname="/" />);
    
    expect(screen.getByTestId('link-api')).toBeInTheDocument();
    expect(screen.getByTestId('link-emma')).toBeInTheDocument();
    expect(screen.getByTestId('link-block-finder')).toBeInTheDocument();
    expect(screen.getByTestId('link-open-data')).toBeInTheDocument();
  });

  it('renders sections with dividers correctly', () => {
    render(<HeaderDesktopNav showWaves={true} appWalletsSupported={true} capacitorIsIos={false} country="US" pathname="/" />);
    
    // Should render dividers for sections that have hasDivider: true
    expect(screen.getAllByTestId('nav-divider').length).toBeGreaterThan(0);
  });
});