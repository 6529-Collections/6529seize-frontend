import { render, screen, waitFor } from "@testing-library/react";
import E2eeProvider from "@/components/e2ee/E2eeProvider";
import type { E2eeEngineModules } from "@/components/e2ee/e2eeEngineLoader";
import { BackupCard } from "@/components/preferences/devices-security/BackupCard";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { createFakeE2eeEngine } from "../../e2ee/fakeE2eeEngine";

/**
 * The provider and the card sit in different parts of the tree and share
 * only the request store. Mounting the card on a non-encrypted route, in a
 * browser that never enrolled, must still start the engine.
 */
const SELF_ID = "self-profile";

jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("next/navigation", () => ({
  usePathname: () => "/preferences",
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: SELF_ID },
    activeProfileProxy: null,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0xAbCdEf0000000000000000000000000000000001",
  }),
}));
jest.mock("@/components/e2ee/useE2eeEngineDeps", () => {
  const buildDeps = ({ profileId, wallet, api }: Record<string, unknown>) => ({
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
jest.mock("@/components/device-signing/DeviceSecurityStatus", () => ({
  useDeviceSecurityState: () => ({ proof: "on", canEnableEncryption: true }),
}));

describe("BackupCard engine request", () => {
  beforeEach(() => {
    (isE2eeEnabled as jest.Mock).mockReturnValue(true);
    globalThis.localStorage.clear();
  });

  it("starts the engine from a cold Preferences load and leaves loading", async () => {
    const loadModules = jest.fn(
      async (): Promise<E2eeEngineModules> => ({
        createE2eeEngine: async () =>
          createFakeE2eeEngine({ status: "needs-enrollment" }),
        createE2eeApiClient: () => ({}) as never,
      })
    );
    render(
      <E2eeProvider loadModules={loadModules}>
        <main>
          <BackupCard />
        </main>
      </E2eeProvider>
    );

    await waitFor(() => expect(loadModules).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(
        "Backup covers encrypted DMs. Turn them on in this browser first."
      )
    ).toBeVisible();
    expect(screen.queryByText("Checking your backup…")).toBeNull();
  });

  it("asks for nothing once the card is gone", async () => {
    const loadModules = jest.fn(
      async (): Promise<E2eeEngineModules> => ({
        createE2eeEngine: async () =>
          createFakeE2eeEngine({ status: "needs-enrollment" }),
        createE2eeApiClient: () => ({}) as never,
      })
    );
    const { unmount } = render(<BackupCard />);
    unmount();
    render(
      <E2eeProvider loadModules={loadModules}>
        <main />
      </E2eeProvider>
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(loadModules).not.toHaveBeenCalled();
  });
});
