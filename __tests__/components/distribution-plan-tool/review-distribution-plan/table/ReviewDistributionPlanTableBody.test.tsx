import { render, screen } from '@testing-library/react';
import React from 'react';
import ReviewDistributionPlanTableBody from '@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableBody';

jest.mock('@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableRow', () => (props: any) => <div data-testid="row">{props.item.id}</div>);
jest.mock('@/components/distribution-plan-tool/common/DistributionPlanTableBodyWrapper', () => ({ children }: any) => <div data-testid="wrapper">{children}</div>);

describe('ReviewDistributionPlanTableBody', () => {
  it('flattens rows and renders items', () => {
    const rows = [
      { phase: { id: 'p1' }, components: [{ id: 'c1' }, { id: 'c2' }] },
      { phase: { id: 'p2' }, components: [{ id: 'c3' }] },
    ] as any;
    render(<ReviewDistributionPlanTableBody rows={rows} />);
    const items = screen.getAllByTestId('row');
    expect(items.map((el) => el.textContent)).toEqual(['p1', 'c1', 'c2', 'p2', 'c3']);
  });
});

