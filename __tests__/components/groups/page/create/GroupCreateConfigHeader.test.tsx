import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupCreateConfigHeader from '@/components/groups/page/create/GroupCreateConfigHeader';

describe('GroupCreateConfigHeader', () => {
  it('renders header with icon and label', () => {
    const { container } = render(<GroupCreateConfigHeader />);

    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv.tagName).toBe('DIV');
    expect(outerDiv).toHaveClass('tw-inline-flex');
    expect(outerDiv).toHaveClass('tw-items-center');

    const icon = outerDiv.querySelector('svg');
    expect(icon).toBeInTheDocument();

    expect(screen.getByText('Types')).toBeInTheDocument();
  });
});
