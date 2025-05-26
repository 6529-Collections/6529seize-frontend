import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DistributionPlanToolPlans from '../../../../components/distribution-plan-tool/plans/DistributionPlanToolPlans';
import { distributionPlanApiFetch } from '../../../../services/distribution-plan-api';

jest.mock('../../../../services/distribution-plan-api');

jest.mock('../../../../components/distribution-plan-tool/plans/DistributionPlanToolPlansLoading', () => () => <div data-testid="loading" />);
jest.mock('../../../../components/distribution-plan-tool/plans/DistributionPlanToolPlansNoPlans', () => () => <div data-testid="no-plans" />);

// Mock table component to inspect props and trigger onDeleted
const mockOnDeleted = jest.fn();
jest.mock('../../../../components/distribution-plan-tool/plans/DistributionPlanToolPlansTable', () => (props: any) => (
  <div data-testid="table">
    <span data-testid="count">{props.plans.length}</span>
    <button onClick={() => props.onDeleted(props.plans[0].id)} data-testid="delete-btn" />
  </div>
));

const mockedFetch = distributionPlanApiFetch as jest.Mock;

describe('DistributionPlanToolPlans', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('shows loader then no plans when none returned', async () => {
    mockedFetch.mockResolvedValue({ success: true, data: [] });
    render(<DistributionPlanToolPlans />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('no-plans')).toBeInTheDocument());
  });

  it('renders plans table and handles deletion', async () => {
    mockedFetch.mockResolvedValue({ success: true, data: [{ id: '1', name: 'plan', description: '', createdAt: 0 }] });
    render(<DistributionPlanToolPlans />);
    const table = await screen.findByTestId('table');
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    // simulate delete
    await userEvent.click(screen.getByTestId('delete-btn'));
    await waitFor(() => expect(screen.getByTestId('no-plans')).toBeInTheDocument());
  });
});
