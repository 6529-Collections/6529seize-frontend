import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AllowlistToolSelectMenuMultipleOption } from '@/components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple';
import AllowlistToolSelectMenuMultiple from '@/components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple';
jest.mock('@/components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper', () => (props: any) => <div data-testid="wrapper">{props.children}</div>);

// Mock framer-motion to avoid animations and capture useAnimate
const animateMock = jest.fn();
const iconScope = { current: {} };
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
  useAnimate: () => [iconScope, animateMock],
}));

// Capture callbacks provided to react-use hooks
let clickAwayCb: () => void;
let keyPressCb: () => void;
jest.mock('react-use', () => ({
  useClickAway: (_ref: any, cb: () => void) => {
    clickAwayCb = cb;
  },
  useKeyPressEvent: (_key: string, cb: () => void) => {
    keyPressCb = cb;
  },
}));

const options: AllowlistToolSelectMenuMultipleOption[] = [
  { title: 'First', subTitle: null, value: '1' },
  { title: 'Second', subTitle: null, value: '2' },
  { title: 'Third', subTitle: null, value: '3' },
];

function renderComponent(selected: AllowlistToolSelectMenuMultipleOption[] = [], toggle = jest.fn()) {
  return render(
    <AllowlistToolSelectMenuMultiple
      label="Label"
      placeholder="Choose"
      selectedOptions={selected}
      toggleSelectedOption={toggle}
      options={options}
      allSelectedTitle="All"
      someSelectedTitleSuffix="selected"
    />
  );
}

describe('AllowlistToolSelectMenuMultiple', () => {
  beforeEach(() => {
    animateMock.mockClear();
  });

  it('shows label and placeholder initially', () => {
    renderComponent();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('Choose')).toBeInTheDocument();
    expect(animateMock).toHaveBeenCalled();
    expect(animateMock.mock.calls[0][1]).toEqual({ rotate: -90 });
  });

  it('opens and closes dropdown via click and clickAway', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(animateMock).toHaveBeenLastCalledWith(iconScope.current, { rotate: 0 });

    act(() => {
      clickAwayCb();
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown on escape key', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    act(() => {
      keyPressCb();
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('updates title based on selections', () => {
    const first = renderComponent([options[0]]);
    expect(screen.getByText('First')).toBeInTheDocument();
    first.unmount();

    const all = renderComponent(options);
    expect(screen.getByText('All')).toBeInTheDocument();
    all.unmount();

    renderComponent([options[0], options[1]]);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('calls toggleSelectedOption when option clicked', async () => {
    const user = userEvent.setup();
    const toggle = jest.fn();
    renderComponent([], toggle);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('First'));
    expect(toggle).toHaveBeenCalledWith(options[0]);
  });
});
