import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { printVolumeTypeDropdown, SortButton } from '../../../components/the-memes/TheMemes';
import { VolumeType, } from '../../../entities/INFT';
import { MemeLabSort, MemesSort } from '../../../enums';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Dropdown: any = (p: any) => <div data-testid="dropdown" {...p}/>;
  Dropdown.Toggle = (p: any) => <button data-testid="toggle" {...p}>{p.children}</button>;
  Dropdown.Menu = (p: any) => <div data-testid="menu" {...p}/>;
  Dropdown.Item = (p: any) => <button data-testid={`item-${p.children}`} onClick={p.onClick}>{p.children}</button>;
  return { Dropdown };
});

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
    expect(btn.className).toContain('disabled');
  });

  it('printVolumeTypeDropdown handles click behaviour', () => {
    const setType = jest.fn();
    const setSort = jest.fn();
    render(printVolumeTypeDropdown(false, setType, setSort));
    fireEvent.click(screen.getByTestId(`item-${VolumeType.ALL_TIME}`));
    expect(setType).toHaveBeenCalledWith(VolumeType.ALL_TIME);
    expect(setSort).toHaveBeenCalled();
  });

  it('does not call setSort when already volume sort', () => {
    const setType = jest.fn();
    const setSort = jest.fn();
    render(printVolumeTypeDropdown(true, setType, setSort));
    fireEvent.click(screen.getByTestId(`item-${VolumeType.DAYS_7}`));
    expect(setType).toHaveBeenCalledWith(VolumeType.DAYS_7);
    expect(setSort).not.toHaveBeenCalled();
  });
});
