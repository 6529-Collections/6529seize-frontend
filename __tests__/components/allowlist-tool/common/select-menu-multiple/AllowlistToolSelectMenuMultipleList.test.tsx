import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllowlistToolSelectMenuMultipleList from '../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleList';

jest.mock('../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleListItem', () => ({
  __esModule: true,
  default: (props: any) => (
    <li data-testid={`item-${props.option.value}`} onClick={() => props.toggleSelectedOption(props.option)}>
      {props.option.title}
    </li>
  )
}));

describe('AllowlistToolSelectMenuMultipleList', () => {
  const options = [
    { title: 'Option 1', subTitle: null, value: '1' },
    { title: 'Option 2', subTitle: null, value: '2' },
  ];
  const toggleSelectedOption = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders list items and handles selection', async () => {
    const user = userEvent.setup();
    render(
      <AllowlistToolSelectMenuMultipleList options={options} selectedOptions={[]} toggleSelectedOption={toggleSelectedOption} />
    );
    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');
    expect(item1).toHaveTextContent('Option 1');
    expect(item2).toHaveTextContent('Option 2');

    await user.click(item1);
    expect(toggleSelectedOption).toHaveBeenCalledWith(options[0]);
  });

  it('shows message when no options', () => {
    render(
      <AllowlistToolSelectMenuMultipleList options={[]} selectedOptions={[]} toggleSelectedOption={toggleSelectedOption} />
    );
    expect(screen.getByText('No options found')).toBeInTheDocument();
  });
});
