import React from 'react';
import { render, screen } from '@testing-library/react';
import BuildPhaseTableRow from '../../../../../../components/distribution-plan-tool/build-phases/build-phase/table/BuildPhaseTableRow';
import { BuildPhasesPhaseComponent } from '../../../../../../components/distribution-plan-tool/build-phases/BuildPhases';

jest.mock('../../../../../../components/distribution-plan-tool/common/DistributionPlanTableRowWrapper', () => ({ children }: any) => (
  <tr data-testid="wrapper">{children}</tr>
));

jest.mock('../../../../../../components/distribution-plan-tool/common/DistributionPlanDeleteOperationButton', () => ({ allowlistId, order }: any) => (
  <button data-testid="delete-btn">{allowlistId}-{order}</button>
));

describe('BuildPhaseTableRow', () => {
  const component: BuildPhasesPhaseComponent = {
    id: 'c1',
    allowlistId: 'a1',
    name: 'Comp',
    description: 'Desc',
    spotsNotRan: false,
    spots: 3,
    order: 2,
  };

  it('renders component info and delete button', () => {
    render(
      <table>
        <tbody>
          <BuildPhaseTableRow component={component} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Comp')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByTestId('delete-btn')).toHaveTextContent('a1-2');
  });

  it('shows N/A when spotsNotRan is true', () => {
    const modified = { ...component, spotsNotRan: true, spots: null };
    render(
      <table>
        <tbody>
          <BuildPhaseTableRow component={modified} />
        </tbody>
      </table>
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
