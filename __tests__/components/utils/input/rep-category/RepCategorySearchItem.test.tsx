import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RepCategorySearchItem from '../../../../../components/utils/input/rep-category/RepCategorySearchItem';

describe('RepCategorySearchItem', () => {
  it('calls onSelect when clicked', async () => {
    const onSelect = jest.fn();
    render(
      <RepCategorySearchItem category="Art" selected={null} onSelect={onSelect} />
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('Art');
  });

  it('shows check icon when selected and disables when disabled', () => {
    const { container } = render(
      <RepCategorySearchItem
        category="Tech"
        selected="Tech"
        disabledCategories={["Tech"]}
        onSelect={jest.fn()}
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
