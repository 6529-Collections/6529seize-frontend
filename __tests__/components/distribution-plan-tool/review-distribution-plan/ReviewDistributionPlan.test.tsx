import React from 'react';
import { render, screen } from '@testing-library/react';
import ReviewDistributionPlan from '@/components/distribution-plan-tool/review-distribution-plan/ReviewDistributionPlan';
import { DistributionPlanToolStep } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

const mockHeader = jest.fn(() => <div data-testid="header" />);
const mockWrapper = jest.fn(({ children }: any) => <div data-testid="wrapper">{children}</div>);
const mockTable = jest.fn(() => <div data-testid="table" />);

jest.mock('@/components/distribution-plan-tool/common/StepHeader', () => (props: any) => (mockHeader as any)(props));
jest.mock('@/components/distribution-plan-tool/common/DistributionPlanStepWrapper', () => (props: any) => (mockWrapper as any)(props));
jest.mock('@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTable', () => (props: any) => (mockTable as any)(props));

describe('ReviewDistributionPlan', () => {
  it('renders header, wrapper and table with review step', () => {
    render(<ReviewDistributionPlan />);
    expect(mockHeader).toHaveBeenCalledWith({ step: DistributionPlanToolStep.REVIEW });
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });
});
