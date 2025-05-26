import React from 'react';
import { render, screen } from '@testing-library/react';
import CreatePhases from '../../../../components/distribution-plan-tool/create-phases/CreatePhases';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { AllowlistOperationCode } from '../../../../components/allowlist-tool/allowlist-tool.types';

const defaultContext = {
  setStep: jest.fn(),
  operations: [],
} as any;

function renderWithCtx(ctx?: Partial<typeof defaultContext>) {
  return render(
    <DistributionPlanToolContext.Provider value={{ ...defaultContext, ...ctx }}>
      <CreatePhases />
    </DistributionPlanToolContext.Provider>
  );
}

describe('CreatePhases', () => {
  it('shows placeholder and hides next button when no phases', () => {
    renderWithCtx();
    expect(screen.getByText('No Phases Added')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
  });

  it('lists phases from operations and enables next step', () => {
    const operations = [
      {
        code: AllowlistOperationCode.ADD_PHASE,
        params: { id: 'p1', name: 'Phase 1', description: '' },
        allowlistId: '1',
        order: 1,
        createdAt: 0,
        hasRan: false,
      },
    ];

    renderWithCtx({ operations });

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Phase 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });
});
