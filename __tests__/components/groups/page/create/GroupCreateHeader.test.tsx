import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupCreateHeader from '@/components/groups/page/create/GroupCreateHeader';

describe('GroupCreateHeader', () => {
  it('renders icon and label with expected classes', () => {
    const { container } = render(<GroupCreateHeader />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer).toHaveClass('tw-inline-flex');
    expect(outer).toHaveClass('tw-items-center');

    const icon = outer.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(screen.getByText('Group configuration')).toBeInTheDocument();
  });
});
