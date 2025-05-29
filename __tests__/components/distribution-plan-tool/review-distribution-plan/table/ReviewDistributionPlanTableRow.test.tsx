import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ReviewDistributionPlanTableRow from 'components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableRow';
import { DistributionPlanToolContext } from 'components/distribution-plan-tool/DistributionPlanToolContext';
import { ReviewDistributionPlanTableItemType } from 'components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTable';
import { distributionPlanApiFetch } from 'services/distribution-plan-api';

jest.mock('services/distribution-plan-api', () => ({
  distributionPlanApiFetch: jest.fn(async () => ({ success: true, data: [{ wallet: '0x1', amount: 1, phaseId: 'p1', phaseComponentId: 'c1' }] }))
}));

jest.mock('components/distribution-plan-tool/common/DistributionPlanTableRowWrapper', () => ({ children }: any) => <tr data-testid="wrapper">{children}</tr>);
jest.mock('components/distribution-plan-tool/common/RoundedJsonIconButton', () => (props: any) => <button data-testid="json-btn" onClick={props.onClick} />);
jest.mock('components/distribution-plan-tool/common/RoundedCsvIconButton', () => (props: any) => <button data-testid="csv-btn" onClick={props.onClick} />);
jest.mock('components/distribution-plan-tool/common/RoundedManifoldIconButton', () => (props: any) => <button data-testid="manifold-btn" onClick={props.onClick} />);
jest.mock('components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription', () => ({ SubscriptionLinks: () => <div /> }));

Object.defineProperty(global, 'URL', {
  value: { 
    createObjectURL: jest.fn(() => 'blob:url'),
    revokeObjectURL: jest.fn()
  }
});

afterEach(() => jest.clearAllMocks());

function setup() {
  const item = { id: 'p1', type: ReviewDistributionPlanTableItemType.PHASE, phaseId: 'p1', componentId: null, name: 'Phase 1', description: 'desc', walletsCount: 1, spotsCount: 1 } as any;
  const rows = [{ phase: item, components: [] }];
  const distributionPlan = { id: '123' } as any;
  return render(
    <DistributionPlanToolContext.Provider value={{ distributionPlan } as any}>
      <table><tbody><ReviewDistributionPlanTableRow item={item} rows={rows} /></tbody></table>
    </DistributionPlanToolContext.Provider>
  );
}

describe('ReviewDistributionPlanTableRow', () => {
  it('fetches json results and downloads file', async () => {
    const origCreate = document.createElement;
    const click = jest.fn();
    let createdAnchor: HTMLAnchorElement;
    document.createElement = jest.fn((tag: string) => {
      if (tag === 'a') {
        const a = origCreate.call(document, tag) as HTMLAnchorElement;
        a.click = click;
        createdAnchor = a;
        return a;
      }
      return origCreate.call(document, tag);
    });
    setup();
    await userEvent.click(screen.getByTestId('json-btn'));
    await waitFor(() => expect(distributionPlanApiFetch).toHaveBeenCalled());
    expect(click).toHaveBeenCalled();
    expect(createdAnchor!.download).toMatch(/phase-1\.json$/);
    document.createElement = origCreate;
  });
});
