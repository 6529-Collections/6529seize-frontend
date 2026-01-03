import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TabToggle } from '@/components/common/TabToggle';

describe('TabToggle', () => {
  const options = [
    { key: 'tab-1', label: 'Tab 1', panelId: 'panel-tab-1' },
    { key: 'tab-2', label: 'Tab 2', panelId: 'panel-tab-2' },
  ];

  const setup = () => {
    const Wrapper: React.FC = () => {
      const [activeKey, setActiveKey] = React.useState(options[0]?.key);

      return (
        <TabToggle
          options={options}
          activeKey={activeKey}
          onSelect={(key) => setActiveKey(key)}
        />
      );
    };

    render(<Wrapper />);
  };

  it('updates aria-selected when selecting different tabs', () => {
    setup();

    const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
    const secondTab = screen.getByRole('tab', { name: 'Tab 2' });

    expect(firstTab).toHaveAttribute('aria-selected', 'true');
    expect(secondTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(secondTab);

    expect(firstTab).toHaveAttribute('aria-selected', 'false');
    expect(secondTab).toHaveAttribute('aria-selected', 'true');
  });
});
