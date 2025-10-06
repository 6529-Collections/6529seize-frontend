import React from 'react';
import { render, screen } from '@testing-library/react';
import BuildPhaseTable from '@/components/distribution-plan-tool/build-phases/build-phase/table/BuildPhaseTable';
import { BuildPhasesPhase } from '@/components/distribution-plan-tool/build-phases/BuildPhases';

jest.mock(
  '@/components/distribution-plan-tool/build-phases/build-phase/table/BuildPhaseTableHeader',
  () => () => <thead data-testid="header" />
);

const bodyMock = jest.fn(({ phase }: any) => <tbody data-testid="body">{phase.name}</tbody>);
jest.mock(
  '@/components/distribution-plan-tool/build-phases/build-phase/table/BuildPhaseTableBody',
  () => ({ phase }: any) => bodyMock({ phase })
);

jest.mock(
  '@/components/distribution-plan-tool/common/DistributionPlanTableWrapper',
  () => ({ children }: any) => <table data-testid="wrapper">{children}</table>
);

const phase: BuildPhasesPhase = {
  id: 'p1',
  allowlistId: '1',
  name: 'Phase Name',
  description: 'desc',
  hasRan: false,
  order: 1,
  components: [],
};

describe('BuildPhaseTable', () => {
  it('renders wrapper with header and body', () => {
    render(<BuildPhaseTable phase={phase} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('body')).toHaveTextContent('Phase Name');
    expect(bodyMock).toHaveBeenCalledWith({ phase });
  });
});
