import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenCollectionProvenance from '@/components/nextGen/collections/collectionParts/NextGenCollectionProvenance';
import type { NextGenCollection, NextGenLog } from '@/entities/INextgen';

jest.mock('next/image', () => ({ __esModule: true, default: (p:any) => <img {...p} /> }));
jest.mock('@/services/api/common-api', () => ({ commonApiFetch: jest.fn() }));
jest.mock('@/components/latest-activity/LatestActivityRow', () => (props: any) => (
  <tr
    data-testid="activity-row"
    data-show-nft-identity={props.showNftIdentity ? 'true' : 'false'}
    data-collection-id={props.nextgen_collection?.id}
  >
    <td>{props.tr.token_id}</td>
  </tr>
));
jest.mock('@/components/pagination/Pagination', () => (props: any) => (
  <button data-testid="page" onClick={() => props.setPage(props.page + 1)}>next</button>
));
const { commonApiFetch } = require('@/services/api/common-api');
const collection: NextGenCollection = { id: 1, name: 'Coll' } as any;
const log: NextGenLog = { id:1, block_timestamp:1, log:'test', heading:'H', transaction:'0x', collection_id:1, from_address:'0x', to_address:'0x', from_display:'', to_display:'', value:0, royalties:0, gas:0, gas_price:0, gas_gwei:0 } as any;

function setup(response = { count:25, page:1, next:null, data:[log] }) {
  (commonApiFetch as jest.Mock).mockResolvedValue(response);
  return render(<NextGenCollectionProvenance collection={collection} />);
}

describe('NextGenCollectionProvenance', () => {
  beforeEach(() => jest.clearAllMocks());

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: jest.fn(), configurable: true });
  });
  it('fetches logs and handles pagination', async () => {
    setup();
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: `nextgen/collections/1/logs?page_size=20&page=1` });
    await screen.findByText('test');
    const btn = screen.getByTestId('page');
    (commonApiFetch as jest.Mock).mockResolvedValue({ count:25, page:2, next:null, data:[log] });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(commonApiFetch).toHaveBeenLastCalledWith({ endpoint: `nextgen/collections/1/logs?page_size=20&page=2` });
    });
  });

  it('renders token events with the revised activity row and NFT identity', async () => {
    setup({
      count: 1,
      page: 1,
      next: null,
      data: [{ ...log, token_id: 10000000005 }],
    });

    const activityRow = await screen.findByTestId('activity-row');
    expect(activityRow).toHaveAttribute('data-show-nft-identity', 'true');
    expect(activityRow).toHaveAttribute('data-collection-id', '1');
    expect(activityRow).toHaveTextContent('10000000005');
  });

  it('centers pagination like the NFT activity page', async () => {
    setup();

    const pagination = await screen.findByTestId('page');
    expect(pagination.parentElement).toHaveClass('tw-text-center');
    expect(pagination.parentElement).not.toHaveClass('tw-flex');
  });
});
