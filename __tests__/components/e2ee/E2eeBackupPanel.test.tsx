import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { requestE2eeBackupSetup } from "@/components/e2ee/backup/backupSetupRequest";
import { E2eeBackupPanel } from "@/components/e2ee/backup/E2eeBackupPanel";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import { BackupError } from "@/lib/e2ee/backup/errors";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
import {
  contextFor,
  createFakeE2eeEngine,
  device,
  E2eeTestProvider,
} from "./fakeE2eeEngine";

const THIS_DEVICE = device({
  deviceKey: `0x${"1".repeat(64)}`,
  isThisDevice: true,
});

const CODE =
  "ABCD-EFGH-JKMN-PQRS-TVWX-YZ01-2345-6789-ABCD-EFGH-JKMN-PQRS-TVWX-YZ01";

function snapshot(patch: Partial<E2eeBackupSnapshot> = {}): E2eeBackupSnapshot {
  return {
    phase: "off",
    backupCreatedAt: null,
    backupUpdatedAt: null,
    usedBytes: 0,
    quotaBytes: 256 * 1024 * 1024,
    lastBackupAt: null,
    busy: false,
    uploading: false,
    lastError: null,
    ...patch,
  };
}

function fakeManager(initial: E2eeBackupSnapshot) {
  let current = initial;
  const listeners = new Set<() => void>();
  const manager = {
    getSnapshot: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next: E2eeBackupSnapshot) {
      current = next;
      listeners.forEach((listener) => listener());
    },
    prepareBackup: jest.fn(async () => ({
      code: CODE,
      secret: new Uint8Array(32),
    })),
    confirmBackup: jest.fn(async () => {
      manager.set(snapshot({ phase: "on", lastBackupAt: Date.now() }));
    }),
    restore: jest.fn(async (code: string) => {
      if (code.trim() !== CODE) {
        throw new BackupError("E2EE_BACKUP_WRONG_CODE");
      }
      return { conversations: 2, messages: 5 };
    }),
    backupNow: jest.fn(async () => undefined),
    turnOff: jest.fn(async () => {
      manager.set(snapshot({ phase: "off" }));
    }),
    refresh: jest.fn(async () => undefined),
  };
  return manager;
}

function renderPanel(
  manager: ReturnType<typeof fakeManager>,
  devices = [THIS_DEVICE]
) {
  const engine = createFakeE2eeEngine({ devices });
  return render(
    <E2eeTestProvider
      value={contextFor(engine, {
        backup: manager as unknown as E2eeBackupManager,
      })}
    >
      <E2eeBackupPanel />
    </E2eeTestProvider>
  );
}

describe("E2eeBackupPanel", () => {
  it("keeps the no-backup warning while backups are unavailable", () => {
    const engine = createFakeE2eeEngine();
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeBackupPanel />
      </E2eeTestProvider>
    );
    expect(
      screen.getByText(/unless you turn on encrypted backup/)
    ).toBeInTheDocument();
  });

  it("shows the recovery code once and turns backup on only after the user confirms saving it", async () => {
    const manager = fakeManager(snapshot());
    renderPanel(manager);
    expect(
      screen.getByRole("heading", { name: "Encrypted backup" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Backup is off/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Turn on backup" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Save your recovery code",
    });
    expect(dialog).toHaveTextContent(CODE);
    const confirm = screen
      .getAllByRole("button", { name: "Turn on backup" })
      .find((button) => dialog.contains(button))!;
    expect(confirm).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "I saved my recovery code somewhere safe",
      })
    );
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(manager.confirmBackup).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Backup is on.")).toBeInTheDocument();
    expect(screen.queryByText(CODE)).not.toBeInTheDocument();
  });

  it("restores with the code and explains a wrong code", async () => {
    const manager = fakeManager(snapshot({ phase: "available" }));
    renderPanel(manager);
    fireEvent.click(screen.getByRole("button", { name: "Restore messages" }));
    await screen.findByRole("dialog", { name: "Restore messages" });
    const input = screen.getByLabelText("Recovery code");
    fireEvent.change(input, { target: { value: "WRONG-CODE" } });
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That recovery code doesn’t open this backup."
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(input, { target: { value: CODE } });
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(
      await screen.findByText("Restored 5 messages from your backup.")
    ).toBeInTheDocument();
  });

  describe("rotation warning (F-03)", () => {
    const BACKUP_CREATED = Date.UTC(2026, 10, 9, 14, 46);
    const HOUR_MS = 60 * 60 * 1000;
    const revoked = (patch: Partial<E2eeDeviceInfo>) =>
      device({
        deviceKey: `0x${"9".repeat(64)}`,
        label: "Old iPhone",
        revokedAt: BACKUP_CREATED + 2 * HOUR_MS,
        ...patch,
      });

    const backupOn = () =>
      fakeManager(
        snapshot({
          phase: "on",
          backupCreatedAt: BACKUP_CREATED,
          lastBackupAt: BACKUP_CREATED,
        })
      );

    it("warns for a device revoked after the backup was created, even if last seen before it", () => {
      // A device can restore the backup and keep its key without its
      // last-seen time moving, so that time can't rule it out.
      renderPanel(backupOn(), [
        THIS_DEVICE,
        revoked({ lastSeenAt: BACKUP_CREATED - HOUR_MS }),
      ]);
      expect(screen.getByText("Replace your recovery code")).toBeVisible();
      expect(
        screen.getByText(
          /^You revoked Old iPhone on \w{3} \d{1,2}, 2026, after this backup was set up\./
        )
      ).toBeVisible();
    });

    it("stays quiet for devices revoked before the backup was created", () => {
      renderPanel(backupOn(), [
        THIS_DEVICE,
        revoked({ revokedAt: BACKUP_CREATED - HOUR_MS }),
      ]);
      expect(
        screen.queryByText("Replace your recovery code")
      ).not.toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: "Replace recovery code" })
      ).toHaveLength(1);
    });

    it("names the revoked device and offers one replace action", async () => {
      renderPanel(backupOn(), [
        THIS_DEVICE,
        revoked({ lastSeenAt: BACKUP_CREATED + HOUR_MS }),
      ]);
      const replace = screen.getAllByRole("button", {
        name: "Replace recovery code",
      });
      expect(replace).toHaveLength(1);
      fireEvent.click(replace[0]!);
      expect(
        await screen.findByRole("dialog", {
          name: "Save your new recovery code",
        })
      ).toBeInTheDocument();
    });

    it("folds several revoked devices into one warning with their count", () => {
      renderPanel(backupOn(), [
        THIS_DEVICE,
        revoked({ lastSeenAt: BACKUP_CREATED - HOUR_MS }),
        revoked({
          deviceKey: `0x${"8".repeat(64)}`,
          label: "Firefox on Linux",
          lastSeenAt: null,
        }),
        revoked({
          deviceKey: `0x${"7".repeat(64)}`,
          label: "Brave on Windows",
          lastSeenAt: BACKUP_CREATED + HOUR_MS,
        }),
      ]);
      expect(screen.getAllByText("Replace your recovery code")).toHaveLength(1);
      expect(
        screen.getByText(/^You revoked 3 devices after this backup was set up\./)
      ).toBeVisible();
      expect(
        screen.getAllByRole("button", { name: "Replace recovery code" })
      ).toHaveLength(1);
    });
  });

  it("turns backup off only through the More menu and its confirmation (F-09)", async () => {
    const user = userEvent.setup();
    const manager = fakeManager(snapshot({ phase: "on", lastBackupAt: 2000 }));
    renderPanel(manager);
    expect(
      screen.queryByRole("button", { name: /Turn off backup/ })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "More backup options" })
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Turn off backup…" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Turn off backup?",
    });
    expect(dialog).toHaveTextContent(
      "If this browser clears its data later, those messages can’t be restored."
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Turn off backup" })
    );
    await waitFor(() => expect(manager.turnOff).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Backup is off/)).toBeInTheDocument();
  });

  it.each([
    [0, "0 kB of 256 MB used"],
    [3000, "3 kB of 256 MB used"],
    [1536 * 1024, "1.5 MB of 256 MB used"],
  ])(
    "shows %d bytes in sensible units (F-08)",
    (usedBytes: number, text: string) => {
      renderPanel(
        fakeManager(snapshot({ phase: "on", lastBackupAt: 2000, usedBytes }))
      );
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  );

  it("folds the back-up-now result into the status line and clears it (F-08)", async () => {
    jest.useFakeTimers();
    try {
      const manager = fakeManager(
        snapshot({ phase: "on", lastBackupAt: 2000 })
      );
      renderPanel(manager);
      fireEvent.click(screen.getByRole("button", { name: "Back up now" }));
      const status = await screen.findByRole("status");
      await waitFor(() =>
        expect(status).toHaveTextContent("Backup is up to date.")
      );
      expect(screen.queryByText("Backed up")).not.toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(6000);
      });
      expect(status).toHaveTextContent("");
    } finally {
      jest.useRealTimers();
    }
  });

  it("asks before starting over without restoring, naming the data loss (F-05)", async () => {
    const manager = fakeManager(snapshot({ phase: "available" }));
    renderPanel(manager);
    expect(
      screen.queryByRole("button", { name: "Start a new backup" })
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Lost your recovery code?" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Start a new backup without restoring?",
    });
    expect(dialog).toHaveTextContent(
      "Starting over deletes it, including messages that aren’t on this browser. You can’t undo this."
    );
    expect(manager.prepareBackup).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Delete old backup and start over",
      })
    );
    const code = await screen.findByRole("dialog", {
      name: "Save your new recovery code",
    });
    expect(manager.prepareBackup).toHaveBeenCalledTimes(1);
    expect(code).toHaveTextContent(
      "Messages that are in your backup but not on this browser won’t be in the new backup."
    );
  });

  it("keeps the start-over dialog open with the backup's own error when preparing fails", async () => {
    const manager = fakeManager(snapshot({ phase: "available" }));
    manager.prepareBackup.mockRejectedValueOnce(
      new BackupError("E2EE_RATE_LIMITED")
    );
    renderPanel(manager);
    fireEvent.click(
      screen.getByRole("button", { name: "Lost your recovery code?" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Start a new backup without restoring?",
    });
    const confirm = within(dialog).getByRole("button", {
      name: "Delete old backup and start over",
    });
    fireEvent.click(confirm);
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Too many backup requests. Try again later."
    );
    expect(confirm).toBeEnabled();
    expect(
      screen.queryByRole("dialog", { name: "Save your new recovery code" })
    ).not.toBeInTheDocument();

    fireEvent.click(confirm);
    expect(
      await screen.findByRole("dialog", { name: "Save your new recovery code" })
    ).toBeInTheDocument();
    expect(manager.prepareBackup).toHaveBeenCalledTimes(2);
  });

  it("starts setup when another part of the page asks while backup is off", async () => {
    const manager = fakeManager(snapshot());
    renderPanel(manager);
    act(() => requestE2eeBackupSetup());
    expect(
      await screen.findByRole("dialog", { name: "Save your recovery code" })
    ).toBeInTheDocument();
  });

  it("ignores a setup request while backup is on", () => {
    const manager = fakeManager(snapshot({ phase: "on", lastBackupAt: 2000 }));
    renderPanel(manager);
    act(() => requestE2eeBackupSetup());
    expect(manager.prepareBackup).not.toHaveBeenCalled();
  });
  it.each([
    ["E2EE_BACKUP_QUOTA", "Your backup storage is full."],
    ["E2EE_RATE_LIMITED", "Too many backup requests. Try again later."],
  ] as const)(
    "explains a background %s failure with its specific copy",
    (lastError, copy) => {
      renderPanel(
        fakeManager(snapshot({ phase: "on", lastBackupAt: 2000, lastError }))
      );
      expect(screen.getByRole("alert")).toHaveTextContent(copy);
      expect(screen.getByRole("alert")).not.toHaveTextContent(
        "Something went wrong"
      );
    }
  );
});
