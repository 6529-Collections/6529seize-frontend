import { render, screen } from '@testing-library/react';
import React from 'react';
import FinalizeSnapshotsTableExcludedComponentsTooltip from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableExcludedComponentsTooltip';

const phases = [
  {
    name: 'Phase 1',
    components: [
      { id: 'c1', name: 'Comp1' },
      { id: 'c2', name: 'Comp2' },
    ],
  },
  {
    name: 'Phase 2',
    components: [
      { id: 'c3', name: 'Comp3' },
    ],
  },
] as any;

it('lists excluded components with their phases', () => {
  render(
    <FinalizeSnapshotsTableExcludedComponentsTooltip phases={phases} excludedComponents={['c2','c3']} />
  );
  expect(screen.getByText('Comp2')).toBeInTheDocument();
  expect(screen.getByText('Phase 1')).toBeInTheDocument();
  expect(screen.getByText('Comp3')).toBeInTheDocument();
  expect(screen.getByText('Phase 2')).toBeInTheDocument();
});
