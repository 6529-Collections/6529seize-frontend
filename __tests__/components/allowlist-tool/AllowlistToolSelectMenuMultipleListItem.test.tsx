import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllowlistToolSelectMenuListItem from '../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleListItem';
import { AllowlistToolSelectMenuMultipleOption } from '../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple';

const option: AllowlistToolSelectMenuMultipleOption = {
  title: 'Option 1',
  value: 'opt1',
  subTitle: 'Sub 1',
};

describe('AllowlistToolSelectMenuMultipleListItem', () => {
  it('renders subtitle and checkmark when selected', () => {
    const toggle = jest.fn();
    const { container } = render(
      <AllowlistToolSelectMenuListItem
        option={option}
        selectedOptions={[option]}
        toggleSelectedOption={toggle}
      />,
    );
    expect(screen.getByText('Sub 1')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('calls toggleSelectedOption on click', async () => {
    const user = userEvent.setup();
    const toggle = jest.fn();
    render(
      <AllowlistToolSelectMenuListItem
        option={option}
        selectedOptions={[]}
        toggleSelectedOption={toggle}
      />,
    );
    await user.click(screen.getByRole('option'));
    expect(toggle).toHaveBeenCalledWith(option);
  });
});
