import { Time } from '@/helpers/time';

describe('Time utilities', () => {
  it('formatRoundedLargestUnit chooses units', () => {
    expect(Time.seconds(30).formatRoundedLargestUnit()).toBe('30 seconds');
    expect(Time.minutes(10).formatRoundedLargestUnit()).toBe('10 minutes');
    expect(Time.hours(2).formatRoundedLargestUnit()).toBe('2 hours');
    expect(Time.days(5).formatRoundedLargestUnit()).toBe('5 days');
    expect(Time.days(40).formatRoundedLargestUnit()).toBe('1 months');
    expect(Time.days(800).formatRoundedLargestUnit()).toBe('2 years');
  });
});
