import { render } from '@testing-library/react';
import React from 'react';

jest.mock('next/document', () => ({
  Html: (props: any) => <html {...props} />,
  Head: (props: any) => <head {...props} />,
  Main: () => <main />,
  NextScript: () => <script />,
}));

import Document from '../../pages/_document';

describe('Document', () => {
  it('renders meta version and preconnect links', () => {
    process.env.VERSION = 'test-version';
    render(<Document />);
    const meta = document.head.querySelector('meta[name="version"]');
    expect(meta).toHaveAttribute('content', 'test-version');
    const links = document.head.querySelectorAll('link[rel="preconnect"]');
    expect(links.length).toBe(2);
  });
});
