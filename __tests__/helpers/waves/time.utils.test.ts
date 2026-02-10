import { calculateTimeLeft, calculateLastDecisionTime } from '@/helpers/waves/time.utils';
import { Time } from '@/helpers/time';

jest.mock('@/helpers/time', () => ({
  Time: { currentMillis: jest.fn() }
}));

const mockTime = Time as any;

describe('time utils', () => {
  it('calculates time left with future timestamp', () => {
    mockTime.currentMillis.mockReturnValue(1000);
    const left = calculateTimeLeft(1000 + 1000 * 60 * 65); // 1h5m
    expect(left.hours).toBe(1);
    expect(left.minutes).toBe(5);
  });

  it('calculates last decision time for rolling waves', () => {
    const wave: any = {
      wave: { decisions_strategy: { first_decision_time: 10, subsequent_decisions: [5,5], is_rolling: true } },
      voting: { period: { max: 40 } }
    };
    const result = calculateLastDecisionTime(wave);
    expect(result).toBe(40);
  });
});
