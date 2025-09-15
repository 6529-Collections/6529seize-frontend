import { render, screen } from '@testing-library/react';
import React from 'react';
import HeaderLogo from '../../../components/header/HeaderLogo';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ href, children }: any) => <a href={href}>{children}</a>;
});

jest.mock('next/image', () => {
  return (props: any) => <img {...props} />;
});

// Mock styles
jest.mock('../../../components/header/Header.module.scss', () => ({
  logoIcon: 'logoIcon',
  logoIconSmall: 'logoIconSmall'
}));

describe('HeaderLogo', () => {
  const defaultProps = {
    isSmall: false,
    isCapacitor: false,
    isMobile: false
  };

  it('renders logo image with correct src and alt text', () => {
    render(<HeaderLogo {...defaultProps} />);
    
    const logoImage = screen.getByRole('img', { name: '6529Seize' });
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', '/6529.png');
    expect(logoImage).toHaveAttribute('alt', '6529Seize');
  });

  it('renders with Link wrapper pointing to home', () => {
    render(<HeaderLogo {...defaultProps} />);
    
    const homeLink = screen.getByRole('link');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('uses default logo size (50x50) for desktop', () => {
    render(<HeaderLogo {...defaultProps} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveAttribute('width', '50');
    expect(logoImage).toHaveAttribute('height', '50');
  });

  it('uses small logo size (40x40) when isCapacitor is true', () => {
    render(<HeaderLogo {...defaultProps} isCapacitor={true} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveAttribute('width', '40');
    expect(logoImage).toHaveAttribute('height', '40');
  });

  it('uses small logo size (40x40) when isMobile is true', () => {
    render(<HeaderLogo {...defaultProps} isMobile={true} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveAttribute('width', '40');
    expect(logoImage).toHaveAttribute('height', '40');
  });

  it('uses small logo size when both isCapacitor and isMobile are true', () => {
    render(<HeaderLogo {...defaultProps} isCapacitor={true} isMobile={true} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveAttribute('width', '40');
    expect(logoImage).toHaveAttribute('height', '40');
  });

  it('applies logoIcon class for default desktop view', () => {
    render(<HeaderLogo {...defaultProps} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveClass('logoIcon');
    expect(logoImage).not.toHaveClass('logoIconSmall');
  });

  it('applies logoIconSmall class when isSmall is true', () => {
    render(<HeaderLogo {...defaultProps} isSmall={true} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveClass('logoIconSmall');
    expect(logoImage).not.toHaveClass('logoIcon');
  });

  it('applies logoIconSmall class when isCapacitor is true', () => {
    render(<HeaderLogo {...defaultProps} isCapacitor={true} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveClass('logoIconSmall');
    expect(logoImage).not.toHaveClass('logoIcon');
  });

  it('applies logoIconSmall class when isMobile is true', () => {
    render(<HeaderLogo {...defaultProps} isMobile={true} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveClass('logoIconSmall');
    expect(logoImage).not.toHaveClass('logoIcon');
  });

  it('applies logoIconSmall class when multiple small conditions are true', () => {
    render(<HeaderLogo {...defaultProps} isSmall={true} isCapacitor={true} isMobile={true} />);
    
    const logoImage = screen.getByRole('img');
    expect(logoImage).toHaveClass('logoIconSmall');
    expect(logoImage).not.toHaveClass('logoIcon');
  });

  it('sets correct image attributes for optimization', () => {
    render(<HeaderLogo {...defaultProps} />);
    
    const logoImage = screen.getByRole('img');
    // Boolean attributes in Next.js Image are passed as props but may not appear as HTML attributes
    expect(logoImage).toHaveAttribute('loading', 'eager');
    // Note: unoptimized and priority are boolean props that may not appear as HTML attributes
    // when mocked, so we just verify the component renders without errors
  });

  describe('prop combinations', () => {
    const testCases = [
      {
        name: 'default desktop',
        props: { isSmall: false, isCapacitor: false, isMobile: false },
        expectedClass: 'logoIcon',
        expectedSize: { width: '50', height: '50' }
      },
      {
        name: 'small desktop',
        props: { isSmall: true, isCapacitor: false, isMobile: false },
        expectedClass: 'logoIconSmall',
        expectedSize: { width: '50', height: '50' }
      },
      {
        name: 'capacitor app',
        props: { isSmall: false, isCapacitor: true, isMobile: false },
        expectedClass: 'logoIconSmall',
        expectedSize: { width: '40', height: '40' }
      },
      {
        name: 'mobile view',
        props: { isSmall: false, isCapacitor: false, isMobile: true },
        expectedClass: 'logoIconSmall',
        expectedSize: { width: '40', height: '40' }
      },
      {
        name: 'small mobile',
        props: { isSmall: true, isCapacitor: false, isMobile: true },
        expectedClass: 'logoIconSmall',
        expectedSize: { width: '40', height: '40' }
      },
      {
        name: 'small capacitor',
        props: { isSmall: true, isCapacitor: true, isMobile: false },
        expectedClass: 'logoIconSmall',
        expectedSize: { width: '40', height: '40' }
      },
      {
        name: 'capacitor mobile',
        props: { isSmall: false, isCapacitor: true, isMobile: true },
        expectedClass: 'logoIconSmall',
        expectedSize: { width: '40', height: '40' }
      },
      {
        name: 'all small flags',
        props: { isSmall: true, isCapacitor: true, isMobile: true },
        expectedClass: 'logoIconSmall',
        expectedSize: { width: '40', height: '40' }
      }
    ];

    testCases.forEach(({ name, props, expectedClass, expectedSize }) => {
      it(`handles ${name} configuration correctly`, () => {
        render(<HeaderLogo {...props} />);
        
        const logoImage = screen.getByRole('img');
        expect(logoImage).toHaveClass(expectedClass);
        expect(logoImage).toHaveAttribute('width', expectedSize.width);
        expect(logoImage).toHaveAttribute('height', expectedSize.height);
      });
    });
  });
});
