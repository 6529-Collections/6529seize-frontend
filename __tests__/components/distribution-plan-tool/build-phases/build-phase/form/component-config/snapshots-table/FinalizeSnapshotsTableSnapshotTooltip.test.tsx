import { render, screen } from '@testing-library/react';
import React from 'react';
import FinalizeSnapshotsTableSnapshotTooltip from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableSnapshotTooltip';
import { Pool } from '@/components/allowlist-tool/allowlist-tool.types';

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableSnapshotTooltipDefaultSnapshot', () => (props: any) => <div data-testid="default">{props.snapshotId}</div>);
jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableSnapshotTooltipCustomSnapshot', () => (props: any) => <div data-testid="custom">{props.snapshotId}</div>);

describe('FinalizeSnapshotsTableSnapshotTooltip', () => {
  it('renders default snapshot tooltip', () => {
    render(<FinalizeSnapshotsTableSnapshotTooltip snapshotId="1" snapshotType={Pool.TOKEN_POOL} />);
    expect(screen.getByTestId('default')).toHaveTextContent('1');
  });

  it('renders custom snapshot tooltip', () => {
    render(<FinalizeSnapshotsTableSnapshotTooltip snapshotId="2" snapshotType={Pool.CUSTOM_TOKEN_POOL} />);
    expect(screen.getByTestId('custom')).toHaveTextContent('2');
  });

  it('renders empty div when missing data', () => {
    const { container } = render(<FinalizeSnapshotsTableSnapshotTooltip snapshotId={null} snapshotType={null} />);
    expect(container.querySelector('div')).toBeEmptyDOMElement();
  });
});

