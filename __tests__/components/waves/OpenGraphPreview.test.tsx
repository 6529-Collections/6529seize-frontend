import { render, screen } from '@testing-library/react';
import React from 'react';

import OpenGraphPreview from '../../../components/waves/OpenGraphPreview';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname ?? ''} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockNextImage({
    alt = '',
    unoptimized: _unoptimized,
    fill: _fill,
    ...rest
  }: any) {
    return <img alt={alt} {...rest} />;
  },
}));

jest.mock('../../../helpers/Helpers', () => ({
  removeBaseEndpoint: jest.fn((url: string) => url.replace('https://example.com', '')),
}));

jest.mock('../../../components/waves/ChatItemHrefButtons', () => ({
  __esModule: true,
  default: function MockChatItemHrefButtons(props: any) {
    return (
      <div data-testid="href-buttons">{props.relativeHref ?? 'undefined'}</div>
    );
  },
}));

const { removeBaseEndpoint } = require('../../../helpers/Helpers');

describe('OpenGraphPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton when preview is undefined', () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue('/article');

    render(<OpenGraphPreview href="https://example.com/article" />);

    expect(screen.getByTestId('og-preview-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('href-buttons')).toHaveTextContent('/article');
    expect(removeBaseEndpoint).toHaveBeenCalledWith('https://example.com/article');
  });

  it('renders fallback when preview is unavailable', () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue('/article');

    render(<OpenGraphPreview href="https://example.com/article" preview={null} />);

    expect(screen.getByTestId('og-preview-unavailable')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'example.com' });
    expect(link).toHaveAttribute('href', '/article');
    expect(link).not.toHaveAttribute('target');
    expect(screen.getByTestId('href-buttons')).toHaveTextContent('/article');
  });

  it('renders preview details when data is provided', () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue('/article');

    render(
      <OpenGraphPreview
        href="https://example.com/article"
        preview={{
          title: 'Example Title',
          description: 'An example description',
          siteName: 'Example.com',
          image: 'https://cdn.example.com/preview.png',
        }}
      />
    );

    expect(screen.getByTestId('og-preview-card')).toBeInTheDocument();
    expect(screen.getByText('Example.com')).toBeInTheDocument();
    const titleLinks = screen.getAllByRole('link', { name: 'Example Title' });
    expect(titleLinks).toHaveLength(2);
    const titleLink = titleLinks[1];
    expect(titleLink).toHaveAttribute('href', '/article');
    expect(titleLink).not.toHaveAttribute('target');
    expect(screen.getByAltText('Example Title')).toHaveAttribute('src', 'https://cdn.example.com/preview.png');
    expect(screen.getByText('An example description')).toBeInTheDocument();
    expect(screen.getByTestId('href-buttons')).toHaveTextContent('/article');
  });

  it('handles external links and image arrays', () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue('https://othersite.com/post');

    render(
      <OpenGraphPreview
        href="https://othersite.com/post"
        preview={{
          images: [{ url: 'https://cdn.othersite.com/img.jpg' }],
          description: 'External link description',
        }}
      />
    );

    const card = screen.getByTestId('og-preview-card');
    expect(card).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://othersite.com/post');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    expect(screen.getByAltText('othersite.com')).toHaveAttribute('src', 'https://cdn.othersite.com/img.jpg');
    expect(screen.getByTestId('href-buttons')).toHaveTextContent('undefined');
  });

  it('uses secureUrl fields when provided', () => {
    (removeBaseEndpoint as jest.Mock).mockReturnValue('/article');

    render(
      <OpenGraphPreview
        href="https://example.com/article"
        preview={{
          title: 'Secure Image',
          image: { secureUrl: 'https://cdn.example.com/secure.png' },
        }}
      />
    );

    expect(screen.getByAltText('Secure Image')).toHaveAttribute(
      'src',
      'https://cdn.example.com/secure.png'
    );
  });

});
