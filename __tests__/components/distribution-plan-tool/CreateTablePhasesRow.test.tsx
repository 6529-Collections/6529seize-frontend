import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateTablePhasesRow from '../../../components/distribution-plan-tool/create-phases/table/CreateTablePhasesRow';

jest.mock('../../../components/distribution-plan-tool/common/DistributionPlanTableRowWrapper', () => ({ children }: any) => (
  <tr data-testid="wrapper">{children}</tr>
));

jest.mock('../../../components/distribution-plan-tool/common/DistributionPlanDeleteOperationButton', () => ({ allowlistId, order }: any) => (
  <button data-testid="delete-btn">{allowlistId}-{order}</button>
));

describe('CreateTablePhasesRow', () => {
  const phase = { id: '1', allowlistId: 'a1', name: 'Phase 1', order: 3 } as any;

  it('renders phase name and delete button with props', () => {
    render(
      <table>
        <tbody>
          <CreateTablePhasesRow phase={phase} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByText('Phase 1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-btn')).toHaveTextContent('a1-3');
  });
});
