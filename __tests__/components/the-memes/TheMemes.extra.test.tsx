import React from 'react';
import { render } from '@testing-library/react';
import { printVolumeTypeDropdown } from '../../../components/the-memes/TheMemes';

jest.mock('@headlessui/react', () => ({
  Menu: ({ children, className }: any) => <div data-testid="dropdown" className={className}>{children}</div>,
  MenuButton: (p: any) => <button {...p}>{p.children}</button>,
  MenuItems: (p: any) => <div>{p.children}</div>,
  MenuItem: (p: any) => <div onClick={p.onClick}>{typeof p.children === 'function' ? p.children({ focus: false }) : p.children}</div>,
}));

jest.mock('../../../components/the-memes/TheMemes.module.scss', () => ({
  volumeDropdown: 'volumeDropdown',
  volumeDropdownEnabled: 'enabled',
}));

describe('printVolumeTypeDropdown css', () => {
  it('adds enabled class when volume sort active', () => {
    const { getByTestId } = render(printVolumeTypeDropdown(true, jest.fn(), jest.fn()));
    expect(getByTestId('dropdown').textContent).toBeDefined();
  });

  it('does not add enabled class when not active', () => {
    const { getByTestId } = render(printVolumeTypeDropdown(false, jest.fn(), jest.fn()));
    expect(getByTestId('dropdown').textContent).toBeDefined();
  });
});
