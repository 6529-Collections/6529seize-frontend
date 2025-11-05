import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SnapshotExcludeComponentWinners from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/SnapshotExcludeComponentWinners';
import type { PhaseGroupSnapshotConfig } from '@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigNextBtn', () => ({
  __esModule: true,
  default: (props: any) => <button onClick={props.onNext} data-testid="next">next{props.children}</button>,
}));

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalTitle', () => ({
  __esModule: true,
  default: ({ title }: any) => <div>{title}</div>,
}));

jest.mock('@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigMeta', () => ({
  __esModule: true,
  default: () => <div data-testid="meta" />,
}));

jest.mock('@/components/allowlist-tool/common/select-menu-multiple/AllowlistToolSelectMenuMultiple', () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      {props.options.map((o: any) => (
        <button key={o.value} onClick={() => props.toggleSelectedOption(o)} data-testid={`opt-${o.value}`}>{o.title}</button>
      ))}
    </div>
  ),
}));

const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <DistributionPlanToolContext.Provider value={{ setToasts: jest.fn() } as any}>{children}</DistributionPlanToolContext.Provider>
);

const phases = [
  { id: 'p1', name: 'Phase1', components: [{ id: 'c1', name: 'Comp1' }] },
] as any;

const baseConfig: PhaseGroupSnapshotConfig = {
  groupSnapshotId: 'g1',
  snapshotId: 's1',
  snapshotType: null,
  snapshotSchema: null,
  excludeComponentWinners: [],
  excludeSnapshots: [],
  topHoldersFilter: null,
  tokenIds: null,
  uniqueWalletsCount: null,
};

test('shows error toast when nothing selected', () => {
  const setToasts = jest.fn();
  render(
    <DistributionPlanToolContext.Provider value={{ setToasts } as any}>
      <SnapshotExcludeComponentWinners config={baseConfig} phases={phases} onNextStep={jest.fn()} onSelectExcludeComponentWinners={jest.fn()} title="t" onClose={jest.fn()} />
    </DistributionPlanToolContext.Provider>
  );
  fireEvent.click(screen.getByTestId('next'));
  expect(setToasts).toHaveBeenCalled();
});

test('returns selected component ids on next', () => {
  const onSelect = jest.fn();
  const config: PhaseGroupSnapshotConfig = {
    ...baseConfig,
    uniqueWalletsCount: 42,
  };
  render(
    <SnapshotExcludeComponentWinners config={config} phases={phases} onNextStep={jest.fn()} onSelectExcludeComponentWinners={onSelect} title="t" onClose={jest.fn()} />, { wrapper: Wrapper }
  );
  fireEvent.click(screen.getByTestId('opt-c1'));
  fireEvent.click(screen.getByTestId('next'));
  expect(onSelect).toHaveBeenCalledWith({ excludeComponentWinners: ['c1'], uniqueWalletsCount: 42 });
});
