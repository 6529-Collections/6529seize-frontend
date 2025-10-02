import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SnapshotExcludeOtherSnapshots from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/SnapshotExcludeOtherSnapshots';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { Pool } from '@/components/allowlist-tool/allowlist-tool.types';

jest.mock('@/components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple', () => ({
  __esModule: true,
  default: ({ options, selectedOptions, toggleSelectedOption }: any) => (
    <div>
      {options.map((o: any) => (
        <button key={o.value} onClick={() => toggleSelectedOption(o)}>{o.title}</button>
      ))}
      {selectedOptions.map((o: any) => (
        <span key={o.value}>{o.title}</span>
      ))}
    </div>
  )
}));

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigNextBtn', () => ({
  __esModule: true,
  default: ({ onNext, children }: any) => (
    <div>
      {children}
      <button onClick={onNext}>Next</button>
    </div>
  )
}));

describe('SnapshotExcludeOtherSnapshots', () => {
  it('selects snapshots and calls onNext', async () => {
    const snapshots = [
      { id: '1', name: 'A', poolType: Pool.TOKEN_POOL },
      { id: '2', name: 'B', poolType: Pool.WALLET_POOL }
    ];
    const config = { snapshotId: '1' } as any;
    const onNext = jest.fn();
    render(
      <DistributionPlanToolContext.Provider value={{ operations: [], distributionPlan: null, setToasts: jest.fn() } as any}>
        <SnapshotExcludeOtherSnapshots snapshots={snapshots} config={config} onSkip={() => {}} onSelectExcludeOtherSnapshots={onNext} title="t" onClose={() => {}} />
      </DistributionPlanToolContext.Provider>
    );
    await userEvent.click(screen.getByText('B'));
    await userEvent.click(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalledWith({ snapshotsToExclude: [{ snapshotId: '2', snapshotType: Pool.WALLET_POOL, extraWallets: [] }], uniqueWalletsCount: null });
  });
});
