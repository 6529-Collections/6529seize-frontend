import React from 'react';
import { render, screen } from '@testing-library/react';
import DistributionPlanToolPlansTable from '../../../../components/distribution-plan-tool/plans/DistributionPlanToolPlansTable';

const captured: any[] = [];
jest.mock('../../../../components/distribution-plan-tool/plans/DistributionPlanToolPlansTableItem', () => (props: any) => {
  captured.push(props);
  return <tr data-testid={`row-${props.plan.id}`} />;
});

describe('DistributionPlanToolPlansTable', () => {
  beforeEach(() => {
    captured.length = 0;
  });

  it('renders rows for each plan and forwards onDeleted', () => {
    const onDeleted = jest.fn();
    const plans = [
      { id: '1', name: 'P1', description: '', createdAt: 0 },
      { id: '2', name: 'P2', description: '', createdAt: 0 },
    ] as any;

    render(<DistributionPlanToolPlansTable plans={plans} onDeleted={onDeleted} />);

    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
    expect(captured).toHaveLength(2);
    captured[0].onDeleted('1');
    expect(onDeleted).toHaveBeenCalledWith('1');
  });
});
