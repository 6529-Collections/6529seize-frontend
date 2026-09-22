import TheMemesComponent from "@/components/the-memes/TheMemes";
import type { MemeSeason } from "@/entities/ISeason";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

let mockSearchParams = new URLSearchParams();
const mockRouter = { push: jest.fn() };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));
jest.mock("@/components/auth/Auth", () => ({
  AuthContext: jest
    .requireActual<typeof import("react")>("react")
    .createContext({ connectedProfile: null }),
}));
jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(async () => ({ data: [], next: null })),
}));
jest.mock("@/components/nft-image/NftBalancesContext", () => ({
  NftBalancesProvider: ({ children }: { children: ReactNode }) => children,
}));
jest.mock(
  "@/components/the-memes/TheMemesCard",
  () =>
    ({ nft }: { readonly nft: ApiMemesExtendedData }) => (
      <a href={`/the-memes/${nft.id}`}>{nft.name}</a>
    )
);
jest.mock(
  "@/components/collections-dropdown/CollectionsDropdown",
  () => () => null
);
jest.mock("@/components/lfg-slideshow/LFGSlideshow", () => ({
  LFGButton: () => null,
}));
jest.mock(
  "@/components/utils/select/dropdown/FilterGridDropdown",
  () => () => null
);
jest.mock(
  "@/components/utils/select/dropdown/MemeSeasonGridDropdown",
  () =>
    ({
      setSelected,
      seasons,
    }: {
      setSelected: (season: MemeSeason) => void;
      seasons: MemeSeason[];
    }) => <button onClick={() => setSelected(seasons[0]!)}>SZN1</button>
);
jest.mock("@/components/the-memes/VolumeTypeDropdown", () => () => null);

const seasons: MemeSeason[] = [
  {
    id: 1,
    name: "SZN1",
    display: "SZN 1",
    start_index: 1,
    end_index: 47,
    count: 47,
    boost: 0.05,
  },
];
const ascending = Array.from({ length: 47 }, (_, index) => ({
  id: index + 1,
  contract: "memes",
  meme: 1,
  meme_name: "Meme",
  name: `Card ${index + 1}`,
})) as ApiMemesExtendedData[];
const descending = [...ascending].reverse();
const nextPage = "https://api.example.test/memes?page=2&sort_direction=DESC";
const stalePage = "https://api.example.test/memes?page=3&sort_direction=ASC";

type Page = { data: ApiMemesExtendedData[]; next?: string | undefined };

function queueRequest() {
  let resolve!: (page: Page) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Page>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  // Deliberately resolve even after abort to exercise the stale-response guard.
  jest.mocked(fetchUrl).mockReturnValueOnce(promise);
  return { resolve, reject };
}

function cardIds() {
  return screen
    .queryAllByRole("link", { name: /^Card / })
    .map((link) => Number(link.getAttribute("href")?.split("/").pop()));
}

function requestSignal(index: number) {
  return jest.mocked(fetchUrl).mock.calls[index]?.[1]?.signal;
}

async function mount() {
  await act(async () => {
    render(<TheMemesComponent />);
  });
}

async function scrollToNextPage() {
  await act(async () => {
    fireEvent.scroll(window);
    jest.advanceTimersByTime(200);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(fetchUrl).mockReset();
  mockRouter.push.mockClear();
  mockSearchParams = new URLSearchParams("sort=tdh&sort_dir=asc&year=0");
  jest.mocked(commonApiFetch).mockResolvedValue(seasons);
});

afterEach(() => {
  jest.useRealTimers();
});

it.each(["stale-first", "latest-first"])(
  "keeps exactly 47 cards in the latest order when responses finish %s",
  async (order) => {
    const initial = queueRequest();
    const stale = queueRequest();
    const latest = queueRequest();
    await mount();
    await act(async () => initial.resolve({ data: ascending }));
    expect(cardIds()).toEqual(ascending.map(({ id }) => id));

    fireEvent.click(screen.getByRole("button", { name: "SZN1" }));
    fireEvent.click(screen.getByRole("button", { name: "Sort descending" }));
    expect(fetchUrl).toHaveBeenCalledTimes(3);
    expect(requestSignal(1)?.aborted).toBe(true);
    expect(cardIds()).toEqual([]);

    if (order === "stale-first") {
      await act(async () =>
        stale.resolve({ data: ascending, next: stalePage })
      );
      expect(cardIds()).toEqual([]);
      expect(screen.getByRole("status")).toHaveTextContent("Fetching");
      await act(async () =>
        latest.resolve({ data: descending, next: nextPage })
      );
    } else {
      await act(async () =>
        latest.resolve({ data: descending, next: nextPage })
      );
      await act(async () =>
        stale.resolve({ data: ascending, next: stalePage })
      );
    }

    expect(cardIds()).toEqual(descending.map(({ id }) => id));
    expect(new Set(cardIds()).size).toBe(47);
    expect(screen.queryByRole("status")).toBeNull();
    const next = queueRequest();
    await scrollToNextPage();
    expect(fetchUrl).toHaveBeenLastCalledWith(nextPage, {
      signal: expect.any(AbortSignal),
    });
    await act(async () => next.resolve({ data: [] }));
  }
);

it.each(["stale-first", "latest-first"])(
  "ignores pagination from the previous filters when responses finish %s",
  async (order) => {
    const first = queueRequest();
    const stale = queueRequest();
    const latest = queueRequest();
    await mount();
    await act(async () =>
      first.resolve({ data: ascending.slice(0, 2), next: stalePage })
    );
    await scrollToNextPage();
    expect(fetchUrl).toHaveBeenLastCalledWith(stalePage, {
      signal: expect.any(AbortSignal),
    });
    fireEvent.click(screen.getByRole("button", { name: "Sort descending" }));
    expect(requestSignal(1)?.aborted).toBe(true);
    expect(requestSignal(2)?.aborted).toBe(false);
    expect(jest.mocked(fetchUrl).mock.calls[2]?.[0]).toContain(
      "sort_direction=DESC"
    );

    if (order === "stale-first") {
      await act(async () =>
        stale.resolve({ data: ascending.slice(2, 4), next: stalePage })
      );
      expect(cardIds()).toEqual([]);
      expect(screen.getByRole("status")).toBeInTheDocument();
      await act(async () => latest.resolve({ data: descending }));
    } else {
      await act(async () => latest.resolve({ data: descending }));
      await act(async () =>
        stale.resolve({ data: ascending.slice(2, 4), next: stalePage })
      );
    }
    expect(cardIds()).toEqual(descending.map(({ id }) => id));
    expect(screen.queryByRole("status")).toBeNull();
    await scrollToNextPage();
    expect(fetchUrl).toHaveBeenCalledTimes(3);
  }
);

it("appends one page per scroll request and stops at the end", async () => {
  const first = queueRequest();
  const second = queueRequest();
  await mount();
  await act(async () =>
    first.resolve({ data: ascending.slice(0, 2), next: nextPage })
  );
  await scrollToNextPage();
  await scrollToNextPage();
  expect(fetchUrl).toHaveBeenCalledTimes(2);
  expect(cardIds()).toEqual([1, 2]);
  await act(async () => second.resolve({ data: ascending.slice(2, 4) }));
  expect(cardIds()).toEqual([1, 2, 3, 4]);
  const timersAtEnd = jest.getTimerCount();
  fireEvent.scroll(window);
  expect(jest.getTimerCount()).toBe(timersAtEnd);
  await scrollToNextPage();
  expect(fetchUrl).toHaveBeenCalledTimes(2);
});

it.each([true, false])(
  "uses the settled cursor before React commits a page (has next: %s)",
  async (hasNext) => {
    const first = queueRequest();
    const second = queueRequest();
    const third = queueRequest();
    await mount();
    await act(async () =>
      first.resolve({ data: ascending.slice(0, 2), next: nextPage })
    );
    await scrollToNextPage();

    await act(async () => {
      // A scroll timer can fire after the request settles but before React
      // commits the new cursor and replaces the previous scroll listener.
      fireEvent.scroll(window);
      second.resolve({
        data: ascending.slice(2, 4),
        next: hasNext ? stalePage : undefined,
      });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jest.advanceTimersByTime(200);
    });

    expect(cardIds()).toEqual([1, 2, 3, 4]);
    expect(fetchUrl).toHaveBeenCalledTimes(hasNext ? 3 : 2);
    if (hasNext) {
      expect(fetchUrl).toHaveBeenLastCalledWith(stalePage, {
        signal: expect.any(AbortSignal),
      });
      await act(async () => third.resolve({ data: ascending.slice(4, 6) }));
      expect(cardIds()).toEqual([1, 2, 3, 4, 5, 6]);
    }
  }
);

it("preserves server cards and appends from their cursor without fetching page one", async () => {
  mockSearchParams = new URLSearchParams();
  const next = queueRequest();
  await act(async () => {
    render(
      <TheMemesComponent
        initialData={{ nfts: ascending.slice(0, 2), nextPage }}
      />
    );
  });
  expect(fetchUrl).not.toHaveBeenCalled();
  expect(cardIds()).toEqual([1, 2]);
  await scrollToNextPage();
  expect(fetchUrl).toHaveBeenLastCalledWith(nextPage, {
    signal: expect.any(AbortSignal),
  });
  await act(async () => next.resolve({ data: ascending.slice(2, 4) }));
  expect(cardIds()).toEqual([1, 2, 3, 4]);
});

it("does not clear loading or allow a duplicate request when an old request rejects", async () => {
  const stale = queueRequest();
  const latest = queueRequest();
  await mount();
  fireEvent.click(screen.getByRole("button", { name: "Sort descending" }));
  await act(async () => stale.reject(new Error("Late network error")));
  expect(screen.getByRole("status")).toBeInTheDocument();
  await scrollToNextPage();
  expect(fetchUrl).toHaveBeenCalledTimes(2);
  await act(async () => latest.resolve({ data: descending }));
  expect(cardIds()).toEqual(descending.map(({ id }) => id));
  expect(screen.queryByRole("status")).toBeNull();
});

it("retains loaded cards and retries the same cursor after an active request fails", async () => {
  const first = queueRequest();
  const failed = queueRequest();
  const retry = queueRequest();
  await mount();
  await act(async () =>
    first.resolve({ data: ascending.slice(0, 2), next: nextPage })
  );
  await scrollToNextPage();
  await act(async () => failed.reject(new Error("Network error")));
  expect(cardIds()).toEqual([1, 2]);
  expect(screen.queryByRole("status")).toBeNull();
  await scrollToNextPage();
  expect(fetchUrl).toHaveBeenLastCalledWith(nextPage, {
    signal: expect.any(AbortSignal),
  });
  await act(async () => retry.resolve({ data: ascending.slice(2, 4) }));
  expect(cardIds()).toEqual([1, 2, 3, 4]);
});

it("aborts the active request on unmount", async () => {
  const request = queueRequest();
  const view = render(<TheMemesComponent />);
  await act(async () => {});
  expect(requestSignal(0)?.aborted).toBe(false);
  view.unmount();
  expect(requestSignal(0)?.aborted).toBe(true);
  await act(async () => request.resolve({ data: ascending }));
});
