import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DistributionPlanNextStepBtn from '@/components/distribution-plan-tool/common/DistributionPlanNextStepBtn';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

function renderBtn(
  props: any,
  ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>,
) {
  const runOperations = jest.fn();
  const contextValue = { runOperations, ...(ctx || {}) } as any;
  const onNextStep = jest.fn();
  render(
    <DistributionPlanToolContext.Provider value={contextValue}>
      <DistributionPlanNextStepBtn {...props} onNextStep={onNextStep} />
    </DistributionPlanToolContext.Provider>
  );
  return { runOperations, onNextStep };
}

describe('DistributionPlanNextStepBtn', () => {
  it('triggers onNextStep when Skip button clicked', async () => {
    const { onNextStep } = renderBtn({ showRunAnalysisBtn: false, showNextBtn: false, showSkipBtn: true, loading: false });
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onNextStep).toHaveBeenCalled();
  });

  it('calls runOperations from context when Run analysis clicked', async () => {
    const { runOperations } = renderBtn({ showRunAnalysisBtn: true, showNextBtn: false, showSkipBtn: false, loading: false });
    await userEvent.click(screen.getByRole('button', { name: 'Run analysis' }));
    expect(runOperations).toHaveBeenCalled();
  });

  it('renders Next button using primary button and triggers onNextStep', async () => {
    const { onNextStep } = renderBtn({ showRunAnalysisBtn: false, showNextBtn: true, showSkipBtn: false, loading: false });
    const button = screen.getByRole('button', { name: 'Next' });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onNextStep).toHaveBeenCalled();
  });
});
