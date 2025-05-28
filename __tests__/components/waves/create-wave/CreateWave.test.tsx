// @ts-nocheck
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWave from '../../../../components/waves/create-wave/CreateWave';
import { AuthContext } from '../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../components/react-query-wrapper/ReactQueryWrapper';
import { ApiWaveType } from '../../../../generated/models/ApiWaveType';
import { ApiWaveCreditType } from '../../../../generated/models/ApiWaveCreditType';
import { ApiIdentity } from '../../../../generated/models/ApiIdentity';
import { createMockAuthContext } from '../../../utils/testContexts';
import { CreateWaveStep } from '../../../../types/waves.types';
import { useWaveConfig } from '../../../../components/waves/create-wave/hooks/useWaveConfig';

jest.mock('../../../../components/waves/create-wave/drops/CreateWaveDrops', () => () => <div data-testid='drops' />);
jest.mock('../../../../components/waves/create-wave/main-steps/CreateWavesMainSteps', () => () => <div data-testid='steps' />);
jest.mock('../../../../components/waves/create-wave/overview/CreateWaveOverview', () => () => <div data-testid='overview'>OVERVIEW</div>);
jest.mock('../../../../components/waves/create-wave/groups/CreateWaveGroups', () => () => <div data-testid='groups'>GROUPS</div>);
jest.mock('../../../../components/waves/create-wave/dates/CreateWaveDates', () => () => <div data-testid='dates'>DATES</div>);
jest.mock('../../../../components/waves/create-wave/outcomes/CreateWaveOutcomes', () => () => <div data-testid='outcomes'>OUTCOMES</div>);
jest.mock('../../../../components/waves/create-wave/voting/CreateWaveVoting', () => () => <div data-testid='voting'>VOTING</div>);
jest.mock('../../../../components/waves/create-wave/approval/CreateWaveApproval', () => () => <div data-testid='approval'>APPROVAL</div>);

jest.mock('../../../../components/waves/create-wave/description/CreateWaveDescription', () =>
  React.forwardRef(() => {
    return <div data-testid='description'>DESCRIPTION</div>;
  })
);

jest.mock('../../../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isIos: false, keyboardVisible: false }) }));
jest.mock('../../../../components/waves/create-wave/services/waveApiService', () => ({ useAddWaveMutation: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('../../../../components/waves/create-wave/utils/CreateWaveActions', () => (props: any) => (
  <button data-testid='next' onClick={() => props.setStep(CreateWaveStep.GROUPS, 'forward')}>next</button>
));

jest.mock('../../../../components/waves/create-wave/hooks/useWaveConfig');

const mockedUseWaveConfig = useWaveConfig as jest.MockedFunction<typeof useWaveConfig>;

function setup() {
  mockedUseWaveConfig.mockImplementation(() => {
    const [step, setStep] = React.useState(CreateWaveStep.OVERVIEW);
    const config = {
      overview: { type: ApiWaveType.Chat, name: '', image: null },
      groups: { canView: null, canDrop: null, canVote: null, canChat: null, admin: '1' },
      chat: { enabled: true },
      dates: { submissionStartDate: 0, votingStartDate: 0, endDate: null, firstDecisionTime: 0, subsequentDecisions: [], isRolling: false },
      drops: { noOfApplicationsAllowedPerParticipant: null, requiredTypes: [], requiredMetadata: [], terms: null, signatureRequired: false, adminCanDeleteDrops: false },
      voting: { type: ApiWaveCreditType.Tdh, category: null, profileId: null, timeWeighted: { enabled: false, averagingInterval: 24, averagingIntervalUnit: 'hours' } },
      outcomes: [],
      approval: { threshold: null, thresholdTimeMs: null },
    } as any;
    return {
      config,
      step,
      selectedOutcomeType: null,
      errors: [],
      groupsCache: {},
      setOverview: jest.fn(),
      setDates: jest.fn(),
      setDrops: jest.fn(),
      setOutcomes: jest.fn(),
      setDropsAdminCanDelete: jest.fn(),
      onStep: ({ step: s }: { step: CreateWaveStep; direction: 'forward' | 'backward' }) => setStep(s),
      onOutcomeTypeChange: jest.fn(),
      onGroupSelect: jest.fn(),
      onVotingTypeChange: jest.fn(),
      onCategoryChange: jest.fn(),
      onProfileIdChange: jest.fn(),
      onTimeWeightedVotingChange: jest.fn(),
      onThresholdChange: jest.fn(),
      onThresholdTimeChange: jest.fn(),
      onChatEnabledChange: jest.fn(),
    };
  });

  const auth = createMockAuthContext({ requestAuth: jest.fn(), connectedProfile: null });
  const query = { waitAndInvalidateDrops: jest.fn(), onWaveCreated: jest.fn() } as any;
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={query}>{children}</ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  return { Wrapper };
}

describe('CreateWave', () => {
  it('renders overview and navigates to groups', async () => {
    const { Wrapper } = setup();
    const user = userEvent.setup();
    render(<CreateWave profile={{} as ApiIdentity} onBack={jest.fn()} />, { wrapper: Wrapper });
    expect(screen.getByTestId('overview')).toBeInTheDocument();
    await user.click(screen.getByTestId('next'));
    expect(screen.getByTestId('groups')).toBeInTheDocument();
  });

  it('invokes onBack handler', async () => {
    const { Wrapper } = setup();
    const onBack = jest.fn();
    render(<CreateWave profile={{} as ApiIdentity} onBack={onBack} />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
