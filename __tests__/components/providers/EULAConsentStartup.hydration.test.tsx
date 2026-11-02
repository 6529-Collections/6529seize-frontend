import {
  CONSENT_EULA_COOKIE,
  CURRENT_EULA_VERSION,
} from "@/constants/constants";

let mockPlatform = "web";
jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => mockPlatform !== "web",
    getPlatform: () => mockPlatform,
  },
}));
jest.mock("@capacitor/app", () => ({
  App: {
    getState: async () => ({ isActive: true }),
    addListener: async () => ({ remove: jest.fn() }),
  },
}));
jest.mock("@capacitor/device", () => ({
  Device: { getId: jest.fn(async () => ({ identifier: "device-1" })) },
}));
const mockRouter = { replace: jest.fn() };
jest.mock("next/navigation", () => ({
  usePathname: () => "/museum",
  useRouter: () => mockRouter,
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const { commonApiFetch } = jest.requireMock<{
  commonApiFetch: jest.Mock;
}>("@/services/api/common-api");

type Harness = {
  readonly react: typeof import("react");
  readonly hydrateRoot: typeof import("react-dom/client").hydrateRoot;
  readonly renderToString: typeof import("react-dom/server").renderToString;
  readonly EULAConsentStartup: typeof import("@/components/providers/EULAConsentStartup").default;
};

// The browser decision is made once per document, so every case loads a
// fresh module registry in place of a fresh page load.
function loadHarness(): Harness {
  let harness: Harness | undefined;
  jest.isolateModules(() => {
    harness = {
      react: require("react"),
      hydrateRoot: require("react-dom/client").hydrateRoot,
      renderToString: require("react-dom/server").renderToString,
      EULAConsentStartup: require("@/components/providers/EULAConsentStartup")
        .default,
    };
  });
  if (!harness) throw new Error("Harness did not load");
  return harness;
}

function setBrowserConsent(version: string | null) {
  document.cookie =
    version === null
      ? `${CONSENT_EULA_COOKIE}=; Path=/; Max-Age=0`
      : `${CONSENT_EULA_COOKIE}=${version}; Path=/`;
}

async function hydratePage() {
  const harness = loadHarness();
  const { react, hydrateRoot, renderToString, EULAConsentStartup } = harness;
  const commits: string[] = [];
  function PageContent() {
    react.useLayoutEffect(() => {
      commits.push("mount");
      return () => {
        commits.push("unmount");
      };
    }, []);
    return <h1>Museum page</h1>;
  }
  const page = () => (
    <EULAConsentStartup>
      <PageContent />
    </EULAConsentStartup>
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(page());
  document.body.appendChild(container);
  const serverHtml = container.innerHTML;
  const serverHeading = container.querySelector("h1");
  const serverCheck = container.querySelector('main[aria-busy="true"]');
  const recoverableErrors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await react.act(async () => {
    root = hydrateRoot(container, page(), {
      onRecoverableError: (error) => recoverableErrors.push(error),
    });
  });
  // Let the provider's scheduled consent check run.
  await react.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return {
    commits,
    container,
    serverHtml,
    serverHeading,
    serverCheck,
    recoverableErrors,
    rerender: async () => {
      await react.act(async () => root?.render(page()));
    },
    cleanup: async () => {
      await react.act(async () => root?.unmount());
      container.remove();
    },
  };
}

beforeAll(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

beforeEach(() => {
  mockPlatform = "web";
  setBrowserConsent(null);
  commonApiFetch.mockReset();
});

it("renders the ungated page on the server without reading browser state", () => {
  mockPlatform = "ios";
  setBrowserConsent(null);
  const { renderToString, EULAConsentStartup } = loadHarness();

  const html = renderToString(
    <EULAConsentStartup>
      <h1>Museum page</h1>
    </EULAConsentStartup>
  );

  expect(html).toContain("<h1>Museum page</h1>");
  expect(html).not.toContain('aria-busy="true"');
});

it.each([
  ["web", null],
  ["android", null],
  ["ios", CURRENT_EULA_VERSION],
] as const)(
  "keeps a %s page mounted (browser consent %s)",
  async (platform, consent) => {
    mockPlatform = platform;
    setBrowserConsent(consent);
    const result = await hydratePage();
    try {
      expect(result.recoverableErrors).toEqual([]);
      expect(result.container.querySelector("h1")).toBe(result.serverHeading);
      expect(result.commits).toEqual(["mount"]);
      expect(commonApiFetch).not.toHaveBeenCalled();
    } finally {
      await result.cleanup();
    }
  }
);

it.each([null, "2025-01-01"])(
  "replaces a native iOS page with the blocking check (browser consent %s)",
  async (consent) => {
    mockPlatform = "ios";
    setBrowserConsent(consent);
    commonApiFetch.mockReturnValue(new Promise(() => undefined));
    const result = await hydratePage();
    try {
      // The server HTML never holds the check; the browser starts it.
      expect(result.serverHeading).not.toBeNull();
      expect(result.serverCheck).toBeNull();
      expect(result.recoverableErrors).toEqual([]);
      // The hidden hydration commit is removed by the commit that reveals
      // native iOS, before the page content can be shown.
      expect(result.commits).toEqual(["mount", "unmount"]);
      expect(result.container.querySelector("h1")).toBeNull();
      expect(
        result.container.querySelector('main[aria-busy="true"]')
      ).not.toBeNull();
      expect(commonApiFetch).toHaveBeenCalledTimes(1);
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "policies/eula-consent/device-1",
        errorMode: "structured",
      });
    } finally {
      await result.cleanup();
    }
  }
);

it("opens a native iOS page once after restored acceptance", async () => {
  mockPlatform = "ios";
  commonApiFetch.mockResolvedValue({
    accepted_at: Date.now() - 1_000,
    eula_version: CURRENT_EULA_VERSION,
  });
  const result = await hydratePage();
  try {
    expect(result.recoverableErrors).toEqual([]);
    expect(result.container.querySelector("h1")?.textContent).toBe(
      "Museum page"
    );
    expect(result.commits).toEqual(["mount", "unmount", "mount"]);

    // A later root refresh or client navigation re-renders the startup with
    // the restored cookie in place. The accepted app stays mounted: the
    // document's starting decision is never re-read.
    await result.rerender();
    expect(result.commits).toEqual(["mount", "unmount", "mount"]);

    await result.rerender();
    expect(result.commits).toEqual(["mount", "unmount", "mount"]);
    expect(result.container.querySelector("h1")?.textContent).toBe(
      "Museum page"
    );
    expect(result.container.querySelector('main[aria-busy="true"]')).toBeNull();
    expect(commonApiFetch).toHaveBeenCalledTimes(1);
  } finally {
    await result.cleanup();
  }
});
