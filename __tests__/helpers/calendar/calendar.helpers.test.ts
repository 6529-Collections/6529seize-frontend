import { generateCalendar } from '../../../helpers/calendar/calendar.helpers';

describe('calendar.helpers', () => {
  it('generates a month grid with previous and next month days', () => {
    const result = generateCalendar({ year: 2024, month: 2 }); // March 2024
    expect(result).toHaveLength(35);
    // first days from previous month
    expect(result[0]).toEqual(
      expect.objectContaining({ date: 26, isActiveMonth: false })
    );
    // first active day
    expect(result[4]).toEqual(
      expect.objectContaining({ date: 1, isActiveMonth: true })
    );
    // last active day
    expect(result[result.length - 1]).toEqual(
      expect.objectContaining({ date: 31, isActiveMonth: true })
    );
  });
});
