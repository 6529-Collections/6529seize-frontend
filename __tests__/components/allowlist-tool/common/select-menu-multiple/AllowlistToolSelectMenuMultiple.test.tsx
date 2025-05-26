import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllowlistToolSelectMenuMultiple, { AllowlistToolSelectMenuMultipleOption } from '../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple';

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => <div {...props} />,
  },
  useAnimate: () => [{ current: null }, jest.fn()],
  AnimatePresence: (props: any) => <div>{props.children}</div>,
}));

// Mock the list component to simplify interaction
jest.mock(
  '../../../../../components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultipleList',
  () => (props: any) => (
    <ul data-testid="mock-list">
      {props.options.map((o: AllowlistToolSelectMenuMultipleOption) => (
        <li key={o.value}>
          <button onClick={() => props.toggleSelectedOption(o)}>{o.title}</button>
        </li>
      ))}
    </ul>
  )
);

const options: AllowlistToolSelectMenuMultipleOption[] = [
  { title: 'Option 1', subTitle: null, value: '1' },
  { title: 'Option 2', subTitle: 'Sub', value: '2' },
];

function setup(selected: AllowlistToolSelectMenuMultipleOption[] = []) {
  const toggleSelectedOption = jest.fn();
  render(
    <AllowlistToolSelectMenuMultiple
      label="Test label"
      placeholder="Pick"
      selectedOptions={selected}
      toggleSelectedOption={toggleSelectedOption}
      options={options}
      allSelectedTitle="All"
      someSelectedTitleSuffix="selected"
    />
  );
  return { toggleSelectedOption };
}


describe('AllowlistToolSelectMenuMultiple', () => {
  it('displays placeholder when no option selected', () => {
    setup();
    expect(screen.getByText('Pick')).toBeInTheDocument();
  });

  it('updates title based on selected options', () => {
    setup([options[0]]);
    expect(screen.getByText('Option 1')).toBeInTheDocument();

    // all selected
    setup(options);
    expect(screen.getByText('All')).toBeInTheDocument();

    // some selected
    setup([options[0], options[1]]);
    // menu uses 'All' when selectedOptions length equals options length, but we already tested
  });

  it('opens and closes the menu via button and outside click', async () => {
    const { toggleSelectedOption } = setup();
    const user = userEvent.setup();
    // menu closed initially
    expect(screen.queryByTestId('mock-list')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('mock-list')).toBeInTheDocument();

    // click an option
    await user.click(screen.getByText('Option 1'));
    expect(toggleSelectedOption).toHaveBeenCalledWith(options[0]);

    // click outside should close
    await user.click(document.body);
    expect(screen.queryByTestId('mock-list')).not.toBeInTheDocument();
  });

  it('closes the menu on Escape key press', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('mock-list')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('mock-list')).not.toBeInTheDocument();
  });
});
