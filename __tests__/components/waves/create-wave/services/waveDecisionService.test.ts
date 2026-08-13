import {
  calculateDecisionTimes,
  calculateEndDate,
  validateDateSequence,
  adjustDatesAfterSubmissionChange,
  ensureSafeFirstDecisionTime,
  formatDate,
  getDefaultFirstDecisionTime,
  countTotalDecisions,
  calculateEndDateForCycles,
} from "@/components/waves/create-wave/services/waveDecisionService";

describe("waveDecisionService", () => {
  it("calculates decision times list", () => {
    expect(calculateDecisionTimes(10, [5, 5])).toEqual([10, 15, 20]);
  });

  it("calculates end date for non rolling", () => {
    const dates = {
      firstDecisionTime: 10,
      subsequentDecisions: [5, 5],
      isRolling: false,
    } as any;
    expect(calculateEndDate(dates)).toBe(20);
  });

  it("validates date sequence", () => {
    const errs = validateDateSequence({
      submissionStartDate: 5,
      votingStartDate: 4,
      firstDecisionTime: 3,
      isRolling: false,
      subsequentDecisions: [],
      endDate: null,
    } as any);
    expect(errs).toContain(
      "Voting start date must be after submission start date"
    );
    expect(errs).toContain(
      "First decision time must be after voting start date"
    );
  });

  it("adjusts dates after submission change", () => {
    const result = adjustDatesAfterSubmissionChange(
      {
        submissionStartDate: 1,
        votingStartDate: 2,
        firstDecisionTime: 3,
      } as any,
      5
    );
    expect(result.votingStartDate).toBe(5);
    expect(result.firstDecisionTime).toBe(5);
  });

  it("defaults the first decision to one week out at 23:59", () => {
    // Defaulting to the SAME day would end the whole wave within hours, so the
    // seed lands a week later at end of day.
    const votingStart = new Date("2023-01-01T12:00:00Z").getTime();
    const expected = new Date(votingStart);
    expected.setDate(expected.getDate() + 7);
    expected.setHours(23, 59, 0, 0);
    expect(getDefaultFirstDecisionTime(votingStart)).toBe(expected.getTime());
  });

  it("reseeds the first decision when voting start catches up to it", () => {
    const votingStartDate = new Date("2023-01-01T12:00:00Z").getTime();
    const reseeded = ensureSafeFirstDecisionTime({
      submissionStartDate: votingStartDate,
      votingStartDate,
      // At (or before) voting start → must be pushed to the safe default.
      firstDecisionTime: votingStartDate,
    } as any);
    expect(reseeded.firstDecisionTime).toBe(
      getDefaultFirstDecisionTime(votingStartDate)
    );
  });

  it("leaves a first decision that is already safely after voting start", () => {
    const votingStartDate = 1000;
    const firstDecisionTime = 999999;
    const kept = ensureSafeFirstDecisionTime({
      submissionStartDate: 0,
      votingStartDate,
      firstDecisionTime,
    } as any);
    expect(kept.firstDecisionTime).toBe(firstDecisionTime);
  });

  it("formats date", () => {
    const ts = Date.UTC(2020, 0, 1, 12, 0, 0);
    expect(formatDate(ts, "en-US")).toMatch(/Jan/);
    expect(formatDate(ts, "en-GB")).not.toBe(formatDate(ts, "en-US"));
  });

  it("counts total decisions in rolling mode", () => {
    const total = countTotalDecisions(0, [10, 20], 80);
    expect(total).toBe(6);
  });

  it("calculates end date for cycles", () => {
    expect(calculateEndDateForCycles(0, [10, 20], 2)).toBe(60);
  });

  it("returns empty errors when dates are valid", () => {
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

  it("allows rolling mode without an end date", () => {
    const errors = validateDateSequence({
      submissionStartDate: 1,
      votingStartDate: 2,
      firstDecisionTime: 3,
      subsequentDecisions: [5],
      isRolling: true,
      endDate: null,
    } as any);

    expect(errors).toHaveLength(0);
  });

  it("calculates end date for rolling waves", () => {
    const dates = {
      firstDecisionTime: 10,
      subsequentDecisions: [5],
      isRolling: true,
      endDate: 50,
    } as any;
    expect(calculateEndDate(dates)).toBe(50);
  });
});
