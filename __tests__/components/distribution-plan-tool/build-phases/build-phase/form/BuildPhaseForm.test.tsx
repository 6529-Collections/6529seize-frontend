import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BuildPhaseForm from '../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseForm';
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from '../../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { BuildPhasesPhase } from '../../../../../../components/distribution-plan-tool/build-phases/BuildPhases';

// Mock sub components to keep test focused
jest.mock('../../../../../../components/distribution-plan-tool/common/DistributionPlanAddOperationBtn', () => ({ children }: any) => (
  <button data-testid="submit-btn" type="submit">{children}</button>
));

const modalMock = jest.fn();
jest.mock('../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal', () => ({
  __esModule: true,
  default: (props: any) => {
    modalMock(props);
    return <div data-testid="config-modal" />;
  }
}));

jest.mock('../../../../../../components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper', () => ({
  __esModule: true,
  AllowlistToolModalSize: { X_LARGE: 'X_LARGE' },
  default: ({ showModal, onClose, children }: any) =>
    showModal ? (
      <div data-testid="modal">
        <button data-testid="close" onClick={onClose}>close</button>
        {children}
      </div>
    ) : null,
}));

jest.mock('@tippyjs/react', () => ({ children }: any) => <>{children}</>);

const defaultContext = {
  step: DistributionPlanToolStep.CREATE_PLAN,
  setStep: jest.fn(),
  fetching: false,
  distributionPlan: { id: 'id' } as any,
  runOperations: jest.fn(),
  setState: jest.fn(),
  operations: [],
  fetchOperations: jest.fn(),
  transferPools: [],
  setTransferPools: jest.fn(),
  tokenPools: [],
  setTokenPools: jest.fn(),
  customTokenPools: [],
  setCustomTokenPools: jest.fn(),
  phases: [],
  setPhases: jest.fn(),
  setToasts: jest.fn(),
};

const phase: BuildPhasesPhase = {
  id: 'p1',
  allowlistId: 'id',
  name: 'Phase 1',
  description: '',
  hasRan: false,
  order: 1,
  components: [],
};

function renderComponent(ctx?: Partial<typeof defaultContext>) {
  return render(
    <DistributionPlanToolContext.Provider value={{ ...defaultContext, ...ctx }}>
      <BuildPhaseForm selectedPhase={phase} phases={[phase]} />
    </DistributionPlanToolContext.Provider>
  );
}

beforeEach(() => {
  modalMock.mockClear();
});

describe('BuildPhaseForm', () => {
  it('updates form values and opens modal on submit', () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Group' } });
    fireEvent.change(inputs[1], { target: { value: 'Desc' } });

    fireEvent.click(screen.getByTestId('submit-btn'));

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(modalMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Group', description: 'Desc', selectedPhase: phase, phases: [phase] }));
  });

  it('resets form and closes modal on close', () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Group' } });
    fireEvent.change(inputs[1], { target: { value: 'Desc' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    fireEvent.click(screen.getByTestId('close'));

    expect(screen.queryByTestId('modal')).toBeNull();
    const finalInputs = screen.getAllByRole('textbox');
    expect((finalInputs[0] as HTMLInputElement).value).toBe('');
    expect((finalInputs[1] as HTMLInputElement).value).toBe('');
  });
});

