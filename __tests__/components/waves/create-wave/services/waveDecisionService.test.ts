import {
  calculateDecisionTimes,
  calculateEndDate,
  validateDateSequence,
  adjustDatesAfterSubmissionChange,
  formatDate,
  countTotalDecisions,
  calculateEndDateForCycles,
} from '@/components/waves/create-wave/services/waveDecisionService';

describe('waveDecisionService', () => {
  it('calculates decision times list', () => {
    expect(calculateDecisionTimes(10, [5, 5])).toEqual([10, 15, 20]);
  });

  it('calculates end date for non rolling', () => {
    const dates = { firstDecisionTime: 10, subsequentDecisions: [5, 5], isRolling: false } as any;
    expect(calculateEndDate(dates)).toBe(20);
  });

  it('validates date sequence', () => {
    const errs = validateDateSequence({ submissionStartDate: 5, votingStartDate: 4, firstDecisionTime: 3, isRolling: false, subsequentDecisions: [], endDate: null } as any);
    expect(errs).toContain('Voting start date must be after submission start date');
    expect(errs).toContain('First decision time must be after voting start date');
  });

  it('adjusts dates after submission change', () => {
    const result = adjustDatesAfterSubmissionChange({ submissionStartDate: 1, votingStartDate: 2, firstDecisionTime: 3 } as any, 5);
    expect(result.votingStartDate).toBe(5);
    expect(result.firstDecisionTime).toBe(5);
  });

  it('formats date', () => {
    const ts = Date.UTC(2020, 0, 1, 12, 0, 0);
    expect(formatDate(ts)).toMatch(/Jan/);
  });

  it('counts total decisions in rolling mode', () => {
    const total = countTotalDecisions(0, [10, 20], 80);
    expect(total).toBe(6);
  });

  it('calculates end date for cycles', () => {
    expect(calculateEndDateForCycles(0, [10, 20], 2)).toBe(60);
  });

  it('returns empty errors when dates are valid', () => {
    const errs = validateDateSequence({
      submissionStartDate: 1,
      votingStartDate: 2,
      firstDecisionTime: 3,
      subsequentDecisions: [],
      isRolling: false,
      endDate: null,
    } as any);
    expect(errs).toHaveLength(0);
  });

  it('calculates end date for rolling waves', () => {
    const dates = { firstDecisionTime: 10, subsequentDecisions: [5], isRolling: true, endDate: 50 } as any;
    expect(calculateEndDate(dates)).toBe(50);
  });
});
