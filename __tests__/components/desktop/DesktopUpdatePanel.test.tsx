import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopUpdateNotice from "@/components/desktop/DesktopUpdateNotice";
import DesktopUpdatePanel from "@/components/desktop/DesktopUpdatePanel";
import { parseDesktopUpdateState } from "@/lib/desktop/updateState";
import { __resetDesktopAutoUpdateForTests } from "@/services/desktop/desktopUpdateState";

type Listener = (event: unknown, payload?: unknown) => void;

const BASE = {
  running: "0.1.0-rc.3",
  check: true,
  auto: true,
  canInstall: true,
  cannotInstallWhy: null,
  checkedAt: 1_800_000_000,
};

const STATES = {
  U1: {
    ...BASE,
    id: "U1",
    state: "up_to_date",
    label: "Up to date",
    headline: "You're on the newest release. Checked 2027-01-15 08:00 UTC.",
  },
  U4: {
    ...BASE,
    auto: false,
    id: "U4",
    state: "available",
    label: "Update available",
    headline: "0.1.0-rc.4 is available.",
    version: "0.1.0-rc.4",
    note: "Automatic updates are off (Settings).",
  },
  U5: {
    ...BASE,
    id: "U5",
    state: "urgent",
    label: "Urgent update",
    headline:
      "0.1.0-rc.4 is an urgent update. Install it before 2027-01-16 00:00 UTC.",
    version: "0.1.0-rc.4",
  },
  U6: {
    ...BASE,
    id: "U6",
    state: "waiting",
    label: "Update available",
    headline:
      "6529 Desktop downloads 0.1.0-rc.4 by itself at about 2027-01-15 09:00 UTC.",
    version: "0.1.0-rc.4",
  },
  U7: {
    ...BASE,
    id: "U7",
    state: "downloading",
    label: "Updating",
    headline: "Downloading 0.1.0-rc.4: 3 MB of 12 MB.",
    version: "0.1.0-rc.4",
  },
  U8: {
    ...BASE,
    id: "U8",
    state: "ready",
    label: "Restart to update",
    headline: "0.1.0-rc.4 is ready to install. Restart 6529 Desktop to finish.",
    version: "0.1.0-rc.4",
  },
  U11: {
    ...BASE,
    id: "U11",
    state: "failed",
    label: "Update failed",
    headline:
      "0.1.0-rc.4 couldn't be installed: the file changed. 6529 Desktop still runs 0.1.0-rc.3.",
    version: "0.1.0-rc.4",
  },
  U14: {
    ...BASE,
    canInstall: false,
    id: "U14",
    state: "cannot_install",
    label: null,
    headline:
      "Updates don't install by themselves now. This is a development build.",
  },
} as const;

const parsed = (key: keyof typeof STATES) => {
  const state = parseDesktopUpdateState(STATES[key]);
  if (!state) throw new Error(key);
  return state;
};

let stateListeners = new Set<Listener>();
const openExternal = jest.fn();

const makeUpdater = (initial: unknown) => ({
  checkUpdates: jest.fn(),
  downloadUpdate: jest.fn(() => Promise.resolve()),
  installUpdate: jest.fn(() => Promise.resolve()),
  getState: jest.fn(() => Promise.resolve(initial)),
  onUpdateState: jest.fn((cb: Listener) => stateListeners.add(cb)),
  offUpdateState: jest.fn((cb: Listener) => stateListeners.delete(cb)),
  setSettings: jest.fn((s: Record<string, boolean>) =>
    Promise.resolve({ ...(initial as object), ...s })
  ),
  onUpdateAvailable: jest.fn(),
  offUpdateAvailable: jest.fn(),
  onUpdateNotAvailable: jest.fn(),
  offUpdateNotAvailable: jest.fn(),
  onUpdateProgress: jest.fn(),
  offUpdateProgress: jest.fn(),
  onUpdateDownloaded: jest.fn(),
  offUpdateDownloaded: jest.fn(),
  onUpdateError: jest.fn(),
  offUpdateError: jest.fn(),
});
let updater: ReturnType<typeof makeUpdater> = makeUpdater(null);

function installAutoHost(
  initial: unknown,
  info = { supportsInAppUpdates: true }
) {
  stateListeners = new Set();
  updater = makeUpdater(initial);

  Object.defineProperty(window, "api", {
    configurable: true,
    value: { openExternal, getInfo: jest.fn(async () => info) },
  });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
  Object.defineProperty(window, "updater", {
    configurable: true,
    value: updater,
  });
}

const emitState = (value: unknown) =>
  act(() => {
    stateListeners.forEach((cb) => cb({}, value));
  });

afterEach(() => {
  __resetDesktopAutoUpdateForTests();
  openExternal.mockReset();
  Reflect.deleteProperty(window, "api");
  Reflect.deleteProperty(window, "nativeAuth");
  Reflect.deleteProperty(window, "updater");
});

describe("DesktopUpdatePanel", () => {
  it("shows the app's sentence, the last check and Check now", async () => {
    installAutoHost(STATES.U1);
    render(<DesktopUpdatePanel state={parsed("U4")} locale="en-US" />);

    expect(
      screen.getByRole("heading", { name: "Updates" })
    ).toBeInTheDocument();
    expect(screen.getByText("0.1.0-rc.4 is available.")).toBeInTheDocument();
    expect(
      screen.getByText("Automatic updates are off (Settings).")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Last checked 2027-01-15 08:00 UTC.")
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Check now" }));
    expect(updater.checkUpdates).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
    await userEvent.click(
      screen.getByRole("button", {
        name: "Release notes for 0.1.0-rc.4 on 6529.io",
      })
    );
    expect(openExternal).toHaveBeenCalledWith(
      "https://6529.io/desktop/releases#0.1.0-rc.4"
    );
  });

  it("does not repeat the check time the up-to-date sentence already has", () => {
    installAutoHost(STATES.U1);
    render(<DesktopUpdatePanel state={parsed("U1")} locale="en-US" />);
    expect(screen.queryByText(/Last checked/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Update now" })
    ).not.toBeInTheDocument();
  });

  it("changes the two settings through the app", async () => {
    installAutoHost(STATES.U1);
    render(<DesktopUpdatePanel state={parsed("U1")} locale="en-US" />);

    const check = screen.getByRole("switch", {
      name: "Check for new releases",
    });
    const auto = screen.getByRole("switch", {
      name: "Install updates automatically",
    });
    expect(check).toHaveAttribute("aria-checked", "true");
    expect(auto).toHaveAttribute("aria-checked", "true");

    await userEvent.click(auto);
    expect(updater.setSettings).toHaveBeenCalledWith({ auto: false });
    await waitFor(() => expect(auto).toBeEnabled());
    await userEvent.click(check);
    expect(updater.setSettings).toHaveBeenLastCalledWith({ check: false });
  });

  it("needs Check for new releases before automatic installs", () => {
    installAutoHost(STATES.U1);
    const off = parseDesktopUpdateState({ ...STATES.U1, check: false });
    render(<DesktopUpdatePanel state={off!} locale="en-US" />);
    const auto = screen.getByRole("switch", {
      name: "Install updates automatically",
    });
    expect(auto).toBeDisabled();
    expect(auto).toHaveAttribute("aria-checked", "false");
    expect(auto).toHaveAccessibleDescription(
      "Turn on Check for new releases first."
    );
  });

  it("says the app's reason when a setting is refused, and a plain one otherwise", async () => {
    installAutoHost(STATES.U1);
    updater.setSettings
      .mockRejectedValueOnce("Please wait a moment and try again.")
      .mockRejectedValueOnce({});
    render(<DesktopUpdatePanel state={parsed("U1")} locale="en-US" />);
    const check = screen.getByRole("switch", {
      name: "Check for new releases",
    });
    await userEvent.click(check);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please wait a moment and try again."
    );
    await waitFor(() => expect(check).toBeEnabled());
    await userEvent.click(check);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "The setting could not be changed. Try again."
      )
    );
  });

  it("says a refused download as the app says it, without retrying", async () => {
    installAutoHost(STATES.U4);
    updater.downloadUpdate.mockRejectedValueOnce(
      "Please wait a moment and try again."
    );
    render(<DesktopUpdatePanel state={parsed("U4")} locale="en-US" />);
    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please wait a moment and try again."
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(/failed|couldn't/);
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
  });

  it("says the update did not start when the app refuses with no usable reason", async () => {
    installAutoHost(STATES.U4);
    updater.downloadUpdate.mockRejectedValueOnce({});
    render(<DesktopUpdatePanel state={parsed("U4")} locale="en-US" />);
    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "6529 Desktop didn't start the update. Try again in a moment."
    );
  });

  it("offers Update now when checks are off and a newer release exists (U13)", async () => {
    installAutoHost(STATES.U1);
    const u13 = parseDesktopUpdateState({
      ...STATES.U4,
      id: "U13",
      check: false,
      headline: "Automatic updates are off (Settings).",
    });
    render(<DesktopUpdatePanel state={u13!} locale="en-US" />);
    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
  });

  it("shows no switches, and the download page, when it cannot update by itself", async () => {
    installAutoHost(STATES.U14);
    render(<DesktopUpdatePanel state={parsed("U14")} locale="en-US" />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Download page on 6529.io" })
    );
    expect(openExternal).toHaveBeenCalledWith("https://6529.io/desktop");
  });

  it("restarts to update, and says why it can't", async () => {
    installAutoHost(STATES.U8);
    updater.installUpdate.mockRejectedValueOnce(
      new Error(
        "A signature request is open. Finish or cancel it, then restart to update."
      )
    );
    render(<DesktopUpdatePanel state={parsed("U8")} locale="en-US" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Restart to update" })
    );
    expect(updater.installUpdate).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "6529 Desktop can't restart to update now. A signature request is open."
    );
  });

  it("shows the release notes before installing, linked to their page", async () => {
    installAutoHost(STATES.U4);
    const withNotes = parseDesktopUpdateState({
      ...STATES.U4,
      releaseNotes: "Faster waves.\nFixes the update notice.",
      notesUrl: "https://6529.io/desktop/releases#0.1.0-rc.4-notes",
    });
    render(<DesktopUpdatePanel state={withNotes!} locale="en-US" />);
    expect(
      screen.getByRole("heading", { name: "What's in 0.1.0-rc.4" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Faster waves\./)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Release notes for 0.1.0-rc.4 on 6529.io",
      })
    );
    expect(openExternal).toHaveBeenCalledWith(
      "https://6529.io/desktop/releases#0.1.0-rc.4-notes"
    );
  });

  it("does not offer Try again after a release went back", () => {
    installAutoHost(STATES.U11);
    const wentBack = parseDesktopUpdateState({
      ...STATES.U11,
      state: "went_back",
      headline:
        "0.1.0-rc.4 didn't run properly, so 6529 Desktop went back to 0.1.0-rc.3.",
    });
    render(<DesktopUpdatePanel state={wentBack!} locale="en-US" />);
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check now" })).toBeVisible();
  });

  it("says the app took Try again, and shows its wait as a refusal", async () => {
    installAutoHost(STATES.U11);
    render(<DesktopUpdatePanel state={parsed("U11")} locale="en-US" />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "6529 Desktop is checking the release list."
    );
    updater.downloadUpdate.mockRejectedValueOnce(
      "The last download failed. Try again after 2027-01-15 08:11 UTC."
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The last download failed. Try again after 2027-01-15 08:11 UTC."
    );
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(2);
  });

  it("clears a refusal once the state changes, even if the state comes back", async () => {
    installAutoHost(STATES.U4);
    updater.downloadUpdate.mockRejectedValueOnce(
      "Please wait a moment and try again."
    );
    const { rerender } = render(
      <DesktopUpdatePanel state={parsed("U4")} locale="en-US" />
    );
    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please wait a moment and try again."
    );
    rerender(<DesktopUpdatePanel state={parsed("U7")} locale="en-US" />);
    rerender(<DesktopUpdatePanel state={parsed("U4")} locale="en-US" />);
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("drops an answer to an action taken in an earlier state", async () => {
    installAutoHost(STATES.U4);
    let refuse: (reason: unknown) => void = () => undefined;
    updater.downloadUpdate.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        refuse = reject;
      })
    );
    const { rerender } = render(
      <DesktopUpdatePanel state={parsed("U4")} locale="en-US" />
    );
    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    rerender(<DesktopUpdatePanel state={parsed("U8")} locale="en-US" />);
    await act(async () => {
      refuse("Please wait a moment and try again.");
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("drops a late answer even when the earlier state came back", async () => {
    installAutoHost(STATES.U4);
    let refuse: (reason: unknown) => void = () => undefined;
    updater.downloadUpdate.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        refuse = reject;
      })
    );
    const { rerender } = render(
      <DesktopUpdatePanel state={parsed("U4")} locale="en-US" />
    );
    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    rerender(<DesktopUpdatePanel state={parsed("U7")} locale="en-US" />);
    rerender(<DesktopUpdatePanel state={parsed("U4")} locale="en-US" />);
    await act(async () => {
      refuse("Please wait a moment and try again.");
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("drops a settings refusal that arrives after the state changed", async () => {
    installAutoHost(STATES.U1);
    let refuse: (reason: unknown) => void = () => undefined;
    updater.setSettings.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        refuse = reject;
      })
    );
    const { rerender } = render(
      <DesktopUpdatePanel state={parsed("U1")} locale="en-US" />
    );
    await userEvent.click(
      screen.getByRole("switch", { name: "Check for new releases" })
    );
    rerender(<DesktopUpdatePanel state={parsed("U4")} locale="en-US" />);
    await act(async () => {
      refuse("Please wait a moment and try again.");
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("offers Try again after a failed update", async () => {
    installAutoHost(STATES.U11);
    render(<DesktopUpdatePanel state={parsed("U11")} locale="en-US" />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
  });
});

describe("DesktopUpdateNotice in a build that installs its own updates", () => {
  it("shows a newer release, updates on Update now and follows the download", async () => {
    installAutoHost(STATES.U4);
    render(<DesktopUpdateNotice />);

    const notice = await screen.findByRole("region");
    expect(notice).toHaveTextContent("0.1.0-rc.4 is available.");
    await userEvent.click(
      within(notice).getByRole("button", { name: "Update now" })
    );
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);

    emitState(STATES.U7);
    expect(screen.getByRole("region")).toHaveTextContent(
      "Downloading 0.1.0-rc.4: 3 MB of 12 MB."
    );
    emitState(STATES.U8);
    await userEvent.click(
      screen.getByRole("button", { name: "Restart to update" })
    );
    expect(updater.installUpdate).toHaveBeenCalledTimes(1);
  });

  it("hides on Not now until the state changes", async () => {
    installAutoHost(STATES.U4);
    render(<DesktopUpdateNotice />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Not now" })
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    emitState(STATES.U8);
    expect(await screen.findByRole("region")).toHaveTextContent(
      "ready to install"
    );
  });

  it("shows a state again when it comes back after a change", async () => {
    installAutoHost(STATES.U4);
    render(<DesktopUpdateNotice />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Not now" })
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    emitState(STATES.U1);
    emitState(STATES.U4);
    expect(await screen.findByRole("region")).toHaveTextContent(
      "0.1.0-rc.4 is available."
    );
  });

  it("keeps keyboard focus in the notice when its button goes away", async () => {
    installAutoHost(STATES.U4);
    render(<DesktopUpdateNotice />);
    const button = await screen.findByRole("button", { name: "Update now" });
    button.focus();
    await userEvent.keyboard("{Enter}");
    emitState(STATES.U7);
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("leaves focus where the person moved it before the state changed", async () => {
    installAutoHost(STATES.U4);
    render(
      <>
        <button type="button">Elsewhere</button>
        <DesktopUpdateNotice />
      </>
    );
    const button = await screen.findByRole("button", { name: "Update now" });
    button.focus();
    await userEvent.keyboard("{Enter}");
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();
    emitState(STATES.U7);
    expect(elsewhere).toHaveFocus();
  });

  it("keeps focus on Not now after a refused update and a state change", async () => {
    installAutoHost(STATES.U4);
    updater.downloadUpdate.mockRejectedValueOnce(
      "Please wait a moment and try again."
    );
    render(<DesktopUpdateNotice />);
    const button = await screen.findByRole("button", { name: "Update now" });
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please wait a moment and try again."
    );
    const notNow = screen.getByRole("button", { name: "Not now" });
    notNow.focus();
    emitState(STATES.U8);
    expect(screen.getByRole("button", { name: "Not now" })).toHaveFocus();
  });

  it("keeps following a download started here across a remount", async () => {
    installAutoHost(STATES.U4);
    const first = render(<DesktopUpdateNotice />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Update now" })
    );
    first.unmount();
    updater.getState.mockResolvedValue(STATES.U7);
    render(<DesktopUpdateNotice />);
    expect(await screen.findByRole("region")).toHaveTextContent(
      "Downloading 0.1.0-rc.4"
    );
  });

  it("offers Not now on a plain urgent update, not on one the person must install", async () => {
    installAutoHost({ ...STATES.U5, mustUpdate: false, mustUpdateWhy: null });
    const { unmount } = render(<DesktopUpdateNotice />);
    expect(
      await screen.findByRole("button", { name: "Not now" })
    ).toBeInTheDocument();
    unmount();
    __resetDesktopAutoUpdateForTests();
    installAutoHost({
      ...STATES.U5,
      mustUpdate: true,
      mustUpdateWhy: "below_minimum",
    });
    render(<DesktopUpdateNotice />);
    expect(await screen.findByRole("region")).toHaveTextContent(
      "is an urgent update"
    );
    expect(
      screen.queryByRole("button", { name: "Not now" })
    ).not.toBeInTheDocument();
  });

  it("shows a state again when it becomes one the person must act on", async () => {
    installAutoHost({ ...STATES.U5, mustUpdate: false, mustUpdateWhy: null });
    render(<DesktopUpdateNotice />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Not now" })
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    emitState({ ...STATES.U5, mustUpdate: true, mustUpdateWhy: "unsafe" });
    expect(await screen.findByRole("region")).toHaveTextContent(
      "is an urgent update"
    );
  });

  it("does not follow an app-started download after its own request was refused", async () => {
    installAutoHost(STATES.U4);
    updater.downloadUpdate.mockRejectedValueOnce(
      "Please wait a moment and try again."
    );
    const { container } = render(<DesktopUpdateNotice />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Update now" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please wait a moment and try again."
    );
    emitState(STATES.U7);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps following a download when an earlier request is refused later", async () => {
    installAutoHost(STATES.U4);
    let refuseFirst: (reason: unknown) => void = () => undefined;
    updater.downloadUpdate
      .mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          refuseFirst = reject;
        })
      )
      .mockResolvedValueOnce(undefined);
    render(<DesktopUpdateNotice />);
    const button = await screen.findByRole("button", { name: "Update now" });
    await userEvent.click(button);
    await userEvent.click(screen.getByRole("button", { name: "Update now" }));
    await act(async () => {
      refuseFirst("Please wait a moment and try again.");
      await Promise.resolve();
    });
    emitState(STATES.U7);
    expect(screen.getByRole("region")).toHaveTextContent(
      "Downloading 0.1.0-rc.4"
    );
  });

  it("keeps an urgent update on screen (no Not now)", async () => {
    installAutoHost(STATES.U5);
    render(<DesktopUpdateNotice />);
    expect(await screen.findByRole("region")).toHaveTextContent(
      "is an urgent update"
    );
    expect(
      screen.queryByRole("button", { name: "Not now" })
    ).not.toBeInTheDocument();
  });

  it.each(["U1", "U6", "U7", "U14"] as const)(
    "stays quiet for %s",
    async (key) => {
      installAutoHost(STATES[key]);
      const { container } = render(<DesktopUpdateNotice />);
      await act(async () => {
        await Promise.resolve();
      });
      expect(container).toBeEmptyDOMElement();
    }
  );

  it("leaves 0.1.0-rc.2 hosts on the earlier notice", async () => {
    installAutoHost(STATES.U4, { supportsInAppUpdates: false });
    render(<DesktopUpdateNotice />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(updater.checkUpdates).toHaveBeenCalled();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(updater.getState).not.toHaveBeenCalled();
  });
});
