import {
  getCreateWaveNextStep,
  getCreateWavePreviousStep,
  calculateLastDecisionTime,
} from '../../../helpers/waves/create-wave.helpers';
import { ApiWaveType } from '../../../generated/models/ApiWaveType';
import { ApiWaveMetadataType } from '../../../generated/models/ApiWaveMetadataType';
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

  describe('getCreateNewWaveBody', () => {
    it('converts config into request body', () => {
      const { getCreateNewWaveBody } = require('../../../helpers/waves/create-wave.helpers');
      const config = {
        overview: { type: ApiWaveType.Chat, name: 'W', image: null },
        groups: { canView:'1', canDrop:'2', canVote:'3', canChat:'4', admin:'5' },
        dates: { submissionStartDate:1, votingStartDate:2, endDate:null, firstDecisionTime:2, subsequentDecisions:[3,5], isRolling:false },
        drops: { noOfApplicationsAllowedPerParticipant:1, requiredTypes:[], requiredMetadata:[{key:'m', type:ApiWaveMetadataType.String}], terms:null, signatureRequired:false, adminCanDeleteDrops:false },
        chat: { enabled:true },
        voting: { type:null, category:null, profileId:null, timeWeighted:{ enabled:false, averagingInterval:5, averagingIntervalUnit:'minutes'} },
        outcomes: [],
        approval: { threshold:null, thresholdTimeMs:null }
      } as any;
      const drop = { parts:[], referenced_nfts:[], mentioned_users:[], metadata:[] } as any;
      const res = getCreateNewWaveBody({ drop, picture:'pic', config });
      expect(res.name).toBe('W');
      expect(res.picture).toBe('pic');
      expect(res.participation.required_metadata).toEqual([{ name:'m', type:ApiWaveMetadataType.String }]);
      expect(res.voting.period.max).toBe(2 + 3 + 5);
    });
  });
});
