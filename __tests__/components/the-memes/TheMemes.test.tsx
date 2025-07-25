import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { printVolumeTypeDropdown, SortButton } from '../../../components/the-memes/TheMemes';
import { VolumeType, } from '../../../entities/INFT';
import { MemesSort } from '../../../enums';

jest.mock('@headlessui/react', () => ({
  Menu: (p: any) => <div data-testid="dropdown" {...p} />,
  MenuButton: (p: any) => <button data-testid="toggle" {...p}>{p.children}</button>,
  MenuItems: (p: any) => <div data-testid="menu" {...p} />,
  MenuItem: (p: any) => {
    const child = typeof p.children === 'function' ? p.children({ focus: false }) : p.children;
    const label = typeof child === 'string' ? child : child.props.children;
    return React.cloneElement(child, { 'data-testid': `item-${label}`, onClick: p.onClick });
  },
}));

jest.mock('../../../components/the-memes/TheMemes.module.scss', () => ({
  sort: 'sort',
  disabled: 'disabled',
  volumeDropdown: 'volumeDropdown',
  volumeDropdownEnabled: 'volumeDropdownEnabled'
}));

describe('TheMemes helpers', () => {
  it('SortButton renders label and triggers select', () => {
    const onSelect = jest.fn();
    render(<SortButton currentSort={MemesSort.AGE} sort={MemesSort.EDITION_SIZE} select={onSelect} />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toBe('Edition Size');
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalled();
    expect(btn.className).not.toContain('disabled');
  });

  it('renders volume type options', () => {
    render(printVolumeTypeDropdown(false, jest.fn(), jest.fn()));
    expect(screen.getByText(VolumeType.ALL_TIME)).toBeInTheDocument();
    expect(screen.getByText(VolumeType.DAYS_7)).toBeInTheDocument();
  });
});
