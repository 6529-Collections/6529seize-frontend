import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import PositiveOnlyToggle from '../../../../../../../components/groups/page/create/config/rep/PositiveOnlyToggle';

describe('PositiveOnlyToggle', () => {
  it('reflects unchecked state and toggles on click', async () => {
    const setPositiveOnly = jest.fn();
    render(<PositiveOnlyToggle positiveOnly={false} setPositiveOnly={setPositiveOnly} />);
    const checkbox = screen.getByLabelText('Positive Only');
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(setPositiveOnly).toHaveBeenCalledWith(true);
  });

  it('shows checked state and toggles off', async () => {
    const setPositiveOnly = jest.fn();
    render(<PositiveOnlyToggle positiveOnly={true} setPositiveOnly={setPositiveOnly} />);
    const checkbox = screen.getByLabelText('Positive Only');
    expect(checkbox).toBeChecked();
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'true');
    const knob = switchEl.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(knob.className).toContain('tw-translate-x-5');
    await userEvent.click(checkbox);
    expect(setPositiveOnly).toHaveBeenCalledWith(false);
  });
});
