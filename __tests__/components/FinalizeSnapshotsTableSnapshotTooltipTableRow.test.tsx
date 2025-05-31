import { render, screen } from '@testing-library/react';
import FinalizeSnapshotsTableSnapshotTooltipTableRow from '../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTableSnapshotTooltipTableRow';

describe('FinalizeSnapshotsTableSnapshotTooltipTableRow', () => {
  it('displays provided name and value', () => {
    render(<FinalizeSnapshotsTableSnapshotTooltipTableRow name="Address" value="0xabc" />);
    expect(screen.getByText('Address:')).toBeInTheDocument();
    expect(screen.getByText('0xabc')).toBeInTheDocument();
  });

  it('handles long values gracefully', () => {
    const long = 'x'.repeat(50);
    render(<FinalizeSnapshotsTableSnapshotTooltipTableRow name="Long" value={long} />);
    expect(screen.getByText(long)).toBeInTheDocument();
  });
});
