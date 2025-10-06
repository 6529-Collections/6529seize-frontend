import * as exported from '@/components/waves/create-wave/voting/components';
import TimeWeightedToggle from '@/components/waves/create-wave/voting/components/TimeWeightedToggle';
import AveragingIntervalInput from '@/components/waves/create-wave/voting/components/AveragingIntervalInput';

describe('voting components index', () => {
  it('re-exports TimeWeightedToggle', () => {
    expect(exported.TimeWeightedToggle).toBe(TimeWeightedToggle);
  });

  it('re-exports AveragingIntervalInput', () => {
    expect(exported.AveragingIntervalInput).toBe(AveragingIntervalInput);
  });
});
