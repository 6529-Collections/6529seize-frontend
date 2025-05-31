import { render, screen } from '@testing-library/react';
import DistributionPlanToolPage from '../../../components/distribution-plan-tool/DistributionPlanToolPage';
import { DistributionPlanToolContext, DistributionPlanToolStep } from '../../../components/distribution-plan-tool/DistributionPlanToolContext';

jest.mock('../../../components/distribution-plan-tool/create-plan/CreatePlan', () => () => <div data-testid="CreatePlan" />);
jest.mock('../../../components/distribution-plan-tool/create-snapshots/CreateSnapshots', () => () => <div data-testid="CreateSnapshots" />);
jest.mock('../../../components/distribution-plan-tool/create-custom-snapshots/CreateCustomSnapshots', () => () => <div data-testid="CreateCustomSnapshots" />);
jest.mock('../../../components/distribution-plan-tool/create-phases/CreatePhases', () => () => <div data-testid="CreatePhases" />);
jest.mock('../../../components/distribution-plan-tool/build-phases/BuildPhases', () => () => <div data-testid="BuildPhases" />);
jest.mock('../../../components/distribution-plan-tool/map-delegations/MapDelegations', () => () => <div data-testid="MapDelegations" />);
jest.mock('../../../components/distribution-plan-tool/review-distribution-plan/ReviewDistributionPlan', () => () => <div data-testid="ReviewDistributionPlan" />);

function renderWithStep(step: DistributionPlanToolStep) {
  return render(
    <DistributionPlanToolContext.Provider value={{ step } as any}>
      <DistributionPlanToolPage />
    </DistributionPlanToolContext.Provider>
  );
}

describe('DistributionPlanToolPage', () => {
  it('renders create plan step', () => {
    renderWithStep(DistributionPlanToolStep.CREATE_PLAN);
    expect(screen.getByTestId('CreatePlan')).toBeInTheDocument();
  });

  it('renders create snapshots step', () => {
    renderWithStep(DistributionPlanToolStep.CREATE_SNAPSHOTS);
    expect(screen.getByTestId('CreateSnapshots')).toBeInTheDocument();
  });

  it('renders review step', () => {
    renderWithStep(DistributionPlanToolStep.REVIEW);
    expect(screen.getByTestId('ReviewDistributionPlan')).toBeInTheDocument();
  });
});
