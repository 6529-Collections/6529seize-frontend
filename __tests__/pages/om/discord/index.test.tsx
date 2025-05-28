import React from 'react';
import { render } from '@testing-library/react';
import Page from '../../../../pages/om/discord';

jest.mock('next/dynamic', () => () => () => <div data-testid="header" />);
jest.mock('../../../../components/header/HeaderPlaceholder', () => () => <div data-testid="placeholder" />);

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
