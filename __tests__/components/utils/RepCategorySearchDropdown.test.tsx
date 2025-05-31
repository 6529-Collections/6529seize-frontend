import React from 'react';
import { render, screen } from '@testing-library/react';
import RepCategorySearchDropdown from '../../../components/utils/input/rep-category/RepCategorySearchDropdown';

jest.mock('../../../components/utils/input/rep-category/RepCategorySearchItem', () => ({
  __esModule: true,
  default: ({ category }: any) => <li data-testid="item">{category}</li>,
}));

test('renders nothing when closed', () => {
  const { container } = render(
    <RepCategorySearchDropdown open={false} categories={['a']} selected={null} onSelect={() => {}} />
  );
  expect(container.firstChild).toBeNull();
});

test('renders list of categories', () => {
  render(
    <RepCategorySearchDropdown open categories={['A','B']} selected={null} onSelect={() => {}} />
  );
  expect(screen.getAllByTestId('item').length).toBe(2);
});

test('shows no results text', () => {
  render(
    <RepCategorySearchDropdown open categories={[]} selected="ab" onSelect={() => {}} />
  );
  expect(screen.getByText('Type at least 3 characters')).toBeInTheDocument();
});

