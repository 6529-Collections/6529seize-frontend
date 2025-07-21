import React from 'react';
import { render } from '@testing-library/react';
import Page from '@/app/om/discord/page';

const renderPage = () => render(<Page />);

describe('OM Discord Page', () => {
  it('renders meta tags', () => {
    renderPage();
    const title = document.querySelector('title');
    expect(title?.textContent).toBe('DISCORD - 6529.io');
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('/om/discord/');
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    expect(document.querySelector('#toTop')).toHaveClass('fusion-top-top-link');
  });
});
