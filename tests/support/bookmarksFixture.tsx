import { createContext, useContext, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HeaderBookmarksLink from "@/components/header/user/HeaderBookmarksLink";
import WaveDropBookmarkAction from "@/components/waves/drops/WaveDropBookmarkAction";
import BookmarksPage from "@/components/bookmarks/BookmarksPage";

const AuthContext = createContext<{
  connectedProfile: { id: string };
  isAuthenticated: boolean;
  activeProfileProxy: { id: string } | null;
  fetchingProfile: boolean;
  setToast: () => void;
  requestAuth: () => Promise<{ success: boolean }>;
}>({
  connectedProfile: { id: "alice" },
  isAuthenticated: true,
  activeProfileProxy: null,
  fetchingProfile: false,
  setToast: () => {},
  requestAuth: () => Promise.resolve({ success: true }),
});
export const useAuth = () => useContext(AuthContext);
const saved = new Map<string, boolean>();
let owner = "alice";
export const getWalletAddress = () => owner;
export function fetchBookmarkStatus(_signal?: AbortSignal, dropId?: string) {
  return Promise.resolve({
    count: saved.get(owner) ? 1 : 0,
    ...(dropId ? { bookmarked: saved.get(owner) === true } : {}),
  });
}
export function fetchBookmarks() {
  return Promise.resolve({
    page: 1,
    next: false,
    count: saved.get(owner) ? 1 : 0,
    data: saved.get(owner)
      ? [{ id: "saved-drop", serial_no: 12, wave: { id: "wave-one" } }]
      : [],
  });
}
export function updateDropBookmark(_dropId: string, bookmarked: boolean) {
  saved.set(owner, bookmarked);
  return Promise.resolve({ id: "saved-drop" });
}
function Fixture() {
  const [account, setAccount] = useState("alice");
  const [proxy, setProxy] = useState(false);
  owner = account;
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
  );
  const authValue = useMemo(
    () => ({
      connectedProfile: { id: account },
      isAuthenticated: true,
      activeProfileProxy: proxy ? { id: "delegated-profile" } : null,
      fetchingProfile: false,
      setToast: () => {},
      requestAuth: () => Promise.resolve({ success: true }),
    }),
    [account, proxy]
  );
  return (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={authValue}>
        <div className="tw-mx-auto tw-max-w-4xl tw-p-4">
          <nav className="tw-flex tw-flex-wrap tw-gap-3 tw-text-iron-200">
            <button onClick={() => setProxy(!proxy)}>Toggle proxy</button>
            <button
              onClick={() => setAccount(account === "alice" ? "bob" : "alice")}
            >
              Switch account
            </button>
            <span>Owner: {account}</span>
            <span>Proxy: {proxy ? "active" : "inactive"}</span>
          </nav>
          <aside
            aria-label="Account menu"
            className="tw-my-4 tw-w-72 tw-rounded-xl tw-bg-iron-800 tw-p-2"
          >
            <HeaderBookmarksLink onClose={() => {}} />
          </aside>
          <section
            aria-label="Message menu"
            className="tw-w-72 tw-rounded-xl tw-bg-iron-900 tw-p-2"
          >
            <WaveDropBookmarkAction dropId="saved-drop" />
          </section>
          <BookmarksPage />
        </div>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
