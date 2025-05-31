import { useDecisionPoints } from '../../../hooks/waves/useDecisionPoints';

const mockCalculate = require('../../../helpers/waves/time.utils').calculateLastDecisionTime;

jest.mock('../../../helpers/waves/time.utils', () => ({
  calculateLastDecisionTime: jest.fn(() => 21)
}));

describe('useDecisionPoints', () => {
  it('returns empty array when first decision missing', () => {
    const wave: any = { wave: { decisions_strategy: {} } };
    expect(useDecisionPoints(wave).allDecisions).toEqual([]);
  });

  it('creates decision points until last time', () => {
    const wave: any = {
      wave: {
        decisions_strategy: { first_decision_time: 10, subsequent_decisions: [5] },
      },
    };
    const result = useDecisionPoints(wave).allDecisions;
    expect(mockCalculate).toHaveBeenCalledWith(wave);
    expect(result).toEqual([
      { id: 0, name: 'First Decision', timestamp: 10 },
      { id: 1, name: 'Decision 1', timestamp: 15 },
      { id: 2, name: 'Decision 2', timestamp: 20 },
    ]);
  });
});
