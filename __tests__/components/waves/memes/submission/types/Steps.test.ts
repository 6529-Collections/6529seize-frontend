import {
  SubmissionStep,
  stepEnumToIndex,
  stepIndexToEnum,
} from '../../../../../../components/waves/memes/submission/types/Steps';

describe('SubmissionStep enum', () => {
  it('contains expected values', () => {
    expect(SubmissionStep.AGREEMENT).toBe('agreement');
    expect(SubmissionStep.ARTWORK).toBe('artwork');
  });

  it('maps indices and enums correctly', () => {
    expect(stepIndexToEnum(0)).toBe(SubmissionStep.AGREEMENT);
    expect(stepIndexToEnum(1)).toBe(SubmissionStep.ARTWORK);
    expect(stepIndexToEnum(5)).toBe(SubmissionStep.AGREEMENT);

    expect(stepEnumToIndex(SubmissionStep.AGREEMENT)).toBe(0);
    expect(stepEnumToIndex(SubmissionStep.ARTWORK)).toBe(1);
    expect(stepEnumToIndex('unknown' as any)).toBe(0);
  });
});
