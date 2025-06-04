import React from 'react';
import { render } from '@testing-library/react';
import { printVolumeTypeDropdown } from '../../../components/the-memes/TheMemes';
import { VolumeType } from '../../../entities/INFT';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Dropdown: any = (p: any) => <div data-testid="dropdown" className={p.className}>{p.children}</div>;
  Dropdown.Toggle = (p: any) => <button {...p}>{p.children}</button>;
  Dropdown.Menu = (p: any) => <div>{p.children}</div>;
  Dropdown.Item = (p: any) => <div onClick={p.onClick}>{p.children}</div>;
  return { Dropdown };
});

jest.mock('../../../components/the-memes/TheMemes.module.scss', () => ({
  volumeDropdown: 'volumeDropdown',
  volumeDropdownEnabled: 'enabled'
}));

describe('printVolumeTypeDropdown css', () => {
  it('adds enabled class when volume sort active', () => {
    const { getByTestId } = render(printVolumeTypeDropdown(true, jest.fn(), jest.fn()));
    expect(getByTestId('dropdown').className).toContain('enabled');
  });

  it('does not add enabled class when not active', () => {
    const { getByTestId } = render(
      printVolumeTypeDropdown(false, jest.fn(), jest.fn())
    );
    expect(getByTestId('dropdown').className).not.toContain('enabled');
  });
});
