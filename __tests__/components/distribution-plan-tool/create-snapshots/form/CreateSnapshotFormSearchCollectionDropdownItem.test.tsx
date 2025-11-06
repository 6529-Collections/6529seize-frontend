import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import CreateSnapshotFormSearchCollectionDropdownItem from '@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionDropdownItem';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';
import { distributionPlanApiFetch } from '@/services/distribution-plan-api';
import { createTestQueryClient } from '../../../../utils/reactQuery';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));

jest.mock('@/helpers/AllowlistToolHelpers', () => ({
  formatNumber: (n: number) => `f${n}`,
  truncateTextMiddle: (s: string) => s
}));

jest.mock('@/services/distribution-plan-api', () => ({
  distributionPlanApiFetch: jest.fn()
}));

const fetchMock = distributionPlanApiFetch as jest.Mock;

function renderItem(overrides: Partial<any> = {}) {
  const collection = {
    id: 'c1',
    address: '0xabc',
    name: 'Collection',
    tokenType: 'erc721',
    floorPrice: 1,
    imageUrl: 'img',
    description: null,
    allTimeVolume: 2,
    openseaVerified: false,
    ...overrides
  };
  const onCollection = jest.fn();
  const setToasts = jest.fn();
  const queryClient = createTestQueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <DistributionPlanToolContext.Provider value={{ setToasts } as any}>
        <table><tbody>
          <CreateSnapshotFormSearchCollectionDropdownItem collection={collection} onCollection={onCollection} />
        </tbody></table>
      </DistributionPlanToolContext.Provider>
    </QueryClientProvider>
  );
  return { collection, onCollection, setToasts };
}

describe('CreateSnapshotFormSearchCollectionDropdownItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders collection info', () => {
    renderItem({ openseaVerified: true });
    expect(screen.getByText('Collection')).toBeInTheDocument();
    // image has empty alt so it has presentation role
    expect(screen.getByRole('presentation')).toBeInTheDocument();
    expect(screen.getAllByText('f2')).toHaveLength(1); // volume
  });

  it('calls onCollection directly for normal collection', async () => {
    const { onCollection, collection } = renderItem();
    await userEvent.click(screen.getByRole('row'));
    expect(onCollection).toHaveBeenCalledWith({ name: collection.name, address: collection.address, tokenIds: null });
  });

  it('fetches token ids and passes them for sub collection', async () => {
    fetchMock.mockResolvedValueOnce({ success: true, data: { tokenIds: '1,2' } });
    const subId = `0x${'a'.repeat(40)}:sub`;
    const { onCollection, collection } = renderItem({ id: subId });
    await userEvent.click(screen.getByRole('row'));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/other/contract-token-ids-as-string/${subId}`
      )
    );
    expect(onCollection).toHaveBeenCalledWith({ name: collection.name, address: collection.address, tokenIds: '1,2' });
  });

  it('does not trigger an extra toast when token id fetch fails', async () => {
    fetchMock.mockResolvedValueOnce({ success: false, data: null });
    const subId = `0x${'a'.repeat(40)}:sub`;
    const { setToasts } = renderItem({ id: subId });
    await userEvent.click(screen.getByRole('row'));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/other/contract-token-ids-as-string/${subId}`
      )
    );
    expect(setToasts).not.toHaveBeenCalled();
  });
});
