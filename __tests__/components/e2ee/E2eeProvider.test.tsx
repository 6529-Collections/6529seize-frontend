import { act, render, screen, waitFor } from "@testing-library/react";
import { useE2eeContext } from "@/components/e2ee/E2eeContext";
import E2eeProvider from "@/components/e2ee/E2eeProvider";
import type { E2eeEngineModules } from "@/components/e2ee/e2eeEngineLoader";
import { setE2eeEnrollmentMarker } from "@/components/e2ee/e2eeLocalState";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { E2eeEngineDeps } from "@/lib/e2ee/types";
import { createFakeE2eeEngine, SELF_ID } from "./fakeE2eeEngine";

const mockPathname = jest.fn(() => "/messages");
let mockAuth: {
  connectedProfile: { id: string } | null;
  activeProfileProxy: object | null;
} = { connectedProfile: { id: SELF_ID }, activeProfileProxy: null };
let mockAddress: string | undefined =
  "0xAbCdEf0000000000000000000000000000000001";

jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: mockAddress }),
}));
jest.mock("@/components/e2ee/useE2eeEngineDeps", () => {
  // Stable like the real useCallback-based builder.
  const buildDeps = ({
    profileId,
    wallet,
    api,
  }: {
    profileId: string;
    wallet: string;
    api: unknown;
  }) => ({
    profileId,
    wallet,
    api,
    origin: "staging.6529.io",
    platform: "web",
    signTypedData: jest.fn(),
    resolveProfiles: jest.fn(),
  });
  return { useE2eeEngineDeps: () => buildDeps };
});

const isE2eeEnabledMock = isE2eeEnabled as jest.Mock;

function ContextProbe() {
  const { availability, profileId, engine } = useE2eeContext();
  return (
    <div>
      <span data-testid="availability">{availability}</span>
      <span data-testid="profile">{profileId ?? "none"}</span>
      <span data-testid="engine">{engine ? "engine" : "no-engine"}</span>
    </div>
  );
}

const createLoader = () => {
  const engines: ReturnType<typeof createFakeE2eeEngine>[] = [];
  const deps: E2eeEngineDeps[] = [];
  const loadModules = jest.fn(
    async (): Promise<E2eeEngineModules> => ({
      createE2eeEngine: async (input) => {
        deps.push(input);
        const engine = createFakeE2eeEngine({ status: "needs-enrollment" });
        engines.push(engine);
        return engine;
      },
      createE2eeApiClient: () => ({}) as never,
    })
  );
  return { loadModules, engines, deps };
};

describe("E2eeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.localStorage.clear();
    isE2eeEnabledMock.mockReturnValue(true);
    mockPathname.mockReturnValue("/messages");
    mockAuth = { connectedProfile: { id: SELF_ID }, activeProfileProxy: null };
    mockAddress = "0xAbCdEf0000000000000000000000000000000001";
  });

  it("renders only children and loads nothing when the flag is off", () => {
    isE2eeEnabledMock.mockReturnValue(false);
    mockPathname.mockReturnValue("/messages/encrypted");
    const { loadModules } = createLoader();
    render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    expect(screen.getByTestId("availability")).toHaveTextContent("disabled");
    expect(loadModules).not.toHaveBeenCalled();
  });

  it("stays unavailable without a profile", () => {
    mockAuth = { connectedProfile: null, activeProfileProxy: null };
    mockPathname.mockReturnValue("/messages/encrypted");
    const { loadModules } = createLoader();
    render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    expect(screen.getByTestId("availability")).toHaveTextContent("unavailable");
    expect(loadModules).not.toHaveBeenCalled();
  });

  it("never starts an engine for proxy sessions", () => {
    mockAuth = {
      connectedProfile: { id: SELF_ID },
      activeProfileProxy: { id: "proxy" },
    };
    mockPathname.mockReturnValue("/messages/encrypted");
    const { loadModules } = createLoader();
    render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    expect(screen.getByTestId("availability")).toHaveTextContent("proxy");
    expect(screen.getByTestId("profile")).toHaveTextContent("none");
    expect(loadModules).not.toHaveBeenCalled();
  });

  it("stays idle off encrypted routes when this browser never enrolled", () => {
    const { loadModules } = createLoader();
    render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    expect(screen.getByTestId("availability")).toHaveTextContent("idle");
    expect(loadModules).not.toHaveBeenCalled();
  });

  it("loads the engine on an encrypted route with the profile's deps", async () => {
    mockPathname.mockReturnValue("/messages/encrypted");
    const { loadModules, deps } = createLoader();
    render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("availability")).toHaveTextContent("loaded")
    );
    expect(loadModules).toHaveBeenCalledTimes(1);
    expect(deps[0]).toMatchObject({
      profileId: SELF_ID,
      wallet: "0xabcdef0000000000000000000000000000000001",
    });
  });

  it("loads early when this browser already enrolled a device", async () => {
    setE2eeEnrollmentMarker(SELF_ID, true);
    const { loadModules } = createLoader();
    render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("engine")).toHaveTextContent("engine")
    );
  });

  it("disposes the old engine on profile switch and logout", async () => {
    mockPathname.mockReturnValue("/messages/encrypted");
    const { loadModules, engines, deps } = createLoader();
    const view = render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    await waitFor(() => expect(engines).toHaveLength(1));

    mockAuth = {
      connectedProfile: { id: "profile-other" },
      activeProfileProxy: null,
    };
    view.rerender(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    await waitFor(() => expect(engines).toHaveLength(2));
    expect(engines[0]?.dispose).toHaveBeenCalled();
    expect(deps[1]?.profileId).toBe("profile-other");

    mockAuth = { connectedProfile: null, activeProfileProxy: null };
    await act(async () => {
      view.rerender(
        <E2eeProvider loadModules={loadModules}>
          <ContextProbe />
        </E2eeProvider>
      );
    });
    expect(engines[1]?.dispose).toHaveBeenCalled();
    expect(screen.getByTestId("availability")).toHaveTextContent("unavailable");
  });

  it("records the enrollment marker once the engine is ready", async () => {
    mockPathname.mockReturnValue("/messages/encrypted");
    const { loadModules, engines } = createLoader();
    render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    await waitFor(() => expect(engines).toHaveLength(1));
    act(() => engines[0]?.update({ status: "ready" }));
    expect(
      globalThis.localStorage.getItem(`6529:e2ee:enrolled:${SELF_ID}`)
    ).toBe("1");
  });

  it("reports a load failure code", async () => {
    mockPathname.mockReturnValue("/messages/encrypted");
    const loadModules = jest.fn(async () => {
      throw new Error("chunk failed");
    });
    render(
      <E2eeProvider loadModules={loadModules}>
        <ContextProbe />
      </E2eeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("availability")).toHaveTextContent("failed")
    );
  });
});
