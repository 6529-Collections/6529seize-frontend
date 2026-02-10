import { canEditWave, createDirectMessageWave, convertWaveToUpdateWave, getCreateWaveStepStatus } from '@/helpers/waves/waves.helpers';
import { CreateWaveStepStatus } from '@/types/waves.types';

jest.mock('@/services/api/common-api', () => ({
  commonApiPost: jest.fn(() => Promise.resolve('wave')),
}));

import { commonApiPost } from '@/services/api/common-api';

describe('waves.helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCreateWaveStepStatus', () => {
    it('returns DONE when step index is less than active', () => {
      expect(getCreateWaveStepStatus({ stepIndex: 0, activeStepIndex: 2 })).toBe(CreateWaveStepStatus.DONE);
    });

    it('returns ACTIVE when step index equals active', () => {
      expect(getCreateWaveStepStatus({ stepIndex: 2, activeStepIndex: 2 })).toBe(CreateWaveStepStatus.ACTIVE);
    });

    it('returns PENDING when step index is greater than active', () => {
      expect(getCreateWaveStepStatus({ stepIndex: 3, activeStepIndex: 2 })).toBe(CreateWaveStepStatus.PENDING);
    });
  });

  describe('convertWaveToUpdateWave', () => {
    it('maps fields correctly', () => {
      const wave: any = {
        name: 'wave1',
        picture: 'pic.png',
        voting: {
          scope: { group: { id: 'vgroup' } },
          credit_type: 'credit',
          credit_category: 'cat',
          creditor: { id: 'cred1' },
          signature_required: false,
          period: 10,
          forbid_negative_votes: true,
        },
        visibility: { scope: { group: { id: 'vis' } } },
        chat: { scope: { group: { id: 'chat' } }, enabled: true },
        participation: {
          scope: { group: { id: 'part' } },
          no_of_applications_allowed_per_participant: 2,
          required_media: null,
          required_metadata: [],
          signature_required: true,
          period: 5,
          terms: 'terms',
        },
        wave: {
          admin_drop_deletion_enabled: true,
          type: 'TYPE',
          winning_thresholds: { min: 1, max: 3 },
          max_winners: 2,
          time_lock_ms: 100,
          admin_group: { group: { id: 'admin' } },
          decisions_strategy: 'strategy',
        },
        outcomes: [{ foo: 'bar' }],
      };

      const result = convertWaveToUpdateWave(wave);
      expect(result).toEqual({
        name: 'wave1',
        picture: 'pic.png',
        voting: {
          scope: { group_id: 'vgroup' },
          credit_type: 'credit',
          credit_category: 'cat',
          creditor_id: 'cred1',
          signature_required: false,
          period: 10,
          forbid_negative_votes: true,
        },
        visibility: { scope: { group_id: 'vis' } },
        chat: { scope: { group_id: 'chat' }, enabled: true },
        participation: {
          scope: { group_id: 'part' },
          no_of_applications_allowed_per_participant: 2,
          required_media: null,
          required_metadata: [],
          signature_required: true,
          period: 5,
          terms: 'terms',
        },
        wave: {
          admin_drop_deletion_enabled: true,
          type: 'TYPE',
          winning_thresholds: { min: 1, max: 3 },
          max_winners: 2,
          time_lock_ms: 100,
          admin_group: { group_id: 'admin' },
          decisions_strategy: 'strategy',
        },
        outcomes: [{ foo: 'bar' }],
      });
    });
  });

  describe('canEditWave', () => {
    const baseWave: any = {
      author: { handle: 'author' },
      wave: { authenticated_user_eligible_for_admin: false },
    };

    it('returns false without connected profile', () => {
      expect(canEditWave({ connectedProfile: null, activeProfileProxy: null, wave: baseWave })).toBe(false);
    });

    it('returns false when proxy active', () => {
      expect(canEditWave({ connectedProfile: { handle: 'author' } as any, activeProfileProxy: {} as any, wave: baseWave })).toBe(false);
    });

    it('returns true when user is author', () => {
      expect(canEditWave({ connectedProfile: { handle: 'author' } as any, activeProfileProxy: null, wave: baseWave })).toBe(true);
    });

    it('returns true when eligible for admin', () => {
      const wave = { ...baseWave, wave: { authenticated_user_eligible_for_admin: true } };
      expect(canEditWave({ connectedProfile: { handle: 'other' } as any, activeProfileProxy: null, wave })).toBe(true);
    });

    it('returns false otherwise', () => {
      expect(canEditWave({ connectedProfile: { handle: 'other' } as any, activeProfileProxy: null, wave: baseWave })).toBe(false);
    });
  });

  describe('createDirectMessageWave', () => {
    it('posts to API with addresses', async () => {
      const result = await createDirectMessageWave({ addresses: ['a', 'b'] });
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: 'waves/direct-message/new',
        body: { identity_addresses: ['a', 'b'] },
      });
      expect(result).toBe('wave');
    });
  });
});

