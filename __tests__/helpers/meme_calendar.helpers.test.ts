import { Time } from '../../helpers/time';
import {
  isMintingToday,
  getMintingDates,
  numberOfCardsForSeasonEnd,
  numberOfCardsForCalendarEnd,
} from '../../helpers/meme_calendar.helpers';

describe('meme_calendar.helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('detects minting day and returns upcoming dates', () => {
    jest.spyOn(Time, 'now').mockReturnValue(Time.fromString('2023-01-02'));
    expect(isMintingToday()).toBe(true);

    jest.spyOn(Time, 'now').mockReturnValue(Time.fromString('2023-01-01'));
    const dates = getMintingDates(3);
    expect(dates.map((d: any) => d.toIsoString())).toEqual([
      '2023-01-02T00:00:00.000Z',
      '2023-01-04T00:00:00.000Z',
      '2023-01-06T00:00:00.000Z',
    ]);
  });

  it('calculates cards remaining for season and calendar end', () => {
    jest.spyOn(Time, 'now').mockReturnValue(Time.fromString('2023-03-30'));
    const season = numberOfCardsForSeasonEnd();
    expect(season).toEqual({ szn: 10, count: 32 });

    const calendar = numberOfCardsForCalendarEnd();
    expect(calendar.year).toBe('Year 1');
    expect(calendar.count).toBe(94);

    jest.spyOn(Time, 'now').mockReturnValue(Time.fromString('2026-01-01'));
    expect(numberOfCardsForCalendarEnd()).toEqual({ year: '', count: 0 });
  });
});
