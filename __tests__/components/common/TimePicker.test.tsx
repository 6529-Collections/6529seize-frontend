import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TimePicker from '../../../components/common/TimePicker';

describe('TimePicker', () => {
  it('changes hours and minutes via inputs', () => {
    const onChange = jest.fn();
    render(<TimePicker hours={9} minutes={15} onTimeChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('HH'), { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledWith(10, 15);
    fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: '45' } });
    expect(onChange).toHaveBeenCalledWith(9, 45);
  });

  it('toggles am/pm respecting minTime', () => {
    const onChange = jest.fn();
    render(<TimePicker hours={9} minutes={0} onTimeChange={onChange} minTime={{ hours: 8, minutes: 0 }} />);
    fireEvent.click(screen.getByText('AM'));
    expect(onChange).toHaveBeenCalledWith(21, 0);
  });

  it('disables options before minTime', () => {
    const onChange = jest.fn();
    render(<TimePicker hours={9} minutes={0} onTimeChange={onChange} minTime={{ hours: 9, minutes: 30 }} />);
    const early = screen.getByText('9 AM') as HTMLButtonElement;
    const later = screen.getByText('12 PM');
    expect(early).toBeDisabled();
    fireEvent.click(later);
    expect(onChange).toHaveBeenCalledWith(12, 0);
  });
});
