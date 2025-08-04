import { Time } from '../../helpers/time';

describe('Time utilities', () => {
  beforeEach(() => {
    // Mock toLocaleString to ensure English locale for consistent formatting
    const originalToLocaleString = Date.prototype.toLocaleString;
    jest.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(this: Date, locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
      return originalToLocaleString.call(this, 'en-US', options);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('toMonthAndDayString formats correctly', () => {
    const t = Time.fromString('2024-01-02T00:00:00Z');
    expect(t.toMonthAndDayString()).toBe('Tuesday, January 2nd');
  });

  it('formatRoundedLargestUnit chooses units', () => {
    expect(Time.seconds(30).formatRoundedLargestUnit()).toBe('30 seconds');
    expect(Time.minutes(10).formatRoundedLargestUnit()).toBe('10 minutes');
    expect(Time.hours(2).formatRoundedLargestUnit()).toBe('2 hours');
    expect(Time.days(5).formatRoundedLargestUnit()).toBe('5 days');
    expect(Time.days(40).formatRoundedLargestUnit()).toBe('1 months');
    expect(Time.days(800).formatRoundedLargestUnit()).toBe('2 years');
  });
});
