import { renderHook } from "@testing-library/react";
import { useDecisionPoints } from "@/hooks/waves/useDecisionPoints";

const mockUtils = require("@/helpers/waves/time.utils");
const mockTime = require("@/helpers/time");

jest.mock("@/helpers/waves/time.utils", () => ({
  calculateLastDecisionTime: jest.fn(() => 21),
  FALLBACK_END_TIME: Number.MAX_SAFE_INTEGER,
}));

jest.mock("@/helpers/time", () => ({
  Time: { currentMillis: jest.fn(() => 0) },
}));

describe("useDecisionPoints", () => {
  beforeEach(() => {
    mockUtils.calculateLastDecisionTime.mockReturnValue(21);
    mockTime.Time.currentMillis.mockReturnValue(0);
  });

  it("returns empty array when first decision missing", () => {
    const wave: any = {
      wave: { id: "wave-1", decisions_strategy: {} },
      voting: { period: {} },
    };

    const { result } = renderHook(() => useDecisionPoints(wave));
    expect(result.current.allDecisions).toEqual([]);
    expect(result.current.remainingPastCount).toBe(0);
    expect(result.current.remainingFutureCount).toBe(0);
  });

  it("creates decision points until last time", () => {
    const wave: any = {
      wave: {
        id: "wave-2",
        decisions_strategy: {
          first_decision_time: 10,
          subsequent_decisions: [5],
        },
      },
      voting: { period: { max: 30 } },
    };

    const { result } = renderHook(() =>
      useDecisionPoints(wave, {
        initialPastWindow: 6,
        initialFutureWindow: 6,
      })
    );

    expect(mockUtils.calculateLastDecisionTime).toHaveBeenCalledWith(wave);
    expect(result.current.allDecisions).toEqual([
      { id: "10-0", name: "First Decision", timestamp: 10, seriesIndex: 0 },
      { id: "15-1", name: "Decision 1", timestamp: 15, seriesIndex: 1 },
    ]);
    expect(result.current.remainingPastCount).toBe(0);
    expect(result.current.remainingFutureCount).toBe(0);
  });

  it("keeps infinite rolling decision points windowed", () => {
    mockUtils.calculateLastDecisionTime.mockReturnValue(
      Number.MAX_SAFE_INTEGER
    );
    mockTime.Time.currentMillis.mockReturnValue(25);
    const wave: any = {
      wave: {
        id: "wave-3",
        decisions_strategy: {
          first_decision_time: 0,
          subsequent_decisions: [10],
          is_rolling: true,
        },
      },
      voting: { period: { max: null } },
    };

    const { result } = renderHook(() =>
      useDecisionPoints(wave, {
        initialPastWindow: 2,
        initialFutureWindow: 3,
      })
    );

    expect(result.current.allDecisions).toEqual([
      { id: "10-1", name: "Decision 1", timestamp: 10, seriesIndex: 1 },
      { id: "20-2", name: "Decision 2", timestamp: 20, seriesIndex: 2 },
      { id: "30-3", name: "Decision 3", timestamp: 30, seriesIndex: 3 },
      { id: "40-4", name: "Decision 4", timestamp: 40, seriesIndex: 4 },
      { id: "50-5", name: "Decision 5", timestamp: 50, seriesIndex: 5 },
    ]);
    expect(result.current.hasMoreFuture).toBe(true);
    expect(result.current.remainingFutureCount).toBeNull();
  });
});
