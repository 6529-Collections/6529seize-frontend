import React from 'react';
import { render, screen } from '@testing-library/react';
import CreatePhasesTable from '@/components/distribution-plan-tool/create-phases/table/CreatePhasesTable';

// Mock child components to simplify rendering and assert props
jest.mock('@/components/distribution-plan-tool/create-phases/table/CreatePhasesTableHeader', () => () => <thead data-testid="header" />);
jest.mock('@/components/distribution-plan-tool/create-phases/table/CreatePhasesTableBody', () => ({ phases }: any) => (
  <tbody data-testid="body">{phases.map((p: any) => (<tr key={p.id}><td>{p.name}</td></tr>))}</tbody>
));

describe('CreatePhasesTable', () => {
  it('renders header and body within wrapper', () => {
    const phases = [
      { id: '1', allowlistId: 'a', name: 'Phase 1', order: 1 },
      { id: '2', allowlistId: 'a', name: 'Phase 2', order: 2 },
    ] as any[];
    const { container } = render(<CreatePhasesTable phases={phases} />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('body')).toBeInTheDocument();
    expect(screen.getByText('Phase 1')).toBeInTheDocument();
    expect(screen.getByText('Phase 2')).toBeInTheDocument();

    const wrapper = container.querySelector('div.tw-flow-root');
    expect(wrapper).toBeInTheDocument();
  });
});
