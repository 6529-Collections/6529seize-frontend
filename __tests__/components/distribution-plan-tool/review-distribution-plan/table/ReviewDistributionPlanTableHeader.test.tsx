import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewDistributionPlanTableHeader from '@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableHeader';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiFetch } from '@/services/distribution-plan-api';

jest.mock('@/services/distribution-plan-api', () => ({ distributionPlanApiFetch: jest.fn(async () => ({ success: true, data: [{ wallet: '0x', amount: 1, phaseId: 'p1', phaseComponentId: 'c1' }] })) }));

// Mock URL.createObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
});

describe('ReviewDistributionPlanTableHeader', () => {
  const rows = [
    { phase: { id: 'p1', name: 'Phase' }, components: [{ id: 'c1', name: 'Comp' }] },
  ];
  const distributionPlan = { id: '123' } as any;

  it('fetches results on json button click', async () => {
    const originalCreateElement = document.createElement;
    const clickSpy = jest.fn();
    
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement.call(document, tagName) as HTMLAnchorElement;
        anchor.click = clickSpy;
        return anchor;
      }
      return originalCreateElement.call(document, tagName);
    });

    render(
      <DistributionPlanToolContext.Provider value={{ distributionPlan, setToasts: jest.fn() } as any}>
        <table><tbody><ReviewDistributionPlanTableHeader rows={rows} /></tbody></table>
      </DistributionPlanToolContext.Provider>
    );

    await userEvent.click(screen.getAllByRole('button')[0]);
    await waitFor(() => expect(distributionPlanApiFetch).toHaveBeenCalled());
    expect(document.createElement).toHaveBeenCalled();
    
    // Cleanup
    document.createElement = originalCreateElement;
  });
});
