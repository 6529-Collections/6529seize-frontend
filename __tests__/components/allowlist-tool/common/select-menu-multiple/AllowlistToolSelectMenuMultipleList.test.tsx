import React from 'react';
import { render, screen } from '@testing-library/react';
import AllowlistToolSelectMenuMultipleList from '../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleList';

jest.mock('../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleListItem', () => (props: any) => (
  <li data-testid="item" data-option={props.option.value} />
));

describe('AllowlistToolSelectMenuMultipleList', () => {
  const baseProps = {
    selectedOptions: [],
    toggleSelectedOption: jest.fn(),
  };

  it('renders list items for options', () => {
    const options = [
      { value: 'a', title: 'A', subTitle: null },
      { value: 'b', title: 'B', subTitle: null },
    ];
    render(<AllowlistToolSelectMenuMultipleList {...baseProps} options={options} />);
    const items = screen.getAllByTestId('item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-option', 'a');
    expect(items[1]).toHaveAttribute('data-option', 'b');
  });

  it('shows fallback text when no options', () => {
    render(<AllowlistToolSelectMenuMultipleList {...baseProps} options={[]} />);
    expect(screen.getByText('No options found')).toBeInTheDocument();
  });
});
