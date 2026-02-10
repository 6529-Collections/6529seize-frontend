import { render, screen, fireEvent } from '@testing-library/react';
import CommonCalendar from '@/components/utils/calendar/CommonCalendar';

jest.mock('@/helpers/calendar/calendar.helpers', () => ({
  __esModule: true,
  generateCalendar: jest.fn(() => [{ startTimestamp: 0, date: 1, isActiveMonth: true }])
}));

jest.mock('@/components/utils/calendar/CommonCalendarDay', () => ({ __esModule: true, default: () => <div data-testid="day" /> }));

describe('CommonCalendar', () => {
  it('initializes from selected timestamp and navigates months', () => {
    const setSelected = jest.fn();
    const ts = new Date('2025-03-15T00:00:00Z').getTime();
    render(
      <CommonCalendar
        initialMonth={0}
        initialYear={2024}
        minTimestamp={null}
        maxTimestamp={null}
        selectedTimestamp={ts}
        setSelectedTimestamp={setSelected}
      />
    );
    expect(screen.getByText('March')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Next month'));
    expect(screen.getByText('April')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(screen.getByText('March')).toBeInTheDocument();
  });
});
