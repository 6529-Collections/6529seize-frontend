import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Countdown from '../../../../components/distribution-plan-tool/common/Countdown';

jest.useFakeTimers();

describe('Countdown component', () => {
  it('counts down and stops', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const target = now + 5000; // 5 seconds later
    render(<Countdown timestamp={target} />);
    act(() => {
      jest.advanceTimersByTime(1000); // first interval
    });
    expect(screen.getByText(/seconds/)).toBeInTheDocument();

    // advance remaining time
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Countdown finished!')).toBeInTheDocument();
    expect(jest.getTimerCount()).toBe(0);
  });
});
