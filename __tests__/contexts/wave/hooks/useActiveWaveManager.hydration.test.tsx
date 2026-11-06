import { act, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useActiveWaveManager } from "@/contexts/wave/hooks/useActiveWaveManager";

// MyStreamProvider registers the active wave in an effect and skips the
// initial backfill when the URL targets a drop. These tests pin what that
// effect sees from the first committed render after server HTML.
const mockLocation = { pathname: "/", search: "" };
const mockParamsCache = new Map<string, URLSearchParams>();

jest.mock("next/navigation", () => ({
  usePathname: () => mockLocation.pathname,
  useSearchParams: () => {
    const key = mockLocation.search;
    let params = mockParamsCache.get(key);
    if (!params) {
      params = new URLSearchParams(key);
      mockParamsCache.set(key, params);
    }
    return params;
  },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ getQueryData: jest.fn() }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "member:self",
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isApp: false,
    isMobileDevice: false,
    hasTouchScreen: false,
    isAppleMobile: false,
  }),
}));

const commits: Array<[string | null, boolean]> = [];

function Probe() {
  const { activeWaveId, hasActiveWaveDropTarget } = useActiveWaveManager();
  // Same shape as MyStreamProvider's registration effect.
  useEffect(() => {
    commits.push([activeWaveId, hasActiveWaveDropTarget]);
  }, [activeWaveId, hasActiveWaveDropTarget]);
  return <output>{activeWaveId ?? "none"}</output>;
}

async function hydrateAt(pathname: string, search: string) {
  mockLocation.pathname = pathname;
  mockLocation.search = search;
  globalThis.history.replaceState(
    null,
    "",
    `http://localhost${pathname}${search ? `?${search}` : ""}`
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(<Probe />);
  document.body.appendChild(container);
  const serverText = container.textContent;
  commits.length = 0;
  const onRecoverableError = jest.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(container, <Probe />, { onRecoverableError });
  });
  expect(onRecoverableError).not.toHaveBeenCalled();
  act(() => root!.unmount());
  return serverText;
}

beforeEach(() => {
  localStorage.clear();
  mockParamsCache.clear();
});
afterEach(() => {
  document.body.innerHTML = "";
});

it.each([
  ["/waves/abc", "serialNo=42", "abc", true],
  ["/messages/dm", "drop=drop", "dm", true],
  ["/waves/abc", "", "abc", false],
])(
  "registers %s?%s with its drop target from the first commit",
  async (pathname, search, waveId, hasTarget) => {
    expect(await hydrateAt(pathname, search)).toBe(waveId);
    expect(commits).toEqual([[waveId, hasTarget]]);
  }
);

it("never registers a public route's ?wave= without its drop target", async () => {
  expect(await hydrateAt("/the-memes/1", "wave=abc&serialNo=42")).toBe("none");
  // The query arrives after hydration. The wave id follows one commit after
  // the drop target, through useClientNavigation's state sync (as on any
  // client navigation), so no commit pairs it with `false`: that pair would
  // run the backfill the target skips.
  expect(commits).toEqual([
    [null, false],
    [null, true],
    ["abc", true],
  ]);
});
