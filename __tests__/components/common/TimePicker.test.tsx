import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TimePicker from '@/components/common/TimePicker';

describe('TimePicker', () => {
  it('labels hour and minute inputs for accessibility', () => {
    const onChange = jest.fn();
    render(<TimePicker hours={9} minutes={15} onTimeChange={onChange} />);

    const hoursInput = screen.getByLabelText('Hours');
    const minutesInput = screen.getByLabelText('Minutes');

    fireEvent.change(hoursInput, { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledWith(10, 15);

    fireEvent.change(minutesInput, { target: { value: '45' } });
    expect(onChange).toHaveBeenCalledWith(9, 45);
  });

  it('toggles am/pm respecting minTime', () => {
    const onChange = jest.fn();
    render(
      <TimePicker hours={9} minutes={0} onTimeChange={onChange} minTime={{ hours: 8, minutes: 0 }} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle AM/PM' }));
    expect(onChange).toHaveBeenCalledWith(21, 0);
  });

  it('describes minimum time and disables earlier quick options', () => {
    const onChange = jest.fn();
    render(
      <TimePicker hours={9} minutes={0} onTimeChange={onChange} minTime={{ hours: 9, minutes: 30 }} />
    );

    const hoursInput = screen.getByLabelText('Hours');
    const minutesInput = screen.getByLabelText('Minutes');

    const describedBy = hoursInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const description = document.getElementById(describedBy ?? '');
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent('Earliest selectable time is 9:30 AM.');

    expect(minutesInput.getAttribute('aria-describedby')).toBe(describedBy);

    const early = screen.getByText('9 AM') as HTMLButtonElement;
    const later = screen.getByText('12 PM');
    expect(early).toBeDisabled();
    fireEvent.click(later);
    expect(onChange).toHaveBeenCalledWith(12, 0);
  });
});
