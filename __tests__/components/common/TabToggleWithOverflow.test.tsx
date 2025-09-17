import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TabToggleWithOverflow } from '../../../components/common/TabToggleWithOverflow';

describe('TabToggleWithOverflow', () => {
  const options = [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
    { key: 'c', label: 'C' },
    { key: 'd', label: 'D' },
  ];

  it('shows overflow items and handles selection', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="a"
        onSelect={onSelect}
        maxVisibleTabs={2}
      />
    );

    // visible tabs
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();

    // open overflow dropdown
    await user.click(screen.getByRole('button', { name: 'More' }));
    const optionC = screen.getByRole('tab', { name: 'C' });
    expect(optionC).toBeInTheDocument();

    await user.click(optionC);
    expect(onSelect).toHaveBeenCalledWith('c');
    expect(screen.queryByRole('tab', { name: 'C' })).not.toBeInTheDocument();
  });

  it('shows active label when active tab is in overflow', () => {
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="d"
        onSelect={() => {}}
        maxVisibleTabs={2}
      />
    );

    // Button label should show active label
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('applies ARIA roles to visible tabs', () => {
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="a"
        onSelect={() => {}}
        maxVisibleTabs={2}
      />
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('toggles the overflow menu with keyboard interactions', async () => {
    const user = userEvent.setup();
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="a"
        onSelect={() => {}}
        maxVisibleTabs={2}
      />
    );

    const moreButton = screen.getByRole('button', { name: 'More' });
    expect(moreButton).toHaveAttribute('aria-expanded', 'false');

    moreButton.focus();
    await user.keyboard('{Enter}');
    expect(moreButton).toHaveAttribute('aria-expanded', 'true');
    const optionC = screen.getByRole('tab', { name: 'C' });
    expect(optionC).toBeInTheDocument();

    optionC.focus();
    await user.keyboard('{Escape}');
    expect(moreButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('tab', { name: 'C' })).not.toBeInTheDocument();

    moreButton.focus();
    await user.keyboard('{Space}');
    expect(moreButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks overflow tabs with aria-selected when opened', async () => {
    const user = userEvent.setup();
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="d"
        onSelect={() => {}}
        maxVisibleTabs={2}
      />
    );

    const moreButton = screen.getByRole('button', { name: 'D' });
    await user.click(moreButton);

    expect(screen.getByRole('tab', { name: 'D' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });
});
