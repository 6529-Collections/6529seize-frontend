import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import CreateSnapshotTableRowDownload from '@/components/distribution-plan-tool/create-snapshots/table/CreateSnapshotTableRowDownload';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiFetch } from '@/services/distribution-plan-api';

jest.mock('@/services/distribution-plan-api');

const distPlan = { id: '1' } as any;

const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <DistributionPlanToolContext.Provider value={{ distributionPlan: distPlan, setToasts: jest.fn() } as any}>
    {children}
  </DistributionPlanToolContext.Provider>
);

describe('CreateSnapshotTableRowDownload', () => {
  beforeEach(() => {
    (distributionPlanApiFetch as jest.Mock).mockResolvedValue({ success: true, data: [{ a: '1' }] });
    jest.spyOn(document, 'createElement');
    (global.URL as any).createObjectURL = jest.fn();
  });

  it('downloads json when button clicked', async () => {
    const { container } = render(<CreateSnapshotTableRowDownload tokenPoolId="tp1" />, { wrapper: Wrapper });
    const jsonBtn = container.querySelector('button');
    await act(async () => {
      fireEvent.click(jsonBtn!);
    });
    expect(distributionPlanApiFetch).toHaveBeenCalled();
  });

  it('downloads csv when csv button clicked', async () => {
    const { container } = render(<CreateSnapshotTableRowDownload tokenPoolId="tp1" />, { wrapper: Wrapper });
    const buttons = container.querySelectorAll('button');
    await act(async () => {
      fireEvent.click(buttons[1]);
    });
    expect(distributionPlanApiFetch).toHaveBeenCalled();
  });
});
