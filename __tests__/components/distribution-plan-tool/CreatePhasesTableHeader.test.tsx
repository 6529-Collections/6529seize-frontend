import React from 'react';
import { render, screen } from '@testing-library/react';
import CreatePhasesTableHeader from '@/components/distribution-plan-tool/create-phases/table/CreatePhasesTableHeader';

describe('CreatePhasesTableHeader', () => {
  it('renders expected column headers', () => {
    render(
      <table>
        <CreatePhasesTableHeader />
      </table>
    );
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  });

  it('applies wrapper styles', () => {
    const { container } = render(
      <table>
        <CreatePhasesTableHeader />
      </table>
    );
    const thead = container.querySelector('thead');
    expect(thead).toHaveClass('tw-bg-neutral-800');
  });
});
