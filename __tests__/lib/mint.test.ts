import { DateTime } from 'luxon';
import prologue from '@/data/prologue-mints.json';
import {
  dateForMintNumber,
  mintNumberForDate,
  timeCoordinate,
  nextOccurrences,
  FIRST_PROTOCOL_MINT,
  googleCalendarLink,
} from '@/lib/mint';

describe('mint utilities', () => {
  it('maps mint numbers to dates and back', () => {
    const d438 = dateForMintNumber(438, prologue);
    expect(d438.toISODate()).toBe('2025-12-12');

    const d439 = dateForMintNumber(439, prologue);
    expect(d439.toISO()).toBe('2026-01-02T18:00:00.000Z');

    expect(mintNumberForDate(d438, prologue)).toBe(438);
    expect(mintNumberForDate(FIRST_PROTOCOL_MINT, prologue)).toBe(439);
    expect(mintNumberForDate(DateTime.fromISO('2026-01-03T18:00:00Z'), prologue)).toBeNull();
  });

  it('computes time coordinates', () => {
    const coord = timeCoordinate(FIRST_PROTOCOL_MINT);
    expect(coord).toEqual({
      eon: 1,
      era: 1,
      period: 1,
      epoch: 0,
      year: 2026,
      season: 'Q1',
    });
  });

  it('generates next occurrences', () => {
    jest.spyOn(DateTime, 'utc').mockReturnValue(DateTime.fromISO('2026-01-01T00:00:00Z'));
    const upcoming = nextOccurrences(3);
    expect(upcoming.map((d) => d.toISODate())).toEqual([
      '2026-01-02',
      '2026-01-05',
      '2026-01-07',
    ]);
    jest.restoreAllMocks();
  });

  it('builds google calendar link', () => {
    const link = googleCalendarLink(FIRST_PROTOCOL_MINT);
    expect(link).toContain('20260102T180000Z');
    expect(link).toContain('Protocol+Mint');
  });
});
