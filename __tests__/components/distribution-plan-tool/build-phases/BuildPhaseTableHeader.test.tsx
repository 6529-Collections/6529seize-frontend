import BuildPhaseTableHeader from '@/components/distribution-plan-tool/build-phases/build-phase/table/BuildPhaseTableHeader';
import { render, screen } from '@testing-library/react';

describe('BuildPhaseTableHeader', () => {
  it('renders the expected column headers', () => {
    render(
      <table>
        <BuildPhaseTableHeader />
      </table>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Spots')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  });

  it('wrapper has table head styles', () => {
    const { container } = render(
      <table>
        <BuildPhaseTableHeader />
      </table>
    );
    const thead = container.querySelector('thead');
    expect(thead).toHaveClass('tw-bg-iron-800');
  });
});
