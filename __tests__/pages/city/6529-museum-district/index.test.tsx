import React from 'react';
import { render, screen } from '@testing-library/react';
import CityMuseumRedirectPage from '../../../../pages/city/6529-museum-district/index';

// Mock the Header component since it's dynamically imported
jest.mock('../../../../components/header/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

// Mock HeaderPlaceholder
jest.mock('../../../../components/header/HeaderPlaceholder', () => {
  return function MockHeaderPlaceholder() {
    return <div data-testid="header-placeholder">Header Placeholder</div>;
  };
});

describe('CityMuseumRedirectPage', () => {
  const renderComponent = () => {
    return render(<CityMuseumRedirectPage />);
  };

  it('renders the redirect page title', () => {
    renderComponent();
    
    const titleElement = document.querySelector('title');
    expect(titleElement?.textContent).toBe('Redirecting...');
  });

  it('includes meta refresh tag for automatic redirect', () => {
    renderComponent();
    
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    expect(metaRefresh).toBeInTheDocument();
    expect(metaRefresh?.getAttribute('content')).toBe('0;url=/om/6529-museum-district/');
  });

  it('displays redirect message to user', () => {
    renderComponent();
    
    expect(screen.getByText(/You are being redirected to/)).toBeInTheDocument();
  });

  it('includes fallback link to the redirect destination', () => {
    renderComponent();
    
    const redirectLink = screen.getByRole('link', { name: '/om/6529-museum-district/' });
    expect(redirectLink).toBeInTheDocument();
    expect(redirectLink).toHaveAttribute('href', '/om/6529-museum-district/');
  });

  it('renders the complete redirect text', () => {
    renderComponent();
    
    const redirectText = screen.getByText((content, element) => {
      return content.includes('You are being redirected to') && 
             element?.textContent?.includes('/om/6529-museum-district/');
    });
    expect(redirectText).toBeInTheDocument();
  });

  it('has the correct page structure', () => {
    const { container } = renderComponent();
    
    // Check that the page has the basic structure
    const divElement = container.querySelector('div');
    expect(divElement).toBeInTheDocument();
    
    const paragraphElement = container.querySelector('p');
    expect(paragraphElement).toBeInTheDocument();
  });

  it('redirects immediately without delay', () => {
    renderComponent();
    
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    const content = metaRefresh?.getAttribute('content');
    
    // Check that the redirect happens at 0 seconds (immediately)
    expect(content).toMatch(/^0;/);
  });

  it('redirects to the correct URL path', () => {
    renderComponent();
    
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    const content = metaRefresh?.getAttribute('content');
    
    // Check that it redirects to the expected URL
    expect(content).toContain('url=/om/6529-museum-district/');
  });
});