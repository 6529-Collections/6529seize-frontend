import { render, screen, fireEvent } from '@testing-library/react';
import AllowlistToolSelectMenuMultipleList from '../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleList';

jest.mock('../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleListItem', () => ({
  __esModule: true,
  default: ({ option, toggleSelectedOption }: any) => (
    <li data-testid="item" onClick={() => toggleSelectedOption(option)}>{option.title}</li>
  )
}));

describe('AllowlistToolSelectMenuMultipleList', () => {
  const options = [
    { title: 'One', subTitle: null, value: '1' },
    { title: 'Two', subTitle: null, value: '2' },
  ];

  it('renders list items and handles selection', () => {
    const toggle = jest.fn();
    render(
      <AllowlistToolSelectMenuMultipleList options={options} selectedOptions={[]} toggleSelectedOption={toggle} />
    );

    const items = screen.getAllByTestId('item');
    expect(items).toHaveLength(2);
    expect(screen.queryByText('No options found')).toBeNull();

    fireEvent.click(items[0]);
    expect(toggle).toHaveBeenCalledWith(options[0]);
  });

  it('shows message when there are no options', () => {
    const toggle = jest.fn();
    render(
      <AllowlistToolSelectMenuMultipleList options={[]} selectedOptions={[]} toggleSelectedOption={toggle} />
    );
    expect(screen.getByText('No options found')).toBeInTheDocument();
  });
});
