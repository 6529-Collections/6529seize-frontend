import React from 'react';
import { render, screen } from '@testing-library/react';
import { printVolumeTypeDropdown } from '../../../components/the-memes/TheMemes';
import { VolumeType } from '../../../entities/INFT';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Dropdown: any = (p: any) => <div>{p.children}</div>;
  Dropdown.Toggle = (p: any) => <button>{p.children}</button>;
  Dropdown.Menu = (p: any) => <div>{p.children}</div>;
  Dropdown.Item = (p: any) => <div data-testid="item">{p.children}</div>;
  return { Dropdown };
});

jest.mock('../../../components/the-memes/TheMemes.module.scss', () => ({}));

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
