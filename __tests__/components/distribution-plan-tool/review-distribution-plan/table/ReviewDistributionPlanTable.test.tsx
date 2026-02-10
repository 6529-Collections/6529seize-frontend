import { render } from '@testing-library/react';
import React from 'react';
import ReviewDistributionPlanTable from '@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTable';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

const headerMock = jest.fn(() => <div data-testid="header" />);
const bodyMock = jest.fn(() => <div data-testid="body" />);
const footerMock = jest.fn(() => <div data-testid="footer" />);

jest.mock('components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableHeader', () => (props: any) => {
  headerMock(props);
  return <div data-testid="header" />;
});

jest.mock('components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableBody', () => (props: any) => {
  bodyMock(props);
  return <div data-testid="body" />;
});

jest.mock('components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooter', () => ({
  ReviewDistributionPlanTableSubscriptionFooter: (props: any) => {
    footerMock(props);
    return <div data-testid="footer" />;
  },
}));

jest.mock('components/distribution-plan-tool/common/DistributionPlanTableWrapper', () => ({ children }: any) => <div data-testid="wrapper">{children}</div>);

function setup() {
  const phases = [
    {
      id: 'p1',
      name: 'Phase 1',
      walletsCount: 1,
      components: [
        { id: 'c1', name: 'Comp1', description: 'd1', winnersWalletsCount: 1, winnersSpotsCount: 2 },
        { id: 'c2', name: 'Comp2', description: 'd2', winnersWalletsCount: 1, winnersSpotsCount: 3 },
      ],
    },
  ] as any;

  const contextValue = {
    phases,
    step: null,
    setStep: jest.fn(),
    fetching: false,
    distributionPlan: null,
    runOperations: jest.fn(),
    setState: jest.fn(),
    operations: [],
    fetchOperations: jest.fn(),
    transferPools: [],
    setTransferPools: jest.fn(),
    tokenPools: [],
    setTokenPools: jest.fn(),
    customTokenPools: [],
    setCustomTokenPools: jest.fn(),
    setPhases: jest.fn(),
    setToasts: jest.fn(),
  };

  render(
    <DistributionPlanToolContext.Provider value={contextValue}>
      <ReviewDistributionPlanTable />
    </DistributionPlanToolContext.Provider>
  );

  return { phases };
}

describe('ReviewDistributionPlanTable', () => {
  it('converts phases to rows and passes to children', () => {
    const { phases } = setup();
    // The component renders twice - first with empty rows, then after useEffect runs with actual data
    const lastCallIndex = headerMock.mock.calls.length - 1;
    const rows = headerMock.mock.calls[lastCallIndex][0]?.rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].phase.id).toBe(phases[0].id);
    expect(rows[0].phase.spotsCount).toBe(5);
    expect(rows[0].components).toHaveLength(2);
    expect(bodyMock.mock.calls[lastCallIndex][0]?.rows).toEqual(rows);
    expect(document.querySelector('[data-testid="wrapper"]')).toBeTruthy();
    expect(footerMock).toHaveBeenCalled();
  });
});
