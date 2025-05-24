import { render, screen, fireEvent } from '@testing-library/react';
import AllowlistToolSelectMenuMultipleListItem from '../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleListItem';
import { AllowlistToolSelectMenuMultipleOption } from '../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple';

describe('AllowlistToolSelectMenuMultipleListItem', () => {
  const option: AllowlistToolSelectMenuMultipleOption = { value: '1', title: 'Item 1', subTitle: 'Sub' };
  const optionNoSub: AllowlistToolSelectMenuMultipleOption = { value: '2', title: 'Item 2', subTitle: null };
  const toggle = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and subtitle when provided', () => {
    render(
      <AllowlistToolSelectMenuMultipleListItem option={option} selectedOptions={[]} toggleSelectedOption={toggle} />
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });

  it('calls toggleSelectedOption on click', () => {
    const { container } = render(
      <AllowlistToolSelectMenuMultipleListItem option={optionNoSub} selectedOptions={[]} toggleSelectedOption={toggle} />
    );
    const li = container.querySelector('li') as HTMLElement;
    fireEvent.click(li);
    expect(toggle).toHaveBeenCalledWith(optionNoSub);
  });

  it('shows check icon when option is selected', () => {
    const { container } = render(
      <AllowlistToolSelectMenuMultipleListItem option={optionNoSub} selectedOptions={[optionNoSub]} toggleSelectedOption={toggle} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show check icon when option is not selected', () => {
    const { container } = render(
      <AllowlistToolSelectMenuMultipleListItem option={optionNoSub} selectedOptions={[]} toggleSelectedOption={toggle} />
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});
