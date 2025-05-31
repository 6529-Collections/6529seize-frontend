import { renderHook, act } from '@testing-library/react';
import { useWaveConfig } from '../../../../../components/waves/create-wave/hooks/useWaveConfig';
import { ApiWaveType } from '../../../../../generated/models/ApiWaveType';
import { ApiWaveCreditType } from '../../../../../generated/models/ApiWaveCreditType';
import { CreateWaveStep, CreateWaveGroupConfigType, CreateWaveOutcomeType } from '../../../../../types/waves.types';
import { ApiGroupFull } from '../../../../../generated/models/ApiGroupFull';
import * as createWaveValidation from '../../../../../helpers/waves/create-wave.validation';

// Mock dependencies
jest.mock('../../../../../helpers/waves/create-wave.validation');
jest.mock('../../../../../helpers/time', () => ({
  Time: {
    currentMillis: jest.fn(() => 1000000),
  },
}));

const mockGetCreateWaveValidationErrors = createWaveValidation.getCreateWaveValidationErrors as jest.MockedFunction<typeof createWaveValidation.getCreateWaveValidationErrors>;

describe('useWaveConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCreateWaveValidationErrors.mockReturnValue([]);
  });

  describe('Initial State', () => {
    it('should initialize with default Chat wave configuration', () => {
      const { result } = renderHook(() => useWaveConfig());

      expect(result.current.config.overview.type).toBe(ApiWaveType.Chat);
      expect(result.current.config.overview.name).toBe('');
      expect(result.current.config.overview.image).toBeNull();
      expect(result.current.step).toBe(CreateWaveStep.OVERVIEW);
      expect(result.current.selectedOutcomeType).toBeNull();
      expect(result.current.errors).toEqual([]);
      expect(result.current.groupsCache).toEqual({});
    });

    it('should initialize dates with current timestamp', () => {
      const { result } = renderHook(() => useWaveConfig());

      expect(result.current.config.dates.submissionStartDate).toBe(1000000);
      expect(result.current.config.dates.votingStartDate).toBe(1000000);
      expect(result.current.config.dates.firstDecisionTime).toBe(1000000);
      expect(result.current.config.dates.endDate).toBeNull();
      expect(result.current.config.dates.subsequentDecisions).toEqual([]);
      expect(result.current.config.dates.isRolling).toBe(false);
    });

    it('should initialize voting with TDH configuration', () => {
      const { result } = renderHook(() => useWaveConfig());

      expect(result.current.config.voting.type).toBe(ApiWaveCreditType.Tdh);
      expect(result.current.config.voting.category).toBeNull();
      expect(result.current.config.voting.profileId).toBeNull();
      expect(result.current.config.voting.timeWeighted).toEqual({
        enabled: false,
        averagingInterval: 24,
        averagingIntervalUnit: 'hours',
      });
    });

    it('should initialize with default groups, drops, and other settings', () => {
      const { result } = renderHook(() => useWaveConfig());

      // Groups
      expect(result.current.config.groups).toEqual({
        canView: null,
        canDrop: null,
        canVote: null,
        canChat: null,
        admin: null,
      });

      // Drops
      expect(result.current.config.drops).toEqual({
        noOfApplicationsAllowedPerParticipant: null,
        requiredTypes: [],
        requiredMetadata: [],
        terms: null,
        signatureRequired: false,
        adminCanDeleteDrops: false,
      });

      // Chat
      expect(result.current.config.chat.enabled).toBe(true);

      // Outcomes
      expect(result.current.config.outcomes).toEqual([]);

      // Approval
      expect(result.current.config.approval).toEqual({
        threshold: null,
        thresholdTimeMs: null,
      });
    });

    it('should initialize endDateConfig with null values', () => {
      const { result } = renderHook(() => useWaveConfig());

      expect(result.current.endDateConfig).toEqual({
        time: null,
        period: null,
      });
    });
  });

  describe('Overview Updates', () => {
    it('should reset config to initial when overview type changes', () => {
      const { result } = renderHook(() => useWaveConfig());

      // First modify some other config
      act(() => {
        result.current.setDates({
          ...result.current.config.dates,
          endDate: 2000000,
        });
      });

      expect(result.current.config.dates.endDate).toBe(2000000);

      // Change overview type - should reset everything
      act(() => {
        result.current.setOverview({
          type: ApiWaveType.Rank,
          name: 'Test Wave',
          image: new File([''], 'test-image.jpg', { type: 'image/jpeg' }),
        });
      });

      expect(result.current.config.overview.type).toBe(ApiWaveType.Rank);
      expect(result.current.config.overview.name).toBe('Test Wave');
      expect(result.current.config.overview.image).toEqual(new File([''], 'test-image.jpg', { type: 'image/jpeg' }));
      expect(result.current.config.dates.endDate).toBeNull(); // Reset to initial
    });
  });

  describe('Section Updates', () => {
    it('should update dates section', () => {
      const { result } = renderHook(() => useWaveConfig());

      const newDates = {
        submissionStartDate: 2000000,
        votingStartDate: 2500000,
        endDate: 3000000,
        firstDecisionTime: 2750000,
        subsequentDecisions: [2900000],
        isRolling: true,
      };

      act(() => {
        result.current.setDates(newDates);
      });

      expect(result.current.config.dates).toEqual(newDates);
    });

    it('should update drops section', () => {
      const { result } = renderHook(() => useWaveConfig());

      const newDrops = {
        noOfApplicationsAllowedPerParticipant: 3,
        requiredTypes: [] as any[],
        requiredMetadata: [{ key: 'title', type: 'STRING' as any }],
        terms: 'Accept terms',
        signatureRequired: true,
        adminCanDeleteDrops: true,
      };

      act(() => {
        result.current.setDrops(newDrops);
      });

      expect(result.current.config.drops).toEqual(newDrops);
    });

    it('should update admin delete permission separately', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.setDropsAdminCanDelete(true);
      });

      expect(result.current.config.drops.adminCanDeleteDrops).toBe(true);
      expect(result.current.config.drops.signatureRequired).toBe(false); // Other props unchanged
    });

    it('should update outcomes section', () => {
      const { result } = renderHook(() => useWaveConfig());

      const newOutcomes = [
        { 
          id: '1', 
          type: CreateWaveOutcomeType.NIC, 
          title: 'Outcome 1',
          credit: 100,
          category: null,
          maxWinners: 5,
          winnersConfig: null
        },
        { 
          id: '2', 
          type: CreateWaveOutcomeType.REP, 
          title: 'Outcome 2',
          credit: 200,
          category: null,
          maxWinners: 3,
          winnersConfig: null
        },
      ];

      act(() => {
        result.current.setOutcomes(newOutcomes);
      });

      expect(result.current.config.outcomes).toEqual(newOutcomes);
    });
  });

  describe('Group Selection', () => {
    const mockGroup: ApiGroupFull = {
      id: 'group-123',
      group: {
        name: 'Test Group',
        description: 'Test group description',
      } as any,
      created_at: Date.now(),
      created_by: {} as any,
      visible: true,
      is_private: false
    } as ApiGroupFull;

    it('should update canView group and cache group', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onGroupSelect({
          group: mockGroup,
          groupType: CreateWaveGroupConfigType.CAN_VIEW,
        });
      });

      expect(result.current.config.groups.canView).toBe('group-123');
      expect(result.current.groupsCache['group-123']).toEqual(mockGroup);
    });

    it('should update canDrop group', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onGroupSelect({
          group: mockGroup,
          groupType: CreateWaveGroupConfigType.CAN_DROP,
        });
      });

      expect(result.current.config.groups.canDrop).toBe('group-123');
    });

    it('should update canVote group', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onGroupSelect({
          group: mockGroup,
          groupType: CreateWaveGroupConfigType.CAN_VOTE,
        });
      });

      expect(result.current.config.groups.canVote).toBe('group-123');
    });

    it('should update canChat group', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onGroupSelect({
          group: mockGroup,
          groupType: CreateWaveGroupConfigType.CAN_CHAT,
        });
      });

      expect(result.current.config.groups.canChat).toBe('group-123');
    });

    it('should update admin group', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onGroupSelect({
          group: mockGroup,
          groupType: CreateWaveGroupConfigType.ADMIN,
        });
      });

      expect(result.current.config.groups.admin).toBe('group-123');
    });

    it('should clear group when null is passed', () => {
      const { result } = renderHook(() => useWaveConfig());

      // First set a group
      act(() => {
        result.current.onGroupSelect({
          group: mockGroup,
          groupType: CreateWaveGroupConfigType.CAN_VIEW,
        });
      });

      expect(result.current.config.groups.canView).toBe('group-123');

      // Clear the group
      act(() => {
        result.current.onGroupSelect({
          group: null,
          groupType: CreateWaveGroupConfigType.CAN_VIEW,
        });
      });

      expect(result.current.config.groups.canView).toBeNull();
    });
  });

  describe('Voting Configuration', () => {
    it('should update voting type and reset dependent fields', () => {
      const { result } = renderHook(() => useWaveConfig());

      // First set some dependent values
      act(() => {
        result.current.onCategoryChange('test-category');
        result.current.onProfileIdChange('test-profile');
      });

      expect(result.current.config.voting.category).toBe('test-category');
      expect(result.current.config.voting.profileId).toBe('test-profile');

      // Change voting type - should reset dependent fields
      act(() => {
        result.current.onVotingTypeChange(ApiWaveCreditType.Rep);
      });

      expect(result.current.config.voting.type).toBe(ApiWaveCreditType.Rep);
      expect(result.current.config.voting.category).toBeNull();
      expect(result.current.config.voting.profileId).toBeNull();
      expect(result.current.config.voting.timeWeighted).toEqual({
        enabled: false,
        averagingInterval: 24,
        averagingIntervalUnit: 'hours',
      }); // Should preserve timeWeighted
    });

    it('should update category', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onCategoryChange('art-category');
      });

      expect(result.current.config.voting.category).toBe('art-category');
    });

    it('should update profile ID', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onProfileIdChange('profile-456');
      });

      expect(result.current.config.voting.profileId).toBe('profile-456');
    });

    it('should update time weighted voting settings', () => {
      const { result } = renderHook(() => useWaveConfig());

      const newTimeWeighted = {
        enabled: true,
        averagingInterval: 72,
        averagingIntervalUnit: 'hours' as const,
      };

      act(() => {
        result.current.onTimeWeightedVotingChange(newTimeWeighted);
      });

      expect(result.current.config.voting.timeWeighted).toEqual(newTimeWeighted);
    });
  });

  describe('Approval Configuration', () => {
    it('should update approval threshold', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onThresholdChange(75);
      });

      expect(result.current.config.approval.threshold).toBe(75);
    });

    it('should update threshold time', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onThresholdTimeChange(86400000); // 24 hours in ms
      });

      expect(result.current.config.approval.thresholdTimeMs).toBe(86400000);
    });
  });

  describe('Chat Configuration', () => {
    it('should update chat enabled status', () => {
      const { result } = renderHook(() => useWaveConfig());

      expect(result.current.config.chat.enabled).toBe(true);

      act(() => {
        result.current.onChatEnabledChange(false);
      });

      expect(result.current.config.chat.enabled).toBe(false);
    });
  });

  describe('Step Navigation', () => {
    it('should change step when moving backward without validation', () => {
      const { result } = renderHook(() => useWaveConfig());

      act(() => {
        result.current.onStep({
          step: CreateWaveStep.GROUPS,
          direction: 'backward',
        });
      });

      expect(result.current.step).toBe(CreateWaveStep.GROUPS);
      expect(result.current.errors).toEqual([]);
      expect(result.current.selectedOutcomeType).toBeNull();
      expect(mockGetCreateWaveValidationErrors).not.toHaveBeenCalled();
    });

    it('should change step when moving forward with no validation errors', () => {
      const { result } = renderHook(() => useWaveConfig());

      mockGetCreateWaveValidationErrors.mockReturnValue([]);

      act(() => {
        result.current.onStep({
          step: CreateWaveStep.GROUPS,
          direction: 'forward',
        });
      });

      expect(result.current.step).toBe(CreateWaveStep.GROUPS);
      expect(result.current.errors).toEqual([]);
      expect(result.current.selectedOutcomeType).toBeNull();
      expect(mockGetCreateWaveValidationErrors).toHaveBeenCalledWith({
        config: result.current.config,
        step: CreateWaveStep.OVERVIEW,
      });
    });

    it('should not change step when validation errors exist', () => {
      const { result } = renderHook(() => useWaveConfig());

      const validationErrors = [createWaveValidation.CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED];
      mockGetCreateWaveValidationErrors.mockReturnValue(validationErrors);

      act(() => {
        result.current.onStep({
          step: CreateWaveStep.GROUPS,
          direction: 'forward',
        });
      });

      expect(result.current.step).toBe(CreateWaveStep.OVERVIEW); // Should not change
      expect(result.current.errors).toEqual(validationErrors);
    });
  });

  describe('Outcome Type Management', () => {
    it('should update selected outcome type and clear errors', () => {
      const { result } = renderHook(() => useWaveConfig());

      // First set some errors
      act(() => {
        mockGetCreateWaveValidationErrors.mockReturnValue([createWaveValidation.CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED]);
        result.current.onStep({
          step: CreateWaveStep.GROUPS,
          direction: 'forward',
        });
      });

      expect(result.current.errors).toHaveLength(1);

      // Change outcome type - should clear errors
      act(() => {
        result.current.onOutcomeTypeChange(CreateWaveOutcomeType.NIC);
      });

      expect(result.current.selectedOutcomeType).toBe(CreateWaveOutcomeType.NIC);
      expect(result.current.errors).toEqual([]);
    });

    it('should clear selected outcome type', () => {
      const { result } = renderHook(() => useWaveConfig());

      // First set an outcome type
      act(() => {
        result.current.onOutcomeTypeChange(CreateWaveOutcomeType.REP);
      });

      expect(result.current.selectedOutcomeType).toBe(CreateWaveOutcomeType.REP);

      // Clear it
      act(() => {
        result.current.onOutcomeTypeChange(null);
      });

      expect(result.current.selectedOutcomeType).toBeNull();
    });
  });

  describe('End Date Config Management', () => {
    it('should reset endDateConfig when endDate is set to null', () => {
      const { result } = renderHook(() => useWaveConfig());

      // First set endDate to a value and endDateConfig
      act(() => {
        result.current.setDates({
          ...result.current.config.dates,
          endDate: 2000000,
        });
        result.current.setEndDateConfig({
          time: 3600,
          period: null,
        });
      });

      expect(result.current.endDateConfig.time).toBe(3600);

      // Set endDate to null - should reset endDateConfig
      act(() => {
        result.current.setDates({
          ...result.current.config.dates,
          endDate: null,
        });
      });

      expect(result.current.endDateConfig).toEqual({
        time: null,
        period: null,
      });
    });

    it('should not reset endDateConfig when endDate has a value', () => {
      const { result } = renderHook(() => useWaveConfig());

      // Set endDateConfig
      act(() => {
        result.current.setEndDateConfig({
          time: 3600,
          period: null,
        });
      });

      // Set endDate to a value - should not reset endDateConfig
      act(() => {
        result.current.setDates({
          ...result.current.config.dates,
          endDate: 2000000,
        });
      });

      expect(result.current.endDateConfig.time).toBe(3600);
    });

    it('should manually update endDateConfig', () => {
      const { result } = renderHook(() => useWaveConfig());

      const newEndDateConfig = {
        time: 7200,
        period: null,
      };

      act(() => {
        result.current.setEndDateConfig(newEndDateConfig);
      });

      expect(result.current.endDateConfig).toEqual(newEndDateConfig);
    });
  });

  describe('Error Management', () => {
    it('should clear errors when config changes', () => {
      const { result } = renderHook(() => useWaveConfig());

      // First set some errors via failed validation
      act(() => {
        mockGetCreateWaveValidationErrors.mockReturnValue([createWaveValidation.CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED]);
        result.current.onStep({
          step: CreateWaveStep.GROUPS,
          direction: 'forward',
        });
      });

      expect(result.current.errors).toHaveLength(1);

      // Change config - should clear errors
      act(() => {
        result.current.setDates({
          ...result.current.config.dates,
          endDate: 2000000,
        });
      });

      expect(result.current.errors).toEqual([]);
    });
  });

  describe('Direct Config Update', () => {
    it('should allow direct config updates via setConfig', () => {
      const { result } = renderHook(() => useWaveConfig());

      const newConfig = {
        ...result.current.config,
        overview: {
          type: ApiWaveType.Rank,
          name: 'Direct Update',
          image: new File([''], 'direct.jpg', { type: 'image/jpeg' }),
        },
      };

      act(() => {
        result.current.setConfig(newConfig);
      });

      expect(result.current.config.overview.name).toBe('Direct Update');
      expect(result.current.config.overview.type).toBe(ApiWaveType.Rank);
    });
  });
});