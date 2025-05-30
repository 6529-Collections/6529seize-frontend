import { SubmissionStep } from '../../../../../../components/waves/memes/submission/types/Steps';

describe('SubmissionStep enum', () => {
  it('contains expected values', () => {
    expect(SubmissionStep.AGREEMENT).toBe('agreement');
    expect(SubmissionStep.ARTWORK).toBe('artwork');
  });

  it('is the only export from the module', () => {
    const stepsModule = require('../../../../../../components/waves/memes/submission/types/Steps');
    expect(Object.keys(stepsModule)).toEqual(['SubmissionStep']);
  });
});
