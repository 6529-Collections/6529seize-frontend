import {
  getCreateWaveNextStep,
  getCreateWavePreviousStep,
  calculateLastDecisionTime,
} from '../../../helpers/waves/create-wave.helpers';
import { ApiWaveType } from '../../../generated/models/ApiWaveType';
import { CreateWaveStep } from '../../../types/waves.types';

describe('create-wave.helpers', () => {
  describe('getCreateWaveNextStep', () => {
    it('returns expected next steps for various wave types', () => {
      expect(
        getCreateWaveNextStep({ step: CreateWaveStep.OVERVIEW, waveType: ApiWaveType.Rank })
      ).toBe(CreateWaveStep.GROUPS);
      expect(
        getCreateWaveNextStep({ step: CreateWaveStep.GROUPS, waveType: ApiWaveType.Chat })
      ).toBe(CreateWaveStep.DESCRIPTION);
      expect(
        getCreateWaveNextStep({ step: CreateWaveStep.VOTING, waveType: ApiWaveType.Approve })
      ).toBe(CreateWaveStep.APPROVAL);
      expect(
        getCreateWaveNextStep({ step: CreateWaveStep.DESCRIPTION, waveType: ApiWaveType.Rank })
      ).toBeNull();
    });
  });

  describe('getCreateWavePreviousStep', () => {
    it('returns expected previous steps based on wave type', () => {
      expect(
        getCreateWavePreviousStep({ step: CreateWaveStep.DESCRIPTION, waveType: ApiWaveType.Chat })
      ).toBe(CreateWaveStep.GROUPS);
      expect(
        getCreateWavePreviousStep({ step: CreateWaveStep.OUTCOMES, waveType: ApiWaveType.Approve })
      ).toBe(CreateWaveStep.APPROVAL);
    });
  });

  describe('calculateLastDecisionTime', () => {
    it('handles empty subsequent decisions', () => {
      expect(calculateLastDecisionTime(1000, [], 5000)).toBe(1000);
    });

    it('handles end date before first decision', () => {
      expect(calculateLastDecisionTime(5000, [1000], 4000)).toBe(5000);
    });

    it('handles multi-decision non-rolling waves', () => {
      expect(calculateLastDecisionTime(0, [10, 20], 100)).toBe(100);
      expect(calculateLastDecisionTime(0, [50, 60], 80)).toBe(50);
    });

    it('handles rolling waves correctly', () => {
      expect(calculateLastDecisionTime(0, [10, 10], 35)).toBe(30);
    });
  });
});
