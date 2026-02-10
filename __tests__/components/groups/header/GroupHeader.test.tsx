import { render, screen } from '@testing-library/react';
import React from 'react';

const MockSelect = jest.fn(() => <div data-testid="select" />);

jest.mock('@/components/groups/header/GroupHeaderSelect', () => ({
  __esModule: true,
  default: () => MockSelect()
}));

const GroupHeader = require('@/components/groups/header/GroupHeader').default;

describe('GroupHeader', () => {
  it('renders wrapper with GroupHeaderSelect inside', () => {
    render(<GroupHeader />);
    const wrapper = screen.getByTestId('select').parentElement as HTMLElement;
    expect(MockSelect).toHaveBeenCalled();
    expect(wrapper).toHaveClass('tw-px-4 tw-pt-4');
  });
});
