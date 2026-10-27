import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
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
  saved.alice = true;
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
  saved.alice = true;
  jest.mocked(fetchBookmarks).mockImplementation(async () => ({
    count: saved.alice ? 1 : 0,
    data: saved.alice
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
    screen.getByRole("heading", { name: "Bookmarks", exact: true })
  ).toBeInTheDocument();
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
