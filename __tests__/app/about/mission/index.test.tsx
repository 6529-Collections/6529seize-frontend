import React from 'react';
/* eslint-disable react/display-name */
import { render, screen } from '@testing-library/react';
import MissionPage from '@/app/about/mission/page';

// Mock the Header component since it's dynamically imported
jest.mock('@/components/header/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

// Mock HeaderPlaceholder
jest.mock('@/components/header/HeaderPlaceholder', () => {
  return function MockHeaderPlaceholder() {
    return <div data-testid="header-placeholder">Header Placeholder</div>;
  };
});

describe('MissionPage', () => {
  const renderComponent = () => {
    return render(<MissionPage />);
  };

  it('renders the page title in the title bar', () => {
    renderComponent();
    
    const titles = screen.getAllByText('6529 MISSION');
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeInTheDocument();
  });

  it('renders the main mission statement', () => {
    renderComponent();
    
    expect(screen.getByText(/THE 6529 MISSION IS TO ACCELERATE THE DEVELOPMENT OF AN OPEN METAVERSE/)).toBeInTheDocument();
  });

  it('includes correct meta tags for SEO', () => {
    renderComponent();
    
    // Check for some key meta tags
    const metaTags = document.querySelectorAll('meta');
    const titleElement = document.querySelector('title');
    
    expect(titleElement?.textContent).toBe('6529 MISSION - 6529.io');
    
    // Check for specific meta tags
    const descriptionMeta = Array.from(metaTags).find(meta => 
      meta.getAttribute('name') === 'description'
    );
    expect(descriptionMeta?.getAttribute('content')).toBe('THE 6529 MISSION IS TO ACCELERATE THE DEVELOPMENT OF AN OPEN METAVERSE');
    
    const robotsMeta = Array.from(metaTags).find(meta => 
      meta.getAttribute('name') === 'robots'
    );
    expect(robotsMeta?.getAttribute('content')).toBe('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  });

  it('includes Open Graph meta tags', () => {
    renderComponent();
    
    const metaTags = document.querySelectorAll('meta');
    
    const ogTitle = Array.from(metaTags).find(meta => 
      meta.getAttribute('property') === 'og:title'
    );
    expect(ogTitle?.getAttribute('content')).toBe('6529 MISSION - 6529.io');
    
    const ogType = Array.from(metaTags).find(meta => 
      meta.getAttribute('property') === 'og:type'
    );
    expect(ogType?.getAttribute('content')).toBe('article');
    
    const ogUrl = Array.from(metaTags).find(meta => 
      meta.getAttribute('property') === 'og:url'
    );
    expect(ogUrl?.getAttribute('content')).toBe('/about/mission/');
  });

  it('includes Twitter meta tags', () => {
    renderComponent();
    
    const metaTags = document.querySelectorAll('meta');
    
    const twitterCard = Array.from(metaTags).find(meta => 
      meta.getAttribute('name') === 'twitter:card'
    );
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
    
    const twitterSite = Array.from(metaTags).find(meta => 
      meta.getAttribute('name') === 'twitter:site'
    );
    expect(twitterSite?.getAttribute('content')).toBe('@om100m');
  });

  it('renders the main content section', () => {
    renderComponent();
    
    const mainElement = document.querySelector('#main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('clearfix', 'width-100');
  });

  it('renders the page title bar section', () => {
    renderComponent();
    
    const titleBarSection = document.querySelector('.avada-page-titlebar-wrapper');
    expect(titleBarSection).toBeInTheDocument();
    expect(titleBarSection).toHaveAttribute('aria-label', 'Page Title Bar');
  });

  it('includes social media links', () => {
    renderComponent();
    
    const twitterLink = document.querySelector('a[href="https://twitter.com/punk6529"]');
    expect(twitterLink).toBeInTheDocument();
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/punk6529');
    expect(twitterLink).toHaveAttribute('target', '_blank');
  });

  it('includes skip to content link for accessibility', () => {
    renderComponent();
    
    const skipLink = screen.getByText('Skip to content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveClass('skip-link', 'screen-reader-text');
    expect(skipLink).toHaveAttribute('href', '#content');
  });

  it('includes go to top functionality', () => {
    renderComponent();
    
    const goToTopSection = document.querySelector('.to-top-container');
    expect(goToTopSection).toBeInTheDocument();
    expect(goToTopSection).toHaveAttribute('aria-labelledby', 'awb-to-top-label');
    
    const goToTopLink = document.querySelector('#toTop');
    expect(goToTopLink).toBeInTheDocument();
    expect(goToTopLink).toHaveClass('fusion-top-top-link');
  });

  it('renders with proper page structure', () => {
    renderComponent();
    
    expect(document.querySelector('#boxed-wrapper')).toBeInTheDocument();
    expect(document.querySelector('#wrapper')).toBeInTheDocument();
    expect(document.querySelector('#content')).toBeInTheDocument();
  });

  it('includes canonical link', () => {
    renderComponent();
    
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink).toBeInTheDocument();
    expect(canonicalLink?.getAttribute('href')).toBe('/about/mission/');
  });

  it('includes viewport meta tag for responsive design', () => {
    renderComponent();
    
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    expect(viewportMeta).toBeInTheDocument();
    expect(viewportMeta?.getAttribute('content')).toBe('width=device-width, initial-scale=1');
  });
});