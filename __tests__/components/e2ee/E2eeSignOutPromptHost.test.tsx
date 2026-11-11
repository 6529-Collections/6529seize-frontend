import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  E2eeContext,
  type E2eeContextValue,
} from "@/components/e2ee/E2eeContext";
import { setE2eeEnrollmentMarker } from "@/components/e2ee/e2eeLocalState";
import { E2eeSignOutPromptHost } from "@/components/e2ee/signout/E2eeSignOutPromptHost";
import { signOutWithE2eeChoice } from "@/components/e2ee/signout/e2eeSignOut";
import {
  removeAllE2eeLocalData,
  removeE2eeProfileLocalData,
} from "@/lib/e2ee/local-data";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import { SELF_ID } from "./fakeE2eeEngine";

jest.mock("@/lib/e2ee/local-data", () => ({
  removeAllE2eeLocalData: jest.fn(async () => undefined),
  removeE2eeProfileLocalData: jest.fn(async () => undefined),
}));

const removeAll = removeAllE2eeLocalData as jest.Mock;
const removeProfile = removeE2eeProfileLocalData as jest.Mock;

function renderHost(releaseEngines = jest.fn(async () => undefined)) {
  render(
    <E2eeSignOutPromptHost
      profileId={SELF_ID}
      releaseEngines={releaseEngines}
    />
  );
  return releaseEngines;
}

describe("E2eeSignOutPromptHost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.localStorage.clear();
  });

  it("signs out directly when this browser holds no encrypted messages", async () => {
    renderHost();
    const signOut = jest.fn(async () => undefined);
    await act(() => signOutWithE2eeChoice("all", signOut));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(removeAll).not.toHaveBeenCalled();
  });

  it("sign out of all: removal is on by default and deletes the encrypted databases first", async () => {
    setE2eeEnrollmentMarker(SELF_ID, true);
    globalThis.localStorage.setItem("6529:e2ee:muted:other", "[]");
    const releaseEngines = renderHost();
    const order: string[] = [];
    removeAll.mockImplementation(async () => {
      order.push("remove");
    });
    const signOut = jest.fn(async () => {
      order.push("signOut");
    });

    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = signOutWithE2eeChoice("all", signOut);
    });
    const checkbox = await screen.findByRole("checkbox", {
      name: "Remove encrypted messages from this browser",
    });
    expect(checkbox).toBeChecked();
    expect(
      screen.getByText(/history is lost unless backup is on/)
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await act(() => done);

    expect(releaseEngines).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["remove", "signOut"]);
    expect(
      globalThis.localStorage.getItem(`6529:e2ee:enrolled:${SELF_ID}`)
    ).toBeNull();
    expect(globalThis.localStorage.getItem("6529:e2ee:muted:other")).toBeNull();
  });

  it("normal sign-out: removal is off by default", async () => {
    setE2eeEnrollmentMarker(SELF_ID, true);
    renderHost();
    const signOut = jest.fn(async () => undefined);
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = signOutWithE2eeChoice("profile", signOut);
    });
    const checkbox = await screen.findByRole("checkbox", {
      name: "Remove encrypted messages from this browser",
    });
    expect(checkbox).not.toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await act(() => done);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(removeProfile).not.toHaveBeenCalled();
    expect(
      globalThis.localStorage.getItem(`6529:e2ee:enrolled:${SELF_ID}`)
    ).toBe("1");
  });

  it("normal sign-out with removal deletes only this profile's data", async () => {
    setE2eeEnrollmentMarker(SELF_ID, true);
    setE2eeEnrollmentMarker("profile-other", true);
    renderHost();
    const signOut = jest.fn(async () => undefined);
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = signOutWithE2eeChoice("profile", signOut);
    });
    await userEvent.click(
      await screen.findByRole("checkbox", {
        name: "Remove encrypted messages from this browser",
      })
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await act(() => done);
    expect(removeProfile).toHaveBeenCalledWith(SELF_ID);
    expect(removeAll).not.toHaveBeenCalled();
    expect(
      globalThis.localStorage.getItem("6529:e2ee:enrolled:profile-other")
    ).toBe("1");
  });

  it("keeps the user signed in when removal fails", async () => {
    setE2eeEnrollmentMarker(SELF_ID, true);
    jest.spyOn(console, "error").mockImplementation(() => {});
    removeAll.mockRejectedValueOnce(new Error("blocked"));
    renderHost();
    const signOut = jest.fn(async () => undefined);
    act(() => {
      void signOutWithE2eeChoice("all", signOut);
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Sign out" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You’re still signed in"
    );
    expect(signOut).not.toHaveBeenCalled();
  });

  it("cancel resolves without signing out", async () => {
    setE2eeEnrollmentMarker(SELF_ID, true);
    renderHost();
    const signOut = jest.fn(async () => undefined);
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = signOutWithE2eeChoice("profile", signOut);
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Cancel" })
    );
    await act(() => done);
    expect(signOut).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });
});

describe("E2eeSignOutPromptHost with a loaded engine", () => {
  const snapshot = (
    overrides: Partial<E2eeBackupSnapshot> = {}
  ): E2eeBackupSnapshot => ({
    phase: "on",
    backupCreatedAt: 1,
    backupUpdatedAt: 2,
    usedBytes: 10,
    quotaBytes: 100,
    lastBackupAt: 3,
    busy: false,
    uploading: false,
    lastError: null,
    ...overrides,
  });

  function renderWithEngine(
    options: {
      snapshot?: E2eeBackupSnapshot;
      backupNow?: jest.Mock;
    } = {}
  ) {
    const order: string[] = [];
    const backupNow =
      options.backupNow ??
      jest.fn(async () => {
        order.push("backup");
      });
    const backup = {
      getSnapshot: () => options.snapshot ?? snapshot(),
      backupNow,
    } as unknown as E2eeBackupManager;
    const value: E2eeContextValue = {
      availability: "loaded",
      profileId: SELF_ID,
      engine: null,
      store: null,
      backup,
      loadError: null,
      restart: () => undefined,
      takeOverHere: () => undefined,
    };
    const releaseEngines = jest.fn(async () => {
      order.push("release");
    });
    removeProfile.mockImplementation(async () => {
      order.push("remove");
    });
    render(
      <E2eeContext.Provider value={value}>
        <E2eeSignOutPromptHost
          profileId={SELF_ID}
          releaseEngines={releaseEngines}
        />
      </E2eeContext.Provider>
    );
    const signOut = jest.fn(async () => {
      order.push("signOut");
    });
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = signOutWithE2eeChoice("profile", signOut);
    });
    return { order, backupNow, signOut, done: () => done };
  }

  const removeBox = () =>
    screen.findByRole("checkbox", {
      name: "Remove encrypted messages from this browser",
    });

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.localStorage.clear();
    setE2eeEnrollmentMarker(SELF_ID, true);
  });

  it("removal stays off by default with a current backup, and backs up first when chosen", async () => {
    const run = renderWithEngine();
    expect(await removeBox()).not.toBeChecked();
    expect(screen.getByText(/backup is up to date/)).toBeVisible();
    expect(screen.getByText(/counts as a new device/)).toBeVisible();
    expect(screen.getByText(/You stay a member of your chats/)).toBeVisible();
    await userEvent.click(await removeBox());
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await act(run.done);
    expect(run.order).toEqual(["backup", "release", "remove", "signOut"]);
  });

  it.each([
    ["the backup is off", snapshot({ phase: "off" })],
    ["the first upload is still running", snapshot({ uploading: true })],
    ["the last run failed", snapshot({ lastError: "E2EE_BACKUP_FAILED" })],
  ])(
    "without a current backup (%s) the help says history is lost",
    async (_, current) => {
      renderWithEngine({ snapshot: current });
      expect(await removeBox()).not.toBeChecked();
      expect(
        screen.getByText(/history is lost unless backup is on/)
      ).toBeVisible();
    }
  );

  it("keeps the messages when the backup update fails, and removes them when asked again", async () => {
    const backupNow = jest.fn(async () => {
      throw new Error("offline");
    });
    const run = renderWithEngine({ backupNow });
    await userEvent.click(await removeBox());
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t update your encrypted backup"
    );
    expect(await removeBox()).not.toBeChecked();
    expect(removeProfile).not.toHaveBeenCalled();
    expect(run.signOut).not.toHaveBeenCalled();

    await userEvent.click(await removeBox());
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await act(run.done);
    expect(backupNow).toHaveBeenCalledTimes(1);
    expect(removeProfile).toHaveBeenCalledWith(SELF_ID);
    expect(run.signOut).toHaveBeenCalledTimes(1);
  });

  it("leaves the backup and local data alone when removal is not chosen", async () => {
    const run = renderWithEngine();
    await userEvent.click(
      await screen.findByRole("button", { name: "Sign out" })
    );
    await act(run.done);
    expect(run.backupNow).not.toHaveBeenCalled();
    expect(removeProfile).not.toHaveBeenCalled();
    expect(run.signOut).toHaveBeenCalledTimes(1);
  });
});
