import {
  __resetDesktopBrowserWalletForTests,
  cancelDesktopWalletRequest,
  desktopWalletAcceptsContext,
  dismissDesktopWalletRequestStatus,
  forgetAllBrowserWalletProfiles,
  forgetBrowserWalletProfile,
  getDesktopWalletMethods,
  getDesktopWalletRequestStatus,
  isBrowserWalletProfile,
  loadBrowserWalletProfiles,
  markBrowserWalletProfile,
  reopenDesktopWalletRequest,
  runDesktopWalletRequest,
  showDesktopWalletRefusal,
  subscribeBrowserWalletProfiles,
  watchDesktopWalletStatus,
} from "@/services/desktop/desktopBrowserWallet";
import {
  getDesktopShellApi,
  getDesktopStore,
  getDesktopWallet,
} from "@/helpers/desktop-shell";

jest.mock("@/helpers/desktop-shell", () => ({
  getDesktopShellApi: jest.fn(),
  getDesktopStore: jest.fn(),
  getDesktopWallet: jest.fn(),
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";
const OTHER = "0x2222222222222222222222222222222222222222";
const SIGNATURE = `0x${"ab".repeat(65)}`;
const REQUEST = {
  method: "personal_sign",
  params: ["0x6869", ADDRESS],
  address: ADDRESS,
  chainId: 1,
};

const store = { get: jest.fn(), set: jest.fn(), remove: jest.fn() };
const api = { getInfo: jest.fn() };
let statusListener: ((status: unknown) => void) | null = null;
const bridge = {
  request: jest.fn(),
  cancel: jest.fn(),
  reopen: jest.fn(),
  status: jest.fn(),
  capabilities: jest.fn(),
  onStatusChange: jest.fn((callback: (status: unknown) => void) => {
    statusListener = callback;
    return () => {
      statusListener = null;
    };
  }),
};

describe("desktopBrowserWallet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetDesktopBrowserWalletForTests();
    jest.mocked(getDesktopStore).mockReturnValue(store);
    jest.mocked(getDesktopWallet).mockReturnValue(bridge);
    jest.mocked(getDesktopShellApi).mockReturnValue(api as never);
    store.get.mockResolvedValue(undefined);
    store.set.mockResolvedValue(undefined);
    bridge.cancel.mockResolvedValue(undefined);
    bridge.reopen.mockResolvedValue(undefined);
    bridge.status.mockResolvedValue({ pending: false });
    api.getInfo.mockResolvedValue({ supportsWalletForwarding: true });
    bridge.capabilities.mockResolvedValue({
      version: 1,
      methods: ["personal_sign", "eth_signTypedData_v4"],
    });
  });

  describe("browser-wallet profiles", () => {
    it("loads valid addresses from the shell store", async () => {
      store.get.mockResolvedValue([ADDRESS, "nope", 42]);
      await loadBrowserWalletProfiles();
      expect(store.get).toHaveBeenCalledWith("desktop-browser-wallet-profiles");
      expect(
        isBrowserWalletProfile(ADDRESS.toUpperCase().replace("0X", "0x"))
      ).toBe(true);
      expect(isBrowserWalletProfile("nope")).toBe(false);
      expect(isBrowserWalletProfile(null)).toBe(false);
    });

    it("publishes eligibility changes for an already mounted connector", async () => {
      const changes: boolean[] = [];
      const unsubscribe = subscribeBrowserWalletProfiles(() => {
        changes.push(isBrowserWalletProfile(ADDRESS));
      });
      await loadBrowserWalletProfiles();
      await markBrowserWalletProfile(ADDRESS);
      await forgetBrowserWalletProfile(ADDRESS);
      unsubscribe();
      await markBrowserWalletProfile(ADDRESS);
      expect(changes).toEqual([false, true, false]);
    });

    it("remembers and forgets a profile and never throws", async () => {
      await markBrowserWalletProfile(ADDRESS);
      await markBrowserWalletProfile(ADDRESS);
      expect(store.set).toHaveBeenCalledTimes(1);
      expect(store.set).toHaveBeenLastCalledWith(
        "desktop-browser-wallet-profiles",
        [ADDRESS]
      );
      expect(isBrowserWalletProfile(ADDRESS)).toBe(true);

      await forgetBrowserWalletProfile(ADDRESS);
      expect(isBrowserWalletProfile(ADDRESS)).toBe(false);
      expect(store.set).toHaveBeenLastCalledWith(
        "desktop-browser-wallet-profiles",
        []
      );

      store.set.mockRejectedValue(new Error("disk full"));
      await expect(markBrowserWalletProfile(OTHER)).resolves.toBeUndefined();
      await expect(forgetBrowserWalletProfile(OTHER)).resolves.toBeUndefined();
      await expect(
        markBrowserWalletProfile("not an address")
      ).resolves.toBeUndefined();
    });

    it("does not offer forwarding to a later sign-in of the same address another way", async () => {
      // A store that keeps what is written, as the shell's does.
      let stored: unknown;
      store.get.mockImplementation(async () => stored);
      store.set.mockImplementation(async (_key: string, value: unknown) => {
        stored = value;
      });
      await markBrowserWalletProfile(ADDRESS);
      expect(isBrowserWalletProfile(ADDRESS)).toBe(true);

      // Logout forgets it.
      await forgetBrowserWalletProfile(ADDRESS);
      // The app restarts, the same address signs in with WalletConnect (no
      // mark): it is not a browser-wallet profile.
      __resetDesktopBrowserWalletForTests();
      jest.mocked(getDesktopStore).mockReturnValue(store);
      await loadBrowserWalletProfiles();
      expect(isBrowserWalletProfile(ADDRESS)).toBe(false);
      expect(stored).toEqual([]);
    });

    it("forgets every profile on sign-out of all profiles, even unread", async () => {
      store.get.mockResolvedValue([ADDRESS, OTHER]);
      await loadBrowserWalletProfiles();
      expect(isBrowserWalletProfile(OTHER)).toBe(true);
      await forgetAllBrowserWalletProfiles();
      expect(isBrowserWalletProfile(ADDRESS)).toBe(false);
      expect(isBrowserWalletProfile(OTHER)).toBe(false);
      expect(store.set).toHaveBeenLastCalledWith(
        "desktop-browser-wallet-profiles",
        []
      );

      // Never throws, with no store or a failing one.
      store.set.mockRejectedValue(new Error("disk full"));
      await expect(forgetAllBrowserWalletProfiles()).resolves.toBeUndefined();
      jest.mocked(getDesktopStore).mockReturnValue(null);
      await expect(forgetAllBrowserWalletProfiles()).resolves.toBeUndefined();
    });

    it("offers nothing from an unreadable store and never overwrites it", async () => {
      store.get.mockRejectedValue(new Error("locked"));
      await loadBrowserWalletProfiles();
      expect(isBrowserWalletProfile(ADDRESS)).toBe(false);

      // Marking retries the read; while it keeps failing, nothing is written
      // (writing would erase other profiles' entries).
      await markBrowserWalletProfile(OTHER);
      expect(store.set).not.toHaveBeenCalled();
      await forgetBrowserWalletProfile(ADDRESS);
      expect(store.set).not.toHaveBeenCalled();

      // Once the store reads again, the existing entries are kept.
      store.get.mockResolvedValue([ADDRESS]);
      await markBrowserWalletProfile(OTHER);
      expect(store.set).toHaveBeenCalledWith(
        "desktop-browser-wallet-profiles",
        [ADDRESS, OTHER]
      );
    });
  });

  describe("capabilities", () => {
    it("needs the shell to advertise forwarding and name methods", async () => {
      await expect(getDesktopWalletMethods()).resolves.toEqual([
        "personal_sign",
        "eth_signTypedData_v4",
      ]);
      api.getInfo.mockResolvedValue({});
      await expect(getDesktopWalletMethods()).resolves.toEqual([]);
      api.getInfo.mockResolvedValue({ supportsWalletForwarding: "yes" });
      await expect(getDesktopWalletMethods()).resolves.toEqual([]);
      api.getInfo.mockRejectedValue(new Error("ipc"));
      await expect(getDesktopWalletMethods()).resolves.toEqual([]);
      jest.mocked(getDesktopWallet).mockReturnValue(null);
      await expect(getDesktopWalletMethods()).resolves.toEqual([]);
    });

    it("sends context only to a shell that says it accepts it", async () => {
      await getDesktopWalletMethods();
      expect(desktopWalletAcceptsContext()).toBe(false);
      bridge.capabilities.mockResolvedValue({
        version: 1,
        methods: ["personal_sign"],
        context: true,
      });
      await getDesktopWalletMethods();
      expect(desktopWalletAcceptsContext()).toBe(true);
      bridge.capabilities.mockResolvedValue({
        version: 1,
        methods: ["personal_sign"],
        context: "yes",
      });
      await getDesktopWalletMethods();
      expect(desktopWalletAcceptsContext()).toBe(false);
    });
  });

  describe("status", () => {
    it("shows the shell's request code while a request is open", async () => {
      watchDesktopWalletStatus();
      watchDesktopWalletStatus();
      expect(bridge.onStatusChange).toHaveBeenCalledTimes(1);
      statusListener?.({
        pending: true,
        code: "ABC-123",
        method: "personal_sign",
        expiresAt: 1_800_000_000_000,
      });
      expect(getDesktopWalletRequestStatus()).toEqual({
        kind: "waiting",
        requestCode: "ABC-123",
        expiresAt: 1_800_000_000_000,
        fingerprint: null,
      });
      statusListener?.({ pending: false });
      expect(getDesktopWalletRequestStatus()).toEqual({ kind: "idle" });
      statusListener?.({ pending: true, code: "bad" });
      expect(getDesktopWalletRequestStatus()).toEqual({ kind: "idle" });
    });

    it("ignores a status snapshot older than an event", async () => {
      let resolveSnapshot: (value: unknown) => void = () => undefined;
      bridge.status.mockReturnValue(
        new Promise((resolve) => {
          resolveSnapshot = resolve;
        })
      );
      watchDesktopWalletStatus();
      statusListener?.({
        pending: true,
        code: "ABC-123",
        method: "personal_sign",
        expiresAt: 1_800_000_000_000,
      });
      resolveSnapshot({ pending: false });
      await Promise.resolve();
      await Promise.resolve();
      expect(getDesktopWalletRequestStatus()).toMatchObject({
        kind: "waiting",
        requestCode: "ABC-123",
      });
    });
  });

  describe("runDesktopWalletRequest", () => {
    it("returns the signature with no message", async () => {
      bridge.request.mockResolvedValue({ ok: true, value: SIGNATURE });
      await expect(runDesktopWalletRequest(REQUEST)).resolves.toEqual({
        ok: true,
        value: SIGNATURE,
      });
      expect(bridge.request).toHaveBeenCalledWith(REQUEST);
      expect(getDesktopWalletRequestStatus()).toEqual({ kind: "idle" });
    });

    it.each([
      [{ ok: false, code: "cancelled" }, "cancelled"],
      [{ ok: false, code: "expired" }, "expired"],
      [{ ok: false, code: "busy" }, "busy"],
      [{ ok: false, code: "refused" }, "refused"],
      [{ ok: false, code: "unsupported" }, "refused"],
      [{ ok: false, code: "invalid", reason: "too-large" }, "refused"],
      [
        { ok: false, code: "failed", reason: "unverified-signature" },
        "unverified",
      ],
      [{ ok: false, code: "failed" }, "failed"],
      [{ ok: false, code: "not-signed-in" }, "failed"],
      [{ ok: false, code: "rejected" }, "idle"],
      ["garbage", "failed"],
    ])("reports %j as %s", async (answer, kind) => {
      bridge.request.mockResolvedValue(answer);
      const response = await runDesktopWalletRequest(REQUEST);
      expect(response.ok).toBe(false);
      expect(getDesktopWalletRequestStatus()).toEqual({ kind });
      dismissDesktopWalletRequestStatus();
      expect(getDesktopWalletRequestStatus()).toEqual({ kind: "idle" });
    });

    it("keeps the open request's dialog when a second one is refused busy", async () => {
      watchDesktopWalletStatus();
      let answerFirst: (value: unknown) => void = () => undefined;
      bridge.request
        .mockReturnValueOnce(
          new Promise((resolve) => {
            answerFirst = resolve;
          })
        )
        .mockResolvedValueOnce({ ok: false, code: "busy" });
      const first = runDesktopWalletRequest(REQUEST);
      statusListener?.({
        pending: true,
        code: "ABC-123",
        method: "personal_sign",
        expiresAt: 1_800_000_000_000,
      });
      await expect(runDesktopWalletRequest(REQUEST)).resolves.toEqual({
        ok: false,
        code: "busy",
      });
      expect(getDesktopWalletRequestStatus()).toMatchObject({
        kind: "waiting",
        requestCode: "ABC-123",
      });
      showDesktopWalletRefusal();
      expect(getDesktopWalletRequestStatus()).toMatchObject({
        kind: "waiting",
      });

      statusListener?.({ pending: false });
      answerFirst({ ok: false, code: "expired" });
      await first;
      expect(getDesktopWalletRequestStatus()).toEqual({ kind: "expired" });
    });

    it("shows the open request's content fingerprint with its code", async () => {
      watchDesktopWalletStatus();
      let answer: (value: unknown) => void = () => undefined;
      bridge.request.mockReturnValueOnce(
        new Promise((resolve) => {
          answer = resolve;
        })
      );
      const running = runDesktopWalletRequest(REQUEST, "2c26b46b…6266e7ae");
      statusListener?.({
        pending: true,
        code: "ABC-123",
        method: "personal_sign",
        expiresAt: 1_800_000_000_000,
      });
      expect(getDesktopWalletRequestStatus()).toMatchObject({
        kind: "waiting",
        fingerprint: "2c26b46b…6266e7ae",
      });
      answer({ ok: true, value: SIGNATURE });
      await running;
      // A later status without a request of this app's has no fingerprint.
      statusListener?.({
        pending: true,
        code: "DEF-456",
        method: "personal_sign",
        expiresAt: 1_800_000_000_000,
      });
      expect(getDesktopWalletRequestStatus()).toMatchObject({
        fingerprint: null,
      });
    });

    it("fails cleanly when the bridge throws, and is unsupported without it", async () => {
      bridge.request.mockRejectedValue(new Error("ipc"));
      await expect(runDesktopWalletRequest(REQUEST)).resolves.toEqual({
        ok: false,
        code: "failed",
      });
      jest.mocked(getDesktopWallet).mockReturnValue(null);
      await expect(runDesktopWalletRequest(REQUEST)).resolves.toEqual({
        ok: false,
        code: "unsupported",
      });
    });
  });

  it("shows an in-app refusal and forwards cancel and reopen", () => {
    showDesktopWalletRefusal();
    expect(getDesktopWalletRequestStatus()).toEqual({ kind: "refused" });
    cancelDesktopWalletRequest();
    reopenDesktopWalletRequest();
    expect(bridge.cancel).toHaveBeenCalled();
    expect(bridge.reopen).toHaveBeenCalled();
  });
});
