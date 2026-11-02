import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenCollectionArt from '@/components/nextGen/collections/collectionParts/NextGenCollectionArt';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/components/nextGen/collections/NextGenTokenList', () => (props: any) => (
  <div data-testid="token-list" data-limit={String(props.limit)}>
    <button type="button" onClick={() => props.setLoadFailed?.(true)}>
      fail list
    </button>
  </div>
));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (p: any) => <svg {...p} />,
}));

jest.mock('@/helpers/AllowlistToolHelpers', () => ({
  getRandomObjectId: () => 'id',
}));

jest.mock('@/components/dotLoader/DotLoader', () => () => <div data-testid="loader" />);
jest.mock('@/hooks/useBrowserLocale', () => ({
  useBrowserLocale: () => 'en-US',
}));
jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  formatNameForUrl: (s: string) => s,
  NextGenListFilters: { ID: "ID" },
  NextGenTokenListedType: { ALL: "ALL", LISTED: "LISTED", NOT_LISTED: "NOT_LISTED" },
}));

const { commonApiFetch } = require('@/services/api/common-api');

const collection = { id: 1, name: 'Cool' } as any;

describe('NextGenCollectionArt', () => {
  beforeEach(() => {
    (commonApiFetch as jest.Mock).mockClear();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });

  it('shows view all link and renders token list with limit', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue([]);
    render(<NextGenCollectionArt collection={collection} show_view_all />);
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
    const link = screen.getByRole('link', { name: /View All/i });
    expect(link).toHaveAttribute('href', '/nextgen/collection/Cool/art');
    await screen.findByTestId('token-list');
    expect(screen.getByTestId('token-list')).toHaveAttribute('data-limit', '6');
  });

  it('hides view all link and passes undefined limit when not show_view_all', async () => {
    render(<NextGenCollectionArt collection={collection} />);
    await screen.findByTestId('token-list');
    expect(screen.queryByRole('link', { name: /View All/i })).toBeNull();
    expect(screen.getByTestId('token-list')).toHaveAttribute('data-limit', 'undefined');
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: 'nextgen/collections/1/traits',
      signal: expect.any(AbortSignal),
    });
  });

  it('hides filters on small screens', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    render(<NextGenCollectionArt collection={collection} />);
    await screen.findByTestId('token-list');
    expect(screen.queryByText('Traits')).toBeNull();
  });

  it('opens the Pebbles set planner from its native collection page', async () => {
    render(<NextGenCollectionArt collection={collection} />);
    await screen.findByTestId('token-list');
    expect(screen.getByRole('link', { name: 'Complete my set' })).toHaveAttribute(
      'href',
      '/collect?collection=pebbles&intent=pebbles_set'
    );
  });

  it('does not offer Pebbles completion for another NextGen collection', async () => {
    render(<NextGenCollectionArt collection={{ ...collection, id: 2 }} />);
    await screen.findByTestId('token-list');
    expect(screen.queryByRole('link', { name: 'Complete my set' })).not.toBeInTheDocument();
  });

  it('locale-formats trait and value counts', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue([
      {
        trait: 'Palette',
        values: Array.from({ length: 1234 }, (_, index) => `Value ${index}`),
        value_counts: [{ key: 'Blue', count: 2345 }],
      },
    ]);

    render(<NextGenCollectionArt collection={collection} />);

    expect(await screen.findByText('x1,234')).toBeInTheDocument();
    expect(screen.getByText('x2,345')).toBeInTheDocument();
  });

  it('shows an accessible error instead of an endless spinner when traits fail to load', async () => {
    (commonApiFetch as jest.Mock).mockRejectedValueOnce('HTTP error! status: 500');
    render(<NextGenCollectionArt collection={collection} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Collection traits could not be loaded.'
    );
    expect(screen.queryByTestId('loader')).toBeNull();
    expect(screen.queryByTestId('token-list')).toBeNull();
  });

  it('retries loading traits', async () => {
    (commonApiFetch as jest.Mock)
      .mockRejectedValueOnce('HTTP error! status: 500')
      .mockResolvedValueOnce([]);
    render(<NextGenCollectionArt collection={collection} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Try again' })
    );

    expect(await screen.findByTestId('token-list')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
  });

  it('ignores traits for a previous collection and aborts on unmount', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    (commonApiFetch as jest.Mock)
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce([
        { trait: 'Palette', values: ['Blue'], value_counts: [{ key: 'Blue', count: 2 }] },
      ]);
    const { rerender, unmount } = render(
      <NextGenCollectionArt collection={collection} />
    );
    rerender(<NextGenCollectionArt collection={{ ...collection, id: 2 }} />);

    const [firstCall, secondCall] = (commonApiFetch as jest.Mock).mock.calls;
    expect(firstCall[0].signal.aborted).toBe(true);
    expect(secondCall[0].endpoint).toBe('nextgen/collections/2/traits');

    expect(await screen.findByText('Palette')).toBeInTheDocument();
    resolveFirst([
      { trait: 'Stale', values: ['X'], value_counts: [{ key: 'X', count: 1 }] },
    ]);
    await Promise.resolve();
    expect(screen.queryByText('Stale')).toBeNull();

    unmount();
    expect(secondCall[0].signal.aborted).toBe(true);
  });

  it('stops the count spinner when the token list reports a failure', async () => {
    render(<NextGenCollectionArt collection={collection} />);
    await userEvent.click(await screen.findByRole('button', { name: 'fail list' }));

    expect(screen.queryByTestId('loader')).toBeNull();
  });
});
