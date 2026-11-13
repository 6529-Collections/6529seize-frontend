import { act, render, screen, waitFor } from "@testing-library/react";
import { useContext, useEffect } from "react";
import DesktopProfileStorageGate from "@/components/desktop/DesktopProfileStorageGate";
import { DesktopProfileRecoveryContext } from "@/contexts/DesktopProfileRecoveryContext";
import {
  getPageDesktopProfileState,
  restoreDesktopProfileState,
} from "@/services/auth/desktop-profile-restore";
import { __resetDesktopProfileStorageForTests } from "@/services/auth/desktop-profile-storage";
import { parseRestoredDesktopProfileState } from "@/services/auth/desktop-profile-state";
import type { DesktopProfileState } from "@/types/desktop-shell";
import { fakeJwt } from "@/__tests__/helpers/fakeJwt";

jest.mock("@/services/auth/desktop-profile-restore", () => {
  const actual = jest.requireActual(
    "@/services/auth/desktop-profile-restore"
  ) as typeof import("@/services/auth/desktop-profile-restore");
  return {
    getPageDesktopProfileState: jest.fn(),
    restoreDesktopProfileState: jest.fn(),
    isSameDesktopProfileState: actual.isSameDesktopProfileState,
  };
});

const ADDRESS = `0x${"1".repeat(40)}`;
const EMPTY: DesktopProfileState = {
  version: 1,
  accounts: [],
  activeAddress: null,
};
const SAVED: DesktopProfileState = {
  version: 1,
  accounts: [
    {
      address: ADDRESS,
      role: null,
      jwt: fakeJwt({ sub: ADDRESS }),
      profileId: null,
      profileHandle: null,
      authSessionVersion: "v2",
      refreshToken: null,
    },
  ],
  activeAddress: ADDRESS,
};

let mounts = 0;
function Child() {
  const recovering = useContext(DesktopProfileRecoveryContext);
  useEffect(() => {
    mounts += 1;
  }, []);
  return <p>{recovering ? "recovering" : "app"}</p>;
}

const createNativeAuth = () => ({
  sessionLogin: jest.fn(),
  restoreProfiles: jest.fn().mockResolvedValue(EMPTY),
  saveProfiles: jest.fn().mockResolvedValue(undefined),
  profilesReady: jest.fn().mockResolvedValue(undefined),
  restartProfileRestore: jest.fn().mockResolvedValue(undefined),
});

let nativeAuth: ReturnType<typeof createNativeAuth>;

const setBridge = (key: "api" | "nativeAuth", value: unknown) => {
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  });
};

const installDesktopShell = () => {
  setBridge("api", { openExternal: jest.fn() });
  setBridge("nativeAuth", nativeAuth);
};

describe("DesktopProfileStorageGate", () => {
  beforeEach(() => {
    mounts = 0;
    __resetDesktopProfileStorageForTests();
    nativeAuth = createNativeAuth();
    jest.mocked(getPageDesktopProfileState).mockReturnValue(EMPTY);
    jest.mocked(restoreDesktopProfileState).mockReset();
    jest
      .mocked(restoreDesktopProfileState)
      .mockImplementation((saved) => parseRestoredDesktopProfileState(saved));
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("renders its children unchanged in a browser", async () => {
    render(
      <DesktopProfileStorageGate>
        <Child />
      </DesktopProfileStorageGate>
    );

    expect(screen.getByText("app")).toBeInTheDocument();
    await act(async () => undefined);
    expect(getPageDesktopProfileState).not.toHaveBeenCalled();
    expect(nativeAuth.restoreProfiles).not.toHaveBeenCalled();
    expect(mounts).toBe(1);
  });

  it("restores the shell's profiles without remounting when nothing changed", async () => {
    installDesktopShell();

    render(
      <DesktopProfileStorageGate>
        <Child />
      </DesktopProfileStorageGate>
    );

    await waitFor(() => expect(nativeAuth.profilesReady).toHaveBeenCalled());
    expect(nativeAuth.restoreProfiles).toHaveBeenCalledWith(EMPTY);
    expect(restoreDesktopProfileState).toHaveBeenCalledWith(EMPTY);
    expect(screen.getByText("app")).toBeInTheDocument();
    expect(mounts).toBe(1);
  });

  it("remounts the app once when the restored profiles differ", async () => {
    installDesktopShell();
    nativeAuth.restoreProfiles.mockResolvedValue(SAVED);

    render(
      <DesktopProfileStorageGate>
        <Child />
      </DesktopProfileStorageGate>
    );

    await waitFor(() => expect(mounts).toBe(2));
    expect(restoreDesktopProfileState).toHaveBeenCalledWith(SAVED);
    expect(nativeAuth.profilesReady).toHaveBeenCalled();
  });

  it("runs signed out and offers a restart when the restore fails", async () => {
    installDesktopShell();
    nativeAuth.restoreProfiles.mockRejectedValue(new Error("keychain"));

    render(
      <DesktopProfileStorageGate>
        <Child />
      </DesktopProfileStorageGate>
    );

    expect(await screen.findByText("recovering")).toBeInTheDocument();
    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent(
      "Your saved profiles could not be opened"
    );
    expect(restoreDesktopProfileState).toHaveBeenCalledWith(EMPTY);
    expect(nativeAuth.profilesReady).toHaveBeenCalled();

    const restart = screen.getByRole("button", {
      name: "Restart to restore profiles",
    });
    expect(restart).toHaveAccessibleDescription(message.textContent ?? "");
    await act(async () => {
      restart.click();
    });
    expect(nativeAuth.restartProfileRestore).toHaveBeenCalledTimes(1);
  });

  it("runs signed out when the shell returns an invalid snapshot", async () => {
    installDesktopShell();
    nativeAuth.restoreProfiles.mockResolvedValue({
      ...SAVED,
      accounts: [
        { ...SAVED.accounts[0], jwt: fakeJwt({ sub: `0x${"2".repeat(40)}` }) },
      ],
    });

    render(
      <DesktopProfileStorageGate>
        <Child />
      </DesktopProfileStorageGate>
    );

    expect(await screen.findByText("recovering")).toBeInTheDocument();
    expect(restoreDesktopProfileState).toHaveBeenLastCalledWith(EMPTY);
  });

  it("returns focus to the focused element after a remount", async () => {
    installDesktopShell();
    let resolveRestore: (state: DesktopProfileState) => void = () => undefined;
    nativeAuth.restoreProfiles.mockReturnValue(
      new Promise((resolve) => {
        resolveRestore = resolve;
      })
    );

    render(
      <DesktopProfileStorageGate>
        <button id="focus-target" type="button">
          Target
        </button>
      </DesktopProfileStorageGate>
    );
    await waitFor(() => expect(nativeAuth.restoreProfiles).toHaveBeenCalled());
    const before = screen.getByRole("button", { name: "Target" });
    before.focus();

    await act(async () => {
      resolveRestore(SAVED);
    });

    const after = screen.getByRole("button", { name: "Target" });
    expect(after).not.toBe(before);
    expect(after).toHaveFocus();
  });

  it("only reports readiness on routes that do not sign in", async () => {
    installDesktopShell();

    render(
      <DesktopProfileStorageGate enabled={false}>
        <Child />
      </DesktopProfileStorageGate>
    );

    await waitFor(() => expect(nativeAuth.profilesReady).toHaveBeenCalled());
    expect(nativeAuth.restoreProfiles).not.toHaveBeenCalled();
    expect(screen.getByText("app")).toBeInTheDocument();
  });
});
