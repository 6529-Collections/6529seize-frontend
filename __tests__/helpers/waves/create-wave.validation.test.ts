import { getCreateWaveValidationErrors, CREATE_WAVE_VALIDATION_ERROR } from '../../../helpers/waves/create-wave.validation';
import { ApiWaveType } from '../../../generated/models/ApiWaveType';
import { ApiWaveCreditType } from '../../../generated/models/ApiWaveCreditType';
import { CreateWaveStep } from '../../../types/waves.types';

describe('create-wave.validation', () => {
  const baseConfig: any = {
    overview: { type: ApiWaveType.Rank, name: 'name', image: null },
    groups: { canView: null, canDrop: null, canVote: null, canChat: null, admin: null },
    dates: { submissionStartDate: 1, votingStartDate: 1, endDate: 2, firstDecisionTime: 0, subsequentDecisions: [], isRolling: false },
    drops: { noOfApplicationsAllowedPerParticipant: null, requiredTypes: [], requiredMetadata: [], terms: null, signatureRequired: false, adminCanDeleteDrops: false },
    chat: { enabled: true },
    voting: { type: ApiWaveCreditType.Rep, category: 'cat', profileId: 'id', timeWeighted: { enabled: false, averagingInterval: 10, averagingIntervalUnit: 'minutes' } },
    outcomes: [{ id: 1 }],
    approval: { threshold: 1, thresholdTimeMs: 1 },
  };

  it('validates overview name required', () => {
    const config = { ...baseConfig, overview: { ...baseConfig.overview, name: '' } };
    const errors = getCreateWaveValidationErrors({ step: CreateWaveStep.OVERVIEW, config });
    expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED);
  });

  it('requires end date for rank waves', () => {
    const config = { ...baseConfig, dates: { ...baseConfig.dates, endDate: null } };
    const errors = getCreateWaveValidationErrors({ step: CreateWaveStep.DATES, config });
    expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED);
  });

  it('chat waves cannot have voting', () => {
    const chatConfig = { ...baseConfig, overview: { type: ApiWaveType.Chat, name: 'n', image: null }, voting: { type: ApiWaveCreditType.Rep, category: 'c', profileId: 'p', timeWeighted: { enabled: false, averagingInterval: 5, averagingIntervalUnit: 'minutes' } } };
    const errors = getCreateWaveValidationErrors({ step: CreateWaveStep.VOTING, config: chatConfig });
    expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING);
  });

  it('approval threshold required for approve waves', () => {
    const approveConfig = { ...baseConfig, overview: { type: ApiWaveType.Approve, name: 'n', image: null }, approval: { threshold: null, thresholdTimeMs: null } };
    const errors = getCreateWaveValidationErrors({ step: CreateWaveStep.APPROVAL, config: approveConfig });
    expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED);
  });

  it('detects duplicate required metadata', () => {
    const drops = { ...baseConfig.drops, requiredMetadata: [{ key: 'a', type: 't' }, { key: 'a', type: 't2' }] };
    const config = { ...baseConfig, drops };
    const errors = getCreateWaveValidationErrors({ step: CreateWaveStep.DROPS, config });
    expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_NON_UNIQUE);
  });
});

