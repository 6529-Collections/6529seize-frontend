import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenCollections from '../../../components/nextGen/collections/NextGenCollections';
import { fetchUrl } from '../../../services/6529api';

jest.mock('../../../services/6529api', () => ({
  fetchUrl: jest.fn(),
}));

jest.mock('../../../components/nextGen/collections/NextGenCollectionPreview', () => (props: any) => (
  <div data-testid="preview">{props.collection.name}</div>
));

jest.mock('../../../components/pagination/Pagination', () => (props: any) => (
  <div data-testid="pagination" onClick={() => props.setPage(props.page + 1)}>
    page {props.page}
  </div>
));

const fetchUrlMock = fetchUrl as jest.Mock;

function setup(mockData: any) {
  process.env.API_ENDPOINT = 'https://api.test';
  fetchUrlMock.mockResolvedValue(mockData);
  render(<NextGenCollections />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NextGenCollections', () => {
  it('displays returned collections', async () => {
    setup({ count: 1, data: [{ id: 1, name: 'Col1', artist: 'Alice', image: 'img' }] });
    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByTestId('preview')).toBeInTheDocument());
    expect(screen.getByTestId('preview')).toHaveTextContent('Col1');
  });

  it('shows no collections message when none returned', async () => {
    setup({ count: 0, data: [] });
    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('No collections found')).toBeInTheDocument();
  });

  it('fetches new results when status filter changes', async () => {
    // first two calls on mount return data
    fetchUrlMock.mockResolvedValueOnce({ count: 1, data: [{ id: 1, name: 'First', artist: 'A', image: 'img' }] });
    fetchUrlMock.mockResolvedValueOnce({ count: 1, data: [{ id: 1, name: 'First', artist: 'A', image: 'img' }] });
    // call after filter change
    fetchUrlMock.mockResolvedValueOnce({ count: 0, data: [] });

    process.env.API_ENDPOINT = 'https://api.test';
    render(<NextGenCollections />);

    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(2));

    await userEvent.click(screen.getByRole('button', { name: /Status:/i }));
    await userEvent.click(screen.getByText('LIVE'));

    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalledTimes(3));
    expect(fetchUrlMock).toHaveBeenLastCalledWith(
      'https://api.test/api/nextgen/collections?page_size=25&page=1&status=LIVE'
    );
    expect(screen.getByText('Status: LIVE')).toBeInTheDocument();
  });
});
