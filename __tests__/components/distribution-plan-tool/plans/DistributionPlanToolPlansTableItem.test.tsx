import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DistributionPlanToolPlansTableItem from '../../../../components/distribution-plan-tool/plans/DistributionPlanToolPlansTableItem';
import { distributionPlanApiDelete } from '../../../../services/distribution-plan-api';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../services/distribution-plan-api');
jest.mock('../../../../components/allowlist-tool/common/AllowlistToolLoader', () => () => <div data-testid="loader" />);

const routerPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: routerPush });
const mockedDelete = distributionPlanApiDelete as jest.Mock;

const samplePlan = { id: 'p1', name: 'Plan', description: 'desc', createdAt: 1660000000000 } as any;
const onDeleted = jest.fn();

function renderItem() {
  return render(<table><tbody><DistributionPlanToolPlansTableItem plan={samplePlan} onDeleted={onDeleted} /></tbody></table>);
}

describe('DistributionPlanToolPlansTableItem', () => {
  beforeEach(() => {
    routerPush.mockClear();
    mockedDelete.mockReset();
    onDeleted.mockReset();
  });

  it('navigates to plan detail when row clicked', async () => {
    renderItem();
    const row = screen.getByText('Plan').closest('tr') as HTMLElement;
    await userEvent.click(row);
    expect(routerPush).toHaveBeenCalledWith('/emma/plans/p1');
  });

  it('calls delete api and onDeleted on success', async () => {
    mockedDelete.mockResolvedValue({ success: true });
    renderItem();
    const btn = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(btn);
    expect(mockedDelete).toHaveBeenCalledWith({ endpoint: '/allowlists/p1' });
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('p1'));
  });

  it('re-enables button on failure', async () => {
    mockedDelete.mockResolvedValue({ success: false });
    renderItem();
    const btn = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(btn);
    await waitFor(() => expect(mockedDelete).toHaveBeenCalled());
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
