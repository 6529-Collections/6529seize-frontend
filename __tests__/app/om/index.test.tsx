import React from 'react';
import { render } from '@testing-library/react';
import Page from '@/app/om/page';

describe('OM Index Page', () => {
  const renderPage = () => render(<Page />);

  it('renders page title and canonical link', () => {
    renderPage();
    expect(document.querySelector('title')?.textContent).toBe('OM - 6529.io');
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('/om/');
  });

  it('contains robots meta and go to top link', () => {
    renderPage();
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    expect(document.querySelector('#toTop')).toHaveClass('fusion-top-top-link');
  });
});
