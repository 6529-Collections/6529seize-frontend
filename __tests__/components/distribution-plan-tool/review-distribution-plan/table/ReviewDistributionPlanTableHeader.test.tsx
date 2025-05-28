import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewDistributionPlanTableHeader from '../../../../../components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableHeader';
import { DistributionPlanToolContext } from '../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiFetch } from '../../../../../services/distribution-plan-api';

jest.mock('../../../../../services/distribution-plan-api', () => ({ distributionPlanApiFetch: jest.fn(async () => ({ success: true, data: [{ wallet: '0x', amount: 1, phaseId: 'p1', phaseComponentId: 'c1' }] })) }));

describe('ReviewDistributionPlanTableHeader', () => {
  const rows = [
    { phase: { id: 'p1', name: 'Phase' }, components: [{ id: 'c1', name: 'Comp' }] },
  ];
  const distributionPlan = { id: '123' } as any;

  it('fetches results on json button click', async () => {
    const createElement = jest.spyOn(document, 'createElement').mockReturnValue({ click: jest.fn() } as any);

    render(
      <DistributionPlanToolContext.Provider value={{ distributionPlan, setToasts: jest.fn() } as any}>
        <table><tbody><ReviewDistributionPlanTableHeader rows={rows} /></tbody></table>
      </DistributionPlanToolContext.Provider>
    );

    await userEvent.click(screen.getAllByRole('button')[0]);
    await waitFor(() => expect(distributionPlanApiFetch).toHaveBeenCalled());
    expect(createElement).toHaveBeenCalled();
    createElement.mockRestore();
  });
});
