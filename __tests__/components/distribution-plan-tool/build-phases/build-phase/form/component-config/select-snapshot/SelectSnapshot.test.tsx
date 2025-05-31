import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SelectSnapshot from '../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshot';
import { DistributionPlanToolContext } from '../../../../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { Pool } from '../../../../../../../../components/allowlist-tool/allowlist-tool.types';

jest.mock('../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalTitle', () => ({ __esModule: true, default: ({ title }: any) => <div data-testid="title">{title}</div> }));
jest.mock('../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigMeta', () => ({ __esModule: true, default: ({ walletsCount }: any) => <div data-testid="meta">{String(walletsCount)}</div> }));
jest.mock('../../../../../../../../components/distribution-plan-tool/common/DistributionPlanSecondaryText', () => ({ __esModule: true, default: ({ children }: any) => <div data-testid="secondary">{children}</div> }));
jest.mock('../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshotDropdown', () => ({ __esModule: true, default: ({ setSelectedSnapshot }: any) => <button onClick={() => setSelectedSnapshot({ id: 's1', name: 'Snap', poolType: Pool.TOKEN_POOL, walletsCount: 2 })} data-testid="dropdown">dropdown</button> }));
jest.mock('../../../../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigNextBtn', () => ({ __esModule: true, default: ({ onNext, children }: any) => <button onClick={onNext} data-testid="next">next{children}</button> }));

const Wrapper: React.FC<{children: React.ReactNode, ctx?: any}> = ({ children, ctx }) => (
  <DistributionPlanToolContext.Provider value={{ setToasts: jest.fn(), ...(ctx || {}) } as any}>{children}</DistributionPlanToolContext.Provider>
);

it('shows error toast when no snapshot selected', () => {
  const setToasts = jest.fn();
  render(
    <Wrapper ctx={{ setToasts }}>
      <SelectSnapshot snapshots={[]} title="T" onClose={jest.fn()} onSelectSnapshot={jest.fn()} isLoading={false} />
    </Wrapper>
  );
  fireEvent.click(screen.getByTestId('next'));
  expect(setToasts).toHaveBeenCalled();
});

it('returns selected snapshot on next', () => {
  const onSelect = jest.fn();
  render(
    <Wrapper>
      <SelectSnapshot snapshots={[{ id: 's1', name: 'Snap', poolType: Pool.TOKEN_POOL, walletsCount: 2 } as any]} title="T" onClose={jest.fn()} onSelectSnapshot={onSelect} isLoading={false} />
    </Wrapper>
  );
  fireEvent.click(screen.getByTestId('dropdown'));
  fireEvent.click(screen.getByTestId('next'));
  expect(onSelect).toHaveBeenCalledWith({ snapshotId: 's1', snapshotType: Pool.TOKEN_POOL, uniqueWalletsCount: 2 });
});
