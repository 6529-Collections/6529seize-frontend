import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepHeader from '@/components/distribution-plan-tool/common/StepHeader';
import { DistributionPlanToolStep, DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

function renderComponent(step: DistributionPlanToolStep, ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>) {
  const defaultCtx = {
    distributionPlan: { id: 'id1', name: 'Plan', description: 'Desc' },
    operations: [{ code: 'OP', params: { foo: 'bar' } }] as any,
    fetchOperations: jest.fn().mockResolvedValue(undefined),
  } as any;
  return {
    ...render(
      <DistributionPlanToolContext.Provider value={{ ...defaultCtx, ...ctx }}>
        <StepHeader step={step} title="Extra" description="More" />
      </DistributionPlanToolContext.Provider>
    ),
    fetchOperations: ctx?.fetchOperations || defaultCtx.fetchOperations,
  };
}

describe('StepHeader', () => {
  it('renders meta title and hides download when creating plan', () => {
    renderComponent(DistributionPlanToolStep.CREATE_PLAN);
    expect(screen.getByRole('heading', { name: /Distribution Plan Tool.*Extra/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download operations/i })).toBeNull();
  });

  it('downloads operations when button clicked', async () => {
    const createObjectURL = jest.fn().mockReturnValue('blob:url');
    Object.defineProperty(window.URL, 'createObjectURL', { value: createObjectURL });
    const fetchOperations = jest.fn().mockResolvedValue(undefined);
    const { container } = renderComponent(DistributionPlanToolStep.REVIEW, { fetchOperations });
    const link = document.createElement('a');
    // replace click with mock
    (link as any).click = jest.fn();
    const originalCreate = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag: any) => {
      return tag === 'a' ? link : originalCreate(tag);
    });
    const btn = screen.getByRole('button', { name: /download operations/i });
    await userEvent.click(btn);

    expect(fetchOperations).toHaveBeenCalledWith('id1');
    expect(link.click).toHaveBeenCalled();
  });
});
