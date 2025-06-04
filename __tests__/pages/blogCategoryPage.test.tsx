import { render, screen } from '@testing-library/react';
import React from 'react';
import BlogCategoryPage from '../../pages/category/blog';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('blog category page', () => {
  it('renders the BLOG archives page', () => {
    render(<BlogCategoryPage />);
    expect(screen.getAllByText(/BLOG/i).length).toBeGreaterThan(0);
  });
});
