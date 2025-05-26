import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateCustomSnapshotTable from '../../../../../components/distribution-plan-tool/create-custom-snapshots/table/CreateCustomSnapshotTable';
import { AllowlistCustomTokenPool } from '../../../../../components/allowlist-tool/allowlist-tool.types';

const snapshots: AllowlistCustomTokenPool[] = [
  { id: '1', allowlistId: 'a1', name: 'snap1', description: 'd1', walletsCount: 2, tokensCount: 5 },
  { id: '2', allowlistId: 'a2', name: 'snap2', description: 'd2', walletsCount: 3, tokensCount: 7 },
];

describe('CreateCustomSnapshotTable', () => {
  it('renders header labels', () => {
    render(<CreateCustomSnapshotTable customSnapshots={snapshots} />);
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /wallets/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /tokens/i })).toBeInTheDocument();
  });

  it('displays snapshot rows', () => {
    render(<CreateCustomSnapshotTable customSnapshots={snapshots} />);
    expect(screen.getByText('snap1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('snap2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
