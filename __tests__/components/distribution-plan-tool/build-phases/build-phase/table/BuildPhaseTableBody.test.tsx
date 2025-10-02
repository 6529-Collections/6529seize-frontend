import React from 'react';
import { render, screen } from '@testing-library/react';
import BuildPhaseTableBody from '@/components/distribution-plan-tool/build-phases/build-phase/table/BuildPhaseTableBody';
import { BuildPhasesPhase } from '@/components/distribution-plan-tool/build-phases/BuildPhases';

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/table/BuildPhaseTableRow', () => ({ component }: any) => (
  <tr data-testid="mock-row">
    <td>{component.name}</td>
  </tr>
));

jest.mock('@/components/distribution-plan-tool/common/DistributionPlanTableBodyWrapper', () => ({ children }: any) => (
  <tbody data-testid="wrapper">{children}</tbody>
));

const phase: BuildPhasesPhase = {
  id: 'phase1',
  allowlistId: '1',
  name: 'Phase 1',
  description: 'desc',
  hasRan: false,
  order: 1,
  components: [
    {
      id: 'comp1',
      allowlistId: '1',
      name: 'Component 1',
      description: 'c1',
      spotsNotRan: false,
      spots: 5,
      order: 1,
    },
    {
      id: 'comp2',
      allowlistId: '1',
      name: 'Component 2',
      description: 'c2',
      spotsNotRan: true,
      spots: null,
      order: 2,
    },
  ],
};

describe('BuildPhaseTableBody', () => {
  it('renders a table row for each component', () => {
    render(
      <table>
        <BuildPhaseTableBody phase={phase} />
      </table>
    );
    const rows = screen.getAllByTestId('mock-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Component 1');
    expect(rows[1]).toHaveTextContent('Component 2');
  });
});
