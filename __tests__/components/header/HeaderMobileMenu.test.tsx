import { fireEvent, render, screen } from '@testing-library/react';
import HeaderMobileMenu from '@/components/header/HeaderMobileMenu';

// Mock dependencies
jest.mock('next/link', () => ({ 
  __esModule: true, 
  default: ({ href, children }: any) => <a href={href}>{children}</a> 
}));

jest.mock('@/components/header/HeaderLogo', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="header-logo" data-small={props.isSmall} data-capacitor={props.isCapacitor} data-mobile={props.isMobile}>
      Logo
    </div>
  )
}));

jest.mock('@/components/header/user/HeaderUser', () => ({
  __esModule: true,
  default: () => <div data-testid="header-user">User</div>
}));

jest.mock('@/components/header/share/HeaderQRScanner', () => ({
  __esModule: true,
  default: ({ onScanSuccess }: any) => (
    <button data-testid="qr-scanner" onClick={onScanSuccess}>QR Scanner</button>
  )
}));

jest.mock('@/components/header/HeaderMobileUtils', () => ({
  printMobileHr: () => <hr data-testid="mobile-hr" />,
  printMobileSubheader: (name: string) => (
    <h3 data-testid="mobile-subheader">{name}</h3>
  ),
  printMobileRow: (name: string, path: string) => (
    <div data-testid="mobile-row" data-path={path}>{name}</div>
  )
}));

interface HeaderMobileMenuProps {
  burgerMenuOpen: boolean;
  setBurgerMenuOpen: (open: boolean) => void;
  showBurgerMenuCollections: boolean;
  setShowBurgerMenuCollections: (show: boolean) => void;
  showBurgerMenuAbout: boolean;
  setShowBurgerMenuAbout: (show: boolean) => void;
  showBurgerMenuCommunity: boolean;
  setShowBurgerMenuCommunity: (show: boolean) => void;
  showBurgerMenuTools: boolean;
  setShowBurgerMenuTools: (show: boolean) => void;
  showBurgerMenuBrain: boolean;
  setShowBurgerMenuBrain: (show: boolean) => void;
  isSmall?: boolean;
  isCapacitor: boolean;
  isMobile: boolean;
  showWaves: boolean;
  appWalletsSupported: boolean;
  capacitorIsIos: boolean;
  country: string;
}

const defaultProps: HeaderMobileMenuProps = {
  burgerMenuOpen: false,
  setBurgerMenuOpen: jest.fn(),
  showBurgerMenuCollections: false,
  setShowBurgerMenuCollections: jest.fn(),
  showBurgerMenuAbout: false,
  setShowBurgerMenuAbout: jest.fn(),
  showBurgerMenuCommunity: false,
  setShowBurgerMenuCommunity: jest.fn(),
  showBurgerMenuTools: false,
  setShowBurgerMenuTools: jest.fn(),
  showBurgerMenuBrain: false,
  setShowBurgerMenuBrain: jest.fn(),
  isSmall: false,
  isCapacitor: false,
  isMobile: false,
  showWaves: true,
  appWalletsSupported: false,
  capacitorIsIos: false,
  country: 'US'
};

function renderHeaderMobileMenu(props: Partial<HeaderMobileMenuProps> = {}) {
  const mergedProps = { ...defaultProps, ...props };
  return render(<HeaderMobileMenu {...mergedProps} />);
}

describe('HeaderMobileMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderHeaderMobileMenu();
      expect(screen.getByTestId('header-logo')).toBeInTheDocument();
      expect(screen.getByTestId('header-user')).toBeInTheDocument();
      expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    });

    it('applies open class when burgerMenuOpen is true', () => {
      const { container } = renderHeaderMobileMenu({ burgerMenuOpen: true });
      const menuElement = container.querySelector('.burgerMenu');
      expect(menuElement).toHaveClass('burgerMenuOpen');
    });

    it('does not apply open class when burgerMenuOpen is false', () => {
      const { container } = renderHeaderMobileMenu({ burgerMenuOpen: false });
      const menuElement = container.querySelector('.burgerMenu');
      expect(menuElement).not.toHaveClass('burgerMenuOpen');
    });

    it('passes correct props to HeaderLogo', () => {
      renderHeaderMobileMenu({ 
        isSmall: true, 
        isCapacitor: true, 
        isMobile: true 
      });
      
      const logo = screen.getByTestId('header-logo');
      expect(logo).toHaveAttribute('data-small', 'true');
      expect(logo).toHaveAttribute('data-capacitor', 'true');
      expect(logo).toHaveAttribute('data-mobile', 'true');
    });
  });

  describe('Close Button Functionality', () => {
    it('calls all close handlers when close button is clicked', () => {
      const setBurgerMenuOpen = jest.fn();
      const setShowBurgerMenuCollections = jest.fn();
      const setShowBurgerMenuAbout = jest.fn();
      const setShowBurgerMenuCommunity = jest.fn();
      const setShowBurgerMenuTools = jest.fn();
      const setShowBurgerMenuBrain = jest.fn();

      renderHeaderMobileMenu({
        setBurgerMenuOpen,
        setShowBurgerMenuCollections,
        setShowBurgerMenuAbout,
        setShowBurgerMenuCommunity,
        setShowBurgerMenuTools,
        setShowBurgerMenuBrain
      });

      // Find the close button by its FontAwesome icon
      const { container } = renderHeaderMobileMenu({
        setBurgerMenuOpen,
        setShowBurgerMenuCollections,
        setShowBurgerMenuAbout,
        setShowBurgerMenuCommunity,
        setShowBurgerMenuTools,
        setShowBurgerMenuBrain
      });
      
      const closeButton = container.querySelector('.burgerMenuClose');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      expect(setBurgerMenuOpen).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuAbout).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuCommunity).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuTools).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuBrain).toHaveBeenCalledWith(false);
    });
  });

  describe('QR Scanner Integration', () => {
    it('closes burger menu when QR scan is successful', () => {
      const setBurgerMenuOpen = jest.fn();
      renderHeaderMobileMenu({ setBurgerMenuOpen });

      const qrButton = screen.getByTestId('qr-scanner');
      fireEvent.click(qrButton);

      expect(setBurgerMenuOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('Brain Section', () => {
    it('shows brain section when showWaves is true', () => {
      renderHeaderMobileMenu({ showWaves: true });
      expect(screen.getByText('Brain')).toBeInTheDocument();
    });

    it('hides brain section when showWaves is false', () => {
      renderHeaderMobileMenu({ showWaves: false });
      expect(screen.queryByText('Brain')).not.toBeInTheDocument();
    });

    it('toggles brain dropdown on click', () => {
      const setShowBurgerMenuBrain = jest.fn();
      const setShowBurgerMenuCollections = jest.fn();
      const setShowBurgerMenuCommunity = jest.fn();
      const setShowBurgerMenuAbout = jest.fn();
      const setShowBurgerMenuTools = jest.fn();

      renderHeaderMobileMenu({ 
        showWaves: true,
        showBurgerMenuBrain: false,
        setShowBurgerMenuBrain,
        setShowBurgerMenuCollections,
        setShowBurgerMenuCommunity,
        setShowBurgerMenuAbout,
        setShowBurgerMenuTools
      });

      const brainHeader = screen.getByText('Brain');
      fireEvent.click(brainHeader);

      // Should toggle brain to true
      expect(setShowBurgerMenuBrain).toHaveBeenCalledWith(true);
      // Should close other sections
      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuCommunity).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuAbout).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuTools).toHaveBeenCalledWith(false);
    });

    it('responds to keyboard events on brain header', () => {
      const setShowBurgerMenuBrain = jest.fn();
      
      renderHeaderMobileMenu({ 
        showWaves: true,
        showBurgerMenuBrain: false,
        setShowBurgerMenuBrain
      });

      const brainHeader = screen.getByText('Brain');
      
      // Test Enter key
      fireEvent.keyDown(brainHeader, { key: 'Enter' });
      expect(setShowBurgerMenuBrain).toHaveBeenCalledWith(true);

      jest.clearAllMocks();
      
      // Test Space key
      fireEvent.keyDown(brainHeader, { key: ' ' });
      expect(setShowBurgerMenuBrain).toHaveBeenCalledWith(true);

      jest.clearAllMocks();
      
      // Test other key (should not trigger)
      fireEvent.keyDown(brainHeader, { key: 'Tab' });
      expect(setShowBurgerMenuBrain).not.toHaveBeenCalled();
    });

    it('displays brain menu items when expanded', () => {
      renderHeaderMobileMenu({ 
        showWaves: true,
        showBurgerMenuBrain: true
      });

      const mobileRows = screen.getAllByTestId('mobile-row');
      const brainRows = mobileRows.filter(row => 
        row.getAttribute('data-path') === '/my-stream' || 
        row.getAttribute('data-path') === '/waves'
      );
      
      expect(brainRows).toHaveLength(2);
      expect(screen.getByText('My Stream')).toBeInTheDocument();
      expect(screen.getByText('Waves')).toBeInTheDocument();
    });
  });

  describe('Collections Section', () => {
    it('renders collections header', () => {
      renderHeaderMobileMenu();
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });

    it('toggles collections dropdown on click', () => {
      const setShowBurgerMenuCollections = jest.fn();
      const setShowBurgerMenuCommunity = jest.fn();
      const setShowBurgerMenuAbout = jest.fn();
      const setShowBurgerMenuTools = jest.fn();
      const setShowBurgerMenuBrain = jest.fn();

      renderHeaderMobileMenu({ 
        showBurgerMenuCollections: false,
        setShowBurgerMenuCollections,
        setShowBurgerMenuCommunity,
        setShowBurgerMenuAbout,
        setShowBurgerMenuTools,
        setShowBurgerMenuBrain
      });

      const collectionsHeader = screen.getByText('Collections');
      fireEvent.click(collectionsHeader);

      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(true);
      expect(setShowBurgerMenuCommunity).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuAbout).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuTools).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuBrain).toHaveBeenCalledWith(false);
    });

    it('displays collections menu items when expanded', () => {
      renderHeaderMobileMenu({ showBurgerMenuCollections: true });

      expect(screen.getByText('The Memes')).toBeInTheDocument();
      expect(screen.getByText('Gradient')).toBeInTheDocument();
      expect(screen.getByText('NextGen')).toBeInTheDocument();
      expect(screen.getByText('Meme Lab')).toBeInTheDocument();
      expect(screen.getByText('ReMemes')).toBeInTheDocument();
    });

    it('responds to keyboard events on collections header', () => {
      const setShowBurgerMenuCollections = jest.fn();
      
      renderHeaderMobileMenu({ 
        showBurgerMenuCollections: false,
        setShowBurgerMenuCollections
      });

      const collectionsHeader = screen.getByText('Collections');
      
      fireEvent.keyDown(collectionsHeader, { key: 'Enter' });
      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(true);

      jest.clearAllMocks();
      
      fireEvent.keyDown(collectionsHeader, { key: ' ' });
      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(true);
    });
  });

  describe('Network Section', () => {
    it('renders network header', () => {
      renderHeaderMobileMenu();
      expect(screen.getByText('Network')).toBeInTheDocument();
    });

    it('toggles network dropdown on click', () => {
      const setShowBurgerMenuCommunity = jest.fn();
      const setShowBurgerMenuCollections = jest.fn();
      const setShowBurgerMenuAbout = jest.fn();
      const setShowBurgerMenuTools = jest.fn();

      renderHeaderMobileMenu({ 
        showBurgerMenuCommunity: false,
        setShowBurgerMenuCommunity,
        setShowBurgerMenuCollections,
        setShowBurgerMenuAbout,
        setShowBurgerMenuTools
      });

      const networkHeader = screen.getByText('Network');
      fireEvent.click(networkHeader);

      expect(setShowBurgerMenuCommunity).toHaveBeenCalledWith(true);
      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuAbout).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuTools).toHaveBeenCalledWith(false);
    });

    it('displays network menu items when expanded', () => {
      renderHeaderMobileMenu({ showBurgerMenuCommunity: true });

      expect(screen.getByText('Identities')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
      expect(screen.getByText('NFT Activity')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Definitions')).toBeInTheDocument();
      expect(screen.getByText('Network Stats')).toBeInTheDocument();
      expect(screen.getByText('Levels')).toBeInTheDocument();
    });
  });

  describe('Tools Section', () => {
    it('renders tools header', () => {
      renderHeaderMobileMenu();
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });

    it('toggles tools dropdown on click', () => {
      const setShowBurgerMenuTools = jest.fn();
      const setShowBurgerMenuCollections = jest.fn();
      const setShowBurgerMenuCommunity = jest.fn();
      const setShowBurgerMenuAbout = jest.fn();

      renderHeaderMobileMenu({ 
        showBurgerMenuTools: false,
        setShowBurgerMenuTools,
        setShowBurgerMenuCollections,
        setShowBurgerMenuCommunity,
        setShowBurgerMenuAbout
      });

      const toolsHeader = screen.getByText('Tools');
      fireEvent.click(toolsHeader);

      expect(setShowBurgerMenuTools).toHaveBeenCalledWith(true);
      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuCommunity).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuAbout).toHaveBeenCalledWith(false);
    });

    it('shows app wallets when supported', () => {
      renderHeaderMobileMenu({ 
        showBurgerMenuTools: true,
        appWalletsSupported: true
      });

      expect(screen.getByText('App Wallets')).toBeInTheDocument();
    });

    it('hides app wallets when not supported', () => {
      renderHeaderMobileMenu({ 
        showBurgerMenuTools: true,
        appWalletsSupported: false
      });

      expect(screen.queryByText('App Wallets')).not.toBeInTheDocument();
    });

    it('shows subscription tools for US users', () => {
      renderHeaderMobileMenu({ 
        showBurgerMenuTools: true,
        capacitorIsIos: true,
        country: 'US'
      });

      expect(screen.getByText('Memes Subscriptions')).toBeInTheDocument();
    });

    it('shows subscription tools for non-iOS users', () => {
      renderHeaderMobileMenu({ 
        showBurgerMenuTools: true,
        capacitorIsIos: false,
        country: 'FR'
      });

      expect(screen.getByText('Memes Subscriptions')).toBeInTheDocument();
    });

    it('hides subscription tools for iOS users outside US', () => {
      renderHeaderMobileMenu({ 
        showBurgerMenuTools: true,
        capacitorIsIos: true,
        country: 'FR'
      });

      expect(screen.queryByText('Memes Subscriptions')).not.toBeInTheDocument();
    });

    it('displays standard tools menu items when expanded', () => {
      renderHeaderMobileMenu({ showBurgerMenuTools: true });

      expect(screen.getByText('Delegation Center')).toBeInTheDocument();
      expect(screen.getByText('Wallet Architecture')).toBeInTheDocument();
      expect(screen.getByText('Delegation FAQs')).toBeInTheDocument();
      expect(screen.getByText('Consolidation Use Cases')).toBeInTheDocument();
      expect(screen.getByText('Wallet Checker')).toBeInTheDocument();
      expect(screen.getByText('Meme Accounting')).toBeInTheDocument();
      expect(screen.getByText('Meme Gas')).toBeInTheDocument();
      expect(screen.getByText('API')).toBeInTheDocument();
      expect(screen.getByText('EMMA')).toBeInTheDocument();
      expect(screen.getByText('Block Finder')).toBeInTheDocument();
      expect(screen.getByText('Open Data')).toBeInTheDocument();
    });
  });

  describe('About Section', () => {
    it('renders about header', () => {
      renderHeaderMobileMenu();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('toggles about dropdown on click', () => {
      const setShowBurgerMenuAbout = jest.fn();
      const setShowBurgerMenuCollections = jest.fn();
      const setShowBurgerMenuCommunity = jest.fn();
      const setShowBurgerMenuTools = jest.fn();

      renderHeaderMobileMenu({ 
        showBurgerMenuAbout: false,
        setShowBurgerMenuAbout,
        setShowBurgerMenuCollections,
        setShowBurgerMenuCommunity,
        setShowBurgerMenuTools
      });

      const aboutHeader = screen.getByText('About');
      fireEvent.click(aboutHeader);

      expect(setShowBurgerMenuAbout).toHaveBeenCalledWith(true);
      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuCommunity).toHaveBeenCalledWith(false);
      expect(setShowBurgerMenuTools).toHaveBeenCalledWith(false);
    });

    it('shows subscription section for US users', () => {
      renderHeaderMobileMenu({ 
        showBurgerMenuAbout: true,
        capacitorIsIos: true,
        country: 'US'
      });

      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    });

    it('shows subscription section for non-iOS users', () => {
      renderHeaderMobileMenu({ 
        showBurgerMenuAbout: true,
        capacitorIsIos: false,
        country: 'FR'
      });

      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    });

    it('hides subscription section for iOS users outside US', () => {
      renderHeaderMobileMenu({ 
        showBurgerMenuAbout: true,
        capacitorIsIos: true,
        country: 'FR'
      });

      expect(screen.queryByText('Subscriptions')).not.toBeInTheDocument();
    });

    it('displays about menu items when expanded', () => {
      renderHeaderMobileMenu({ showBurgerMenuAbout: true });

      // NFTs section
      expect(screen.getByText('The Memes')).toBeInTheDocument();
      expect(screen.getByText('Minting')).toBeInTheDocument();
      expect(screen.getByText('Nakamoto Threshold')).toBeInTheDocument();
      expect(screen.getByText('Meme Lab')).toBeInTheDocument();
      expect(screen.getByText('Gradients')).toBeInTheDocument();
      expect(screen.getByText('GDRC1')).toBeInTheDocument();

      // NFT Delegation section
      expect(screen.getByText('About NFTD')).toBeInTheDocument();
      expect(screen.getByText('Primary Address')).toBeInTheDocument();

      // 6529 Capital section
      expect(screen.getByText('About 6529 Capital')).toBeInTheDocument();
      expect(screen.getByText('Company Portfolio')).toBeInTheDocument();
      expect(screen.getByText('NFT Fund')).toBeInTheDocument();

      // Support section
      expect(screen.getByText('FAQ')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();

      // Resources section
      expect(screen.getByText('Data Decentralization')).toBeInTheDocument();
      expect(screen.getByText('ENS')).toBeInTheDocument();
      expect(screen.getByText('License')).toBeInTheDocument();
      expect(screen.getByText('Release Notes')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies correct caret classes when sections are closed', () => {
      const { container } = renderHeaderMobileMenu({
        showWaves: true,
        showBurgerMenuBrain: false,
        showBurgerMenuCollections: false,
        showBurgerMenuCommunity: false,
        showBurgerMenuTools: false,
        showBurgerMenuAbout: false
      });

      // Find headers by their text content
      const headers = container.querySelectorAll('h3');
      const brainHeader = Array.from(headers).find(h => h.textContent === 'Brain');
      const collectionsHeader = Array.from(headers).find(h => h.textContent === 'Collections');
      const networkHeader = Array.from(headers).find(h => h.textContent === 'Network');
      const toolsHeader = Array.from(headers).find(h => h.textContent === 'Tools');
      const aboutHeader = Array.from(headers).find(h => h.textContent === 'About');

      // All should have the open caret class when closed
      [brainHeader, collectionsHeader, networkHeader, toolsHeader, aboutHeader].forEach(header => {
        if (header) {
          expect(header).toHaveClass('burgerMenuCaretOpen');
          expect(header).not.toHaveClass('burgerMenuCaretClose');
        }
      });
    });

    it('applies correct caret classes when sections are open', () => {
      const { container } = renderHeaderMobileMenu({
        showWaves: true,
        showBurgerMenuBrain: true,
        showBurgerMenuCollections: true,
        showBurgerMenuCommunity: true,
        showBurgerMenuTools: true,
        showBurgerMenuAbout: true
      });

      // Find headers by their text content
      const headers = container.querySelectorAll('h3');
      const brainHeader = Array.from(headers).find(h => h.textContent === 'Brain');
      const collectionsHeader = Array.from(headers).find(h => h.textContent === 'Collections');
      const networkHeader = Array.from(headers).find(h => h.textContent === 'Network');
      const toolsHeader = Array.from(headers).find(h => h.textContent === 'Tools');
      const aboutHeader = Array.from(headers).find(h => h.textContent === 'About');

      // All should have the close caret class when open
      [brainHeader, collectionsHeader, networkHeader, toolsHeader, aboutHeader].forEach(header => {
        if (header) {
          expect(header).toHaveClass('burgerMenuCaretClose');
          expect(header).not.toHaveClass('burgerMenuCaretOpen');
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation on all clickable headers', () => {
      const setShowBurgerMenuCollections = jest.fn();
      const setShowBurgerMenuCommunity = jest.fn();
      const setShowBurgerMenuTools = jest.fn();
      const setShowBurgerMenuBrain = jest.fn();
      
      renderHeaderMobileMenu({
        showWaves: true,
        setShowBurgerMenuCollections,
        setShowBurgerMenuCommunity,
        setShowBurgerMenuTools,
        setShowBurgerMenuBrain
      });

      // Test keyboard events on different headers
      fireEvent.keyDown(screen.getByText('Brain'), { key: 'Enter' });
      expect(setShowBurgerMenuBrain).toHaveBeenCalledWith(true);

      fireEvent.keyDown(screen.getByText('Collections'), { key: ' ' });
      expect(setShowBurgerMenuCollections).toHaveBeenCalledWith(true);

      fireEvent.keyDown(screen.getByText('Network'), { key: 'Enter' });
      expect(setShowBurgerMenuCommunity).toHaveBeenCalledWith(true);

      fireEvent.keyDown(screen.getByText('Tools'), { key: ' ' });
      expect(setShowBurgerMenuTools).toHaveBeenCalledWith(true);
    });

    it('has proper heading structure', () => {
      renderHeaderMobileMenu({
        showWaves: true,
        showBurgerMenuCollections: true,
        showBurgerMenuCommunity: true,
        showBurgerMenuTools: true,
        showBurgerMenuAbout: true
      });

      // Check main section headers are h3 elements
      expect(screen.getByRole('heading', { name: 'Brain', level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Collections', level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Network', level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Tools', level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'About', level: 3 })).toBeInTheDocument();

      // Check subheaders are also h3 elements (via mocked component)
      expect(screen.getAllByTestId('mobile-subheader').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles undefined country gracefully', () => {
      expect(() => {
        renderHeaderMobileMenu({ 
          country: undefined as any,
          showBurgerMenuTools: true,
          showBurgerMenuAbout: true
        });
      }).not.toThrow();
    });

    it('handles all boolean props being undefined', () => {
      expect(() => {
        renderHeaderMobileMenu({
          burgerMenuOpen: undefined as any,
          showBurgerMenuCollections: undefined as any,
          showBurgerMenuAbout: undefined as any,
          showBurgerMenuCommunity: undefined as any,
          showBurgerMenuTools: undefined as any,
          showBurgerMenuBrain: undefined as any,
          showWaves: undefined as any,
          appWalletsSupported: undefined as any,
          capacitorIsIos: undefined as any
        });
      }).not.toThrow();
    });

    it('handles missing function props gracefully', () => {
      expect(() => {
        renderHeaderMobileMenu({
          setBurgerMenuOpen: undefined as any,
          setShowBurgerMenuCollections: undefined as any,
          setShowBurgerMenuAbout: undefined as any,
          setShowBurgerMenuCommunity: undefined as any,
          setShowBurgerMenuTools: undefined as any,
          setShowBurgerMenuBrain: undefined as any
        });
      }).not.toThrow();
    });
  });
});
