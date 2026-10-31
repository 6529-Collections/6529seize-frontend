import { act, render, screen, waitFor } from "@testing-library/react";
import { useE2eeContext } from "@/components/e2ee/E2eeContext";
import E2eeProvider from "@/components/e2ee/E2eeProvider";
import type { E2eeEngineModules } from "@/components/e2ee/e2eeEngineLoader";
import type { E2eeEngineHostDeps } from "@/components/e2ee/e2eeEngineLoader";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import {
  createFakeChannels,
  createFakeLocks,
} from "../../lib/e2ee/support/fakeLocks";
import { createFakeE2eeEngine, SELF_ID } from "./fakeE2eeEngine";

jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("next/navigation", () => ({
  usePathname: () => "/messages/encrypted",
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "profile-self" },
    activeProfileProxy: null,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0xAbCdEf0000000000000000000000000000000001",
  }),
}));
jest.mock("@/components/e2ee/useE2eeEngineDeps", () => {
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

type Context = ReturnType<typeof useE2eeContext>;

/** One "browser tab": a provider whose context the test can read and drive. */
function Tab({
  name,
  contexts,
}: {
  readonly name: string;
  readonly contexts: Map<string, Context>;
}) {
  const context = useE2eeContext();
  contexts.set(name, context);
  return <span data-testid={name}>{context.availability}</span>;
}

const createLoader = () => {
  const engines: ReturnType<typeof createFakeE2eeEngine>[] = [];
  const deps: E2eeEngineHostDeps[] = [];
  const loadModules = jest.fn(
    async (): Promise<E2eeEngineModules> => ({
      createE2eeEngine: async (input) => {
        deps.push(input);
        const engine = createFakeE2eeEngine({ status: "ready" });
        engines.push(engine);
        return engine;
      },
      createE2eeApiClient: () => ({}) as never,
    })
  );
  return { loadModules, engines, deps };
};

const original = {
  locks: Object.getOwnPropertyDescriptor(globalThis.navigator, "locks"),
  channel: globalThis.BroadcastChannel,
};

function installLocks(locks: LockManager | undefined) {
  Object.defineProperty(globalThis.navigator, "locks", {
    configurable: true,
    value: locks,
  });
}

describe("E2eeProvider across tabs", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    (isE2eeEnabled as jest.Mock).mockReturnValue(true);
    installLocks(createFakeLocks());
    const channels = createFakeChannels();
    globalThis.BroadcastChannel = function FakeBroadcastChannel(name: string) {
      return channels(name);
    } as unknown as typeof BroadcastChannel;
  });

  afterEach(() => {
    if (original.locks) {
      Object.defineProperty(globalThis.navigator, "locks", original.locks);
    } else {
      delete (globalThis.navigator as { locks?: unknown }).locks;
    }
    globalThis.BroadcastChannel = original.channel;
  });

  it("starts no second engine while another tab holds the profile's lock", async () => {
    const contexts = new Map<string, Context>();
    const tabA = createLoader();
    const tabB = createLoader();
    render(
      <E2eeProvider loadModules={tabA.loadModules}>
        <Tab name="a" contexts={contexts} />
      </E2eeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("a")).toHaveTextContent("loaded")
    );

    render(
      <E2eeProvider loadModules={tabB.loadModules}>
        <Tab name="b" contexts={contexts} />
      </E2eeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("b")).toHaveTextContent("elsewhere")
    );
    expect(tabB.loadModules).not.toHaveBeenCalled();
    expect(tabB.engines).toHaveLength(0);
    expect(tabA.engines[0]?.dispose).not.toHaveBeenCalled();
  });

  it("'Use here' moves the engine: the owner stops and shows the same state", async () => {
    const contexts = new Map<string, Context>();
    const tabA = createLoader();
    const tabB = createLoader();
    render(
      <E2eeProvider loadModules={tabA.loadModules}>
        <Tab name="a" contexts={contexts} />
      </E2eeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("a")).toHaveTextContent("loaded")
    );
    render(
      <E2eeProvider loadModules={tabB.loadModules}>
        <Tab name="b" contexts={contexts} />
      </E2eeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("b")).toHaveTextContent("elsewhere")
    );

    act(() => contexts.get("b")?.takeOverHere());

    await waitFor(() =>
      expect(screen.getByTestId("b")).toHaveTextContent("loaded")
    );
    expect(screen.getByTestId("a")).toHaveTextContent("elsewhere");
    expect(tabA.engines[0]?.dispose).toHaveBeenCalledTimes(1);
    expect(tabB.engines).toHaveLength(1);
    expect(tabB.deps[0]?.profileId).toBe(SELF_ID);
  });

  it("a refused stale write stops the engine and shows the other-tab state", async () => {
    const contexts = new Map<string, Context>();
    const tab = createLoader();
    render(
      <E2eeProvider loadModules={tab.loadModules}>
        <Tab name="a" contexts={contexts} />
      </E2eeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("a")).toHaveTextContent("loaded")
    );
    act(() => tab.deps[0]?.onStateConflict?.());
    await waitFor(() =>
      expect(screen.getByTestId("a")).toHaveTextContent("elsewhere")
    );
    expect(tab.engines[0]?.dispose).toHaveBeenCalledTimes(1);
  });

  it("keeps the old behaviour without Web Locks, with a console warning", async () => {
    installLocks(undefined);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const contexts = new Map<string, Context>();
    const tabA = createLoader();
    const tabB = createLoader();
    render(
      <E2eeProvider loadModules={tabA.loadModules}>
        <Tab name="a" contexts={contexts} />
      </E2eeProvider>
    );
    render(
      <E2eeProvider loadModules={tabB.loadModules}>
        <Tab name="b" contexts={contexts} />
      </E2eeProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("a")).toHaveTextContent("loaded");
      expect(screen.getByTestId("b")).toHaveTextContent("loaded");
    });
    warn.mockRestore();
  });
});
