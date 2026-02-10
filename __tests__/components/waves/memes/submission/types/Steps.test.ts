import { SubmissionStep } from '@/components/waves/memes/submission/types/Steps';

describe('SubmissionStep enum', () => {
  it('contains expected values', () => {
    expect(SubmissionStep.AGREEMENT).toBe('agreement');
    expect(SubmissionStep.ARTWORK).toBe('artwork');
  });
});
