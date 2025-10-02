import userEvent from "@testing-library/user-event";
import { render, screen } from '@testing-library/react';
import React from 'react';
import FinalizeSnapshot from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/FinalizeSnapshot';

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalTitle', () => ({ title }: any) => <div data-testid="title">{title}</div>);
jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigMeta', () => ({ walletsCount }: any) => <div data-testid="meta">{walletsCount}</div>);
jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/snapshots-table/FinalizeSnapshotsTable', () => (props: any) => <div data-testid="table">{props.groupSnapshots.length}</div>);
jest.mock('@/components/distribution-plan-tool/common/DistributionPlanSecondaryText', () => ({ children }: any) => <div data-testid="secondary">{children}</div>);

describe('FinalizeSnapshot', () => {
  const baseProps = {
    onConfigureGroup: jest.fn(),
    onAddAnotherSnapshot: jest.fn(),
    onRemoveGroupSnapshot: jest.fn(),
    onStartAgain: jest.fn(),
    groupSnapshots: [{ groupSnapshotId: 'g1' }] as any,
    snapshots: [] as any,
    title: 'Title',
    uniqueWalletsCount: 1,
    isLoadingUniqueWalletsCount: false,
    onClose: jest.fn(),
    phases: [] as any,
  };

  it('calls onStartAgain when snapshots become empty', () => {
    const { rerender } = render(<FinalizeSnapshot {...baseProps} />);
    expect(baseProps.onStartAgain).not.toHaveBeenCalled();
    rerender(<FinalizeSnapshot {...baseProps} groupSnapshots={[]} />);
    expect(baseProps.onStartAgain).toHaveBeenCalled();
  });

  it('renders table and buttons', async () => {
    render(<FinalizeSnapshot {...baseProps} />);
    expect(screen.getByTestId('title')).toHaveTextContent('Title');
    expect(screen.getByTestId('table')).toHaveTextContent('1');
    await userEvent.click(screen.getByRole('button', { name: 'Add another snapshot' }));
    expect(baseProps.onAddAnotherSnapshot).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Configure Group' }));
    expect(baseProps.onConfigureGroup).toHaveBeenCalled();
  });
});
