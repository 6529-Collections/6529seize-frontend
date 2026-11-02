import type { ApiDrop } from "@/generated/models/ApiDrop";
import BookmarkCard from "@/components/bookmarks/BookmarkCard";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import HeaderBookmarksLink from "@/components/header/user/HeaderBookmarksLink";
import WaveDropBookmarkAction from "@/components/waves/drops/WaveDropBookmarkAction";
import BookmarksPage from "@/components/bookmarks/BookmarksPage";
import {
  fetchBookmarkStatus,
  fetchBookmarks,
  updateDropBookmark,
} from "@/services/api/drop-bookmarks-api";

let mockOwner: string | null = "alice";
let mockProxy: string | null = null;
const mockToast = jest.fn();
const mockPush = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockOwner ? { id: mockOwner } : null,
    isAuthenticated: !!mockOwner,
    activeProfileProxy: mockProxy ? { id: mockProxy } : null,
    setToast: mockToast,
    requestAuth: jest.fn(),
    fetchingProfile: false,
  }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => mockOwner,
}));
jest.mock("@/services/api/drop-bookmarks-api");
jest.mock("@/components/header/user/HeaderUserConnect", () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <button>{label}</button>,
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/helpers/waves/drop.helpers", () => ({
  convertApiDropToExtendedDrop: (drop: unknown) => drop,
}));
jest.mock("@/helpers/navigation.helpers", () => ({
  getWaveRoute: ({
    waveId,
    serialNo,
    isDirectMessage,
  }: {
    waveId: string;
    serialNo: number;
    isDirectMessage: boolean;
  }) =>
    `/${isDirectMessage ? "messages" : "waves"}/${waveId}?serialNo=${serialNo}`,
}));
jest.mock("@/components/waves/drops/Drop", () => ({
  __esModule: true,
  default: ({ drop }: { drop: { id: string } }) => <div>{drop.id}</div>,
  DropLocation: { MY_STREAM: "MY_STREAM" },
}));

let client: QueryClient;
let saved: Record<string, boolean>;
function Wrapper({ children }: { readonly children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function Controls() {
  return (
    <>
      <HeaderBookmarksLink onClose={() => {}} />
      <WaveDropBookmarkAction dropId="drop-1" />
    </>
  );
}
beforeEach(() => {
  mockOwner = "alice";
  mockProxy = null;
  saved = { alice: false, bob: false };
  mockToast.mockClear();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  jest
    .mocked(fetchBookmarkStatus)
    .mockImplementation(async (_signal, dropId) => ({
      count: saved[mockOwner ?? ""] ? 1 : 0,
      ...(dropId ? { bookmarked: saved[mockOwner ?? ""] ?? false } : {}),
    }));
  jest
    .mocked(updateDropBookmark)
    .mockImplementation(async (_id, bookmarked) => {
      saved[mockOwner ?? ""] = bookmarked;
      return { id: "drop-1" } as Awaited<ReturnType<typeof updateDropBookmark>>;
    });
  jest
    .mocked(fetchBookmarks)
    .mockResolvedValue({ count: 0, data: [], next: false, page: 1 });
});
afterEach(() => {
  client.clear();
});

it("reveals the menu entry on first save and hides it after the last removal", async () => {
  render(<Controls />, { wrapper: Wrapper });
  expect(
    screen.queryByRole("link", { name: "Bookmarks" })
  ).not.toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Bookmark" })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole("button", { name: "Bookmark" }));
  await screen.findByRole("link", { name: "Bookmarks" });
  const remove = await screen.findByRole("button", { name: "Remove bookmark" });
  await waitFor(() => expect(remove).toBeEnabled());
  fireEvent.click(remove);
  await waitFor(() =>
    expect(
      screen.queryByRole("link", { name: "Bookmarks" })
    ).not.toBeInTheDocument()
  );
});
it("keeps bookmarks with the owner across proxy changes and isolates account switches", async () => {
  saved["alice"] = true;
  const view = render(<Controls />, { wrapper: Wrapper });
  await screen.findByRole("link", { name: "Bookmarks" });
  mockProxy = "someone-else";
  view.rerender(<Controls />);
  expect(screen.getByRole("link", { name: "Bookmarks" })).toBeInTheDocument();
  mockOwner = "bob";
  view.rerender(<Controls />);
  expect(
    screen.queryByRole("link", { name: "Bookmarks" })
  ).not.toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Bookmark" })).toBeEnabled()
  );
  expect(
    screen.queryByRole("button", { name: "Remove bookmark" })
  ).not.toBeInTheDocument();
});
it("rolls back a failed first save", async () => {
  jest.mocked(updateDropBookmark).mockRejectedValueOnce(new Error("offline"));
  render(<Controls />, { wrapper: Wrapper });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Bookmark" })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole("button", { name: "Bookmark" }));
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    )
  );
  expect(
    screen.queryByRole("link", { name: "Bookmarks" })
  ).not.toBeInTheDocument();
});
it("keeps the page open with an empty state after the last removal", async () => {
  saved["alice"] = true;
  jest.mocked(fetchBookmarks).mockImplementation(async () => ({
    count: saved["alice"] ? 1 : 0,
    data: saved["alice"]
      ? ([
          {
            id: "drop-1",
            serial_no: 12,
            wave: { id: "wave-1", is_direct_message: false },
          },
        ] as Awaited<ReturnType<typeof fetchBookmarks>>["data"])
      : [],
    page: 1,
    next: false,
  }));
  render(<BookmarksPage />, { wrapper: Wrapper });
  expect(
    await screen.findByRole("link", { name: "Open in conversation" })
  ).toHaveAttribute("href", "/waves/wave-1?serialNo=12");
  const remove = await screen.findByRole("button", { name: "Remove bookmark" });
  await waitFor(() => expect(remove).toBeEnabled());
  fireEvent.click(remove);
  await screen.findByRole("heading", { name: "No bookmarks yet" });
  expect(
    screen.getByRole("heading", { name: /^Bookmarks$/ })
  ).toHaveFocus();
});
it("does not fetch private data while signed out", async () => {
  mockOwner = null;
  jest.mocked(fetchBookmarkStatus).mockClear();
  jest.mocked(fetchBookmarks).mockClear();
  render(<BookmarksPage />, { wrapper: Wrapper });
  expect(
    screen.getByText("Connect your profile to view your bookmarks.")
  ).toBeInTheDocument();
  await act(async () => {});
  expect(fetchBookmarkStatus).not.toHaveBeenCalled();
  expect(fetchBookmarks).not.toHaveBeenCalled();
});

it("keeps the menu visible when removing one of multiple saved messages", async () => {
  const ids = new Set(["drop-1", "drop-2"]);
  jest
    .mocked(fetchBookmarkStatus)
    .mockImplementation(async (_signal, dropId) => ({
      count: ids.size,
      ...(dropId ? { bookmarked: ids.has(dropId) } : {}),
    }));
  jest.mocked(fetchBookmarks).mockImplementation(async () => ({
    count: ids.size,
    page: 1,
    next: false,
    data: [...ids].map((id) => ({
      id,
      serial_no: 12,
      wave: { id: "wave-1" },
    })) as Awaited<ReturnType<typeof fetchBookmarks>>["data"],
  }));
  jest.mocked(updateDropBookmark).mockImplementation(async (id) => {
    ids.delete(id);
    return { id } as Awaited<ReturnType<typeof updateDropBookmark>>;
  });
  render(
    <>
      <HeaderBookmarksLink onClose={() => {}} />
      <BookmarksPage />
    </>,
    { wrapper: Wrapper }
  );
  await screen.findByText("drop-1");
  const card = screen.getByText("drop-1").closest("article");
  expect(card).not.toBeNull();
  fireEvent.click(
    within(card!).getByRole("button", { name: "Remove bookmark" })
  );
  await waitFor(() =>
    expect(screen.queryByText("drop-1")).not.toBeInTheDocument()
  );
  expect(
    screen.getByRole("link", { name: /^Bookmarks$/ })
  ).toBeInTheDocument();
  expect(screen.getByText("drop-2")).toBeInTheDocument();
});

it("does not create a broken conversation link from missing wave metadata", () => {
  const { container } = render(
    <BookmarkCard
      apiDrop={
        { id: "missing-wave", wave: null, serial_no: 12 } as unknown as ApiDrop
      }
      onRemoved={() => {}}
    />,
    { wrapper: Wrapper }
  );
  expect(container.querySelector("article")).toBeNull();
  expect(
    screen.queryByRole("link", { name: "Open in conversation" })
  ).not.toBeInTheDocument();
});
