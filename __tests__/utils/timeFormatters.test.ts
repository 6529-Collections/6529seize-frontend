import { formatCountdown } from '@/utils/timeFormatters';

describe('formatCountdown', () => {
  const realDateNow = Date.now;
  let now: number;

  beforeEach(() => {
    now = 1600000000000; // fixed timestamp
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    (Date.now as jest.Mock).mockRestore();
  });

  it('returns empty string for null timestamp', () => {
    expect(formatCountdown(null)).toBe('');
  });

  it('returns "Now" when timestamp has passed', () => {
    expect(formatCountdown(now - 1000)).toBe('Now');
  });

  it('formats times less than a day', () => {
    const thirtyMinutes = now + 30 * 60 * 1000;
    expect(formatCountdown(thirtyMinutes)).toBe('in 30m');

    const twoHoursFifteen = now + 2 * 60 * 60 * 1000 + 15 * 60 * 1000;
    expect(formatCountdown(twoHoursFifteen)).toBe('in 2h 15m');
  });

  it('formats times less than a week', () => {
    const twoDaysThreeHours = now + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000;
    expect(formatCountdown(twoDaysThreeHours)).toBe('in 2d 3h');
  });

  it('formats distant future dates', () => {
    const inTenDays = now + 10 * 24 * 60 * 60 * 1000;
    const expected = new Date(inTenDays).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    expect(formatCountdown(inTenDays)).toBe(expected);
  });
});
