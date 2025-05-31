import React from 'react';
import { render, screen } from '@testing-library/react';
import CreatePhasesTableBody from '../../../components/distribution-plan-tool/create-phases/table/CreatePhasesTableBody';

jest.mock('../../../components/distribution-plan-tool/create-phases/table/CreateTablePhasesRow', () => ({ phase }: any) => (
  <tr data-testid="row">
    <td>{phase.name}</td>
  </tr>
));
jest.mock('../../../components/distribution-plan-tool/common/DistributionPlanTableBodyWrapper', () => ({ children }: any) => <tbody data-testid="wrapper">{children}</tbody>);

describe('CreatePhasesTableBody', () => {
  it('renders a row for each phase', () => {
    const phases = [
      { id: '1', allowlistId: 'a', name: 'p1', order: 1 },
      { id: '2', allowlistId: 'a', name: 'p2', order: 2 },
    ] as any[];
    render(<table><CreatePhasesTableBody phases={phases} /></table>);
    const rows = screen.getAllByTestId('row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('p1');
    expect(rows[1]).toHaveTextContent('p2');
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
  });
});
