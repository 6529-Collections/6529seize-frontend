import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateSnapshotTable from '@/components/distribution-plan-tool/create-snapshots/table/CreateSnapshotTable';
import type { CreateSnapshotSnapshot } from '@/components/distribution-plan-tool/create-snapshots/CreateSnapshots';

const mockCopy = jest.fn();

jest.mock('react-use', () => ({
  useCopyToClipboard: () => [null, mockCopy],
}));

const snapshots: CreateSnapshotSnapshot[] = [
  {
    id: '1',
    name: 'Snap1',
    description: 'desc',
    tokenIds: null,
    walletsCount: 2,
    tokensCount: 5,
    contract: '0x1234567890abcdef1234567890abcdef12345678',
    blockNo: 10,
    consolidateBlockNo: null,
    downloaderStatus: null,
  },
  {
    id: '2',
    name: 'Snap2',
    description: 'desc2',
    tokenIds: '1,2',
    walletsCount: 1,
    tokensCount: 2,
    contract: null,
    blockNo: null,
    consolidateBlockNo: null,
    downloaderStatus: null,
  },
];

describe('CreateSnapshotTable', () => {
  it('renders header labels', () => {
    render(<CreateSnapshotTable snapshots={snapshots} />);
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /contract number/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /block number/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /wallets/i })).toBeInTheDocument();
  });

  it('displays snapshot rows', () => {
    render(<CreateSnapshotTable snapshots={snapshots} />);
    expect(screen.getByText('Snap1')).toBeInTheDocument();
    expect(screen.getByText('Snap2')).toBeInTheDocument();
    // contract column shows truncated text
    expect(screen.getByText('0x12...5678')).toBeInTheDocument();
  });
});
