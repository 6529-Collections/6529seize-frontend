import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TabToggleWithOverflow } from '../../../components/common/TabToggleWithOverflow';

describe('TabToggleWithOverflow', () => {
  const options = [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
    { key: 'c', label: 'C' },
    { key: 'd', label: 'D' },
  ];

  it('shows overflow items and handles selection', () => {
    const onSelect = jest.fn();
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
    fireEvent.click(screen.getByText('More'));
    const optionC = screen.getByText('C');
    expect(optionC).toBeInTheDocument();

    fireEvent.click(optionC);
    expect(onSelect).toHaveBeenCalledWith('c');
    expect(screen.queryByText('C')).not.toBeInTheDocument();
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
});
