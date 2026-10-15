import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextGenTokenList from "@/components/nextGen/collections/NextGenTokenList";
import {
  NextGenListFilters,
  NextGenTokenListedType,
} from "@/components/nextGen/nextgen_helpers";
import { SortDirection } from "@/entities/ISort";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenTokenImage",
  () => ({
    NextGenTokenImage: ({ token }: any) => (
      <div data-testid="token">{token.name}</div>
    ),
  })
);

jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <div data-testid="pagination">
    <button onClick={() => props.setPage(props.page + 1)}>next</button>
  </div>
));

jest.mock("@/components/dotLoader/DotLoader", () => () => (
  <div data-testid="loader" />
));

jest.mock("@/helpers/AllowlistToolHelpers", () => ({
  getRandomObjectId: () => "id",
}));

const { commonApiFetch } = require("@/services/api/common-api");

const collection = { id: 1, name: "Collection" } as any;
const token = { id: 1, name: "Token", normalised_id: 1 } as any;

const requested = (endpoint: string) =>
  expect.objectContaining({ endpoint, signal: expect.any(AbortSignal) });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(props: any = {}) {
  (commonApiFetch as jest.Mock).mockResolvedValue({ count: 1, data: [token] });
  return render(<NextGenTokenList collection={collection} {...props} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  // @ts-ignore
  window.scrollTo = jest.fn();
});

it("fetches tokens on mount and displays them", async () => {
  setup();
  await screen.findByTestId("token");
  expect(commonApiFetch).toHaveBeenCalledWith(
    requested(
      `nextgen/collections/${collection.id}/tokens?page_size=48&page=1&sort=random`
    )
  );
  expect(screen.getByText("Token")).toBeInTheDocument();
});

it("shows message when no results found", async () => {
  (commonApiFetch as jest.Mock).mockResolvedValue({ count: 0, data: [] });
  render(<NextGenTokenList collection={collection} />);
  await screen.findByText("No results found");
});

it("announces the token loading state", () => {
  (commonApiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));
  render(<NextGenTokenList collection={collection} />);

  expect(screen.getByLabelText("Loading tokens").tagName).toBe("OUTPUT");
});

it("requests next page with pagination", async () => {
  (commonApiFetch as jest.Mock)
    .mockResolvedValueOnce({ count: 50, data: [token] }) // first mount fetch
    .mockResolvedValueOnce({ count: 50, data: [token] }) // second mount fetch
    .mockResolvedValueOnce({ count: 50, data: [token] }); // after clicking next
  render(<NextGenTokenList collection={collection} show_pagination />);

  await screen.findByTestId("token");
  await userEvent.click(screen.getByText("next"));

  await waitFor(() =>
    expect(commonApiFetch).toHaveBeenLastCalledWith(
      requested(
        `nextgen/collections/${collection.id}/tokens?page_size=48&page=2&sort=random`
      )
    )
  );
  expect(commonApiFetch).toHaveBeenCalledTimes(3);
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
});

it("builds endpoint with filters", async () => {
  setup({
    limit: 10,
    selected_traits: [
      { trait: "Color", value: "Red" },
      { trait: "Size", value: "Large" },
    ],
    show_normalised: true,
    show_trait_count: true,
    listed_type: NextGenTokenListedType.LISTED,
    sort: NextGenListFilters.RARITY_SCORE,
    sort_direction: SortDirection.DESC,
  });

  await screen.findByTestId("token");
  const traits = encodeURIComponent("Color:Red,Size:Large");
  const endpoint =
    `nextgen/collections/${collection.id}/tokens?page_size=10&page=1` +
    `&traits=${traits}` +
    `&show_normalised=true` +
    `&show_trait_count=true` +
    `&listed=true` +
    `&sort=rarity_score` +
    `&sort_direction=desc`;
  expect(commonApiFetch).toHaveBeenCalledWith(requested(endpoint));
});

it("shows an accessible error instead of an endless spinner when loading fails", async () => {
  (commonApiFetch as jest.Mock).mockRejectedValue("HTTP error! status: 500");
  render(<NextGenTokenList collection={collection} />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Tokens could not be loaded.");
  expect(screen.queryByLabelText("Loading tokens")).toBeNull();
  expect(screen.queryByText("No results found")).toBeNull();
});

it("retries a failed load", async () => {
  (commonApiFetch as jest.Mock)
    .mockRejectedValueOnce("HTTP error! status: 500")
    .mockRejectedValueOnce("HTTP error! status: 500")
    .mockResolvedValueOnce({ count: 1, data: [token] });
  render(<NextGenTokenList collection={collection} />);

  await userEvent.click(
    await screen.findByRole("button", { name: "Try again" })
  );

  expect(await screen.findByTestId("token")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
  // Two mount requests (the first is aborted by the second) plus one retry.
  expect(commonApiFetch).toHaveBeenCalledTimes(3);
});

it("reports load failures to the parent and clears them on success", async () => {
  const setLoadFailed = jest.fn();
  (commonApiFetch as jest.Mock)
    .mockRejectedValueOnce("HTTP error! status: 500")
    .mockRejectedValueOnce("HTTP error! status: 500")
    .mockResolvedValueOnce({ count: 1, data: [token] });
  render(
    <NextGenTokenList collection={collection} setLoadFailed={setLoadFailed} />
  );

  await userEvent.click(
    await screen.findByRole("button", { name: "Try again" })
  );
  await screen.findByTestId("token");

  expect(setLoadFailed).toHaveBeenCalledWith(true);
  expect(setLoadFailed).toHaveBeenLastCalledWith(false);
});

it("ignores a late response from a superseded query", async () => {
  const requests: Array<ReturnType<typeof deferred<unknown>>> = [];
  (commonApiFetch as jest.Mock).mockImplementation(() => {
    const request = deferred<unknown>();
    requests.push(request);
    return request.promise;
  });
  const setTotalResults = jest.fn();

  const { rerender } = render(
    <NextGenTokenList
      collection={collection}
      sort={NextGenListFilters.ID}
      setTotalResults={setTotalResults}
    />
  );
  const staleCalls = (commonApiFetch as jest.Mock).mock.calls.length;
  rerender(
    <NextGenTokenList
      collection={collection}
      sort={NextGenListFilters.RARITY_SCORE}
      setTotalResults={setTotalResults}
    />
  );

  const calls = (commonApiFetch as jest.Mock).mock.calls;
  for (const [params] of calls.slice(0, staleCalls)) {
    expect(params.signal.aborted).toBe(true);
  }
  expect(calls.at(-1)[0].signal.aborted).toBe(false);

  const current = requests.at(-1);
  await act(async () => {
    current?.resolve({ count: 1, data: [{ ...token, id: 2, name: "Newer" }] });
    await current?.promise;
  });
  for (const stale of requests.slice(0, staleCalls)) {
    await act(async () => {
      stale.resolve({ count: 1, data: [{ ...token, id: 1, name: "Older" }] });
      await stale.promise;
    });
  }

  expect(screen.getByText("Newer")).toBeInTheDocument();
  expect(screen.queryByText("Older")).toBeNull();
  expect(setTotalResults).toHaveBeenCalledTimes(1);
});

it("aborts the in-flight request on unmount", () => {
  (commonApiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));
  const { unmount } = render(<NextGenTokenList collection={collection} />);
  const { signal } = (commonApiFetch as jest.Mock).mock.lastCall[0];

  expect(signal.aborted).toBe(false);
  unmount();
  expect(signal.aborted).toBe(true);
});

it("does not report an error for a request aborted by unmount", async () => {
  const request = deferred<never>();
  (commonApiFetch as jest.Mock).mockReturnValue(request.promise);
  const setLoadFailed = jest.fn();
  const { unmount } = render(
    <NextGenTokenList collection={collection} setLoadFailed={setLoadFailed} />
  );
  unmount();
  setLoadFailed.mockClear();

  await act(async () => {
    request.reject(new DOMException("aborted", "AbortError"));
    await request.promise.catch(() => undefined);
  });

  expect(setLoadFailed).not.toHaveBeenCalled();
});
