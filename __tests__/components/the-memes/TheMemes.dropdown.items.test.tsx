import React from 'react';
import { render, screen } from '@testing-library/react';
import { printVolumeTypeDropdown } from '@/components/the-memes/TheMemes';
import { VolumeType } from '@/entities/INFT';

jest.mock('@headlessui/react', () => ({
  Menu: ({ children }: any) => <div>{children}</div>,
  MenuButton: (p: any) => <button>{p.children}</button>,
  MenuItems: (p: any) => <div>{p.children}</div>,
  MenuItem: (p: any) => {
    const child = typeof p.children === 'function' ? p.children({ focus: false }) : p.children;
    return React.cloneElement(child, { 'data-testid': 'item' });
  },
}));

jest.mock('@/components/the-memes/TheMemes.module.scss', () => ({}));

describe('printVolumeTypeDropdown', () => {
  it('renders all volume type items', () => {
    render(printVolumeTypeDropdown(false, jest.fn(), jest.fn()));
    const items = screen.getAllByTestId('item');
    expect(items).toHaveLength(Object.keys(VolumeType).length);
    Object.values(VolumeType).forEach(v => {
      expect(screen.getByText(v)).toBeInTheDocument();
    });
  });
});
