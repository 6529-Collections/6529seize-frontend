import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { E2eeBackupPanel } from "@/components/e2ee/backup/E2eeBackupPanel";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import { BackupError } from "@/lib/e2ee/backup/errors";
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

  it("warns after a device was revoked since the backup was set up and can turn backup off", async () => {
    const manager = fakeManager(
      snapshot({ phase: "on", backupCreatedAt: 1000, lastBackupAt: 2000 })
    );
    renderPanel(manager, [
      THIS_DEVICE,
      device({
        deviceKey: `0x${"9".repeat(64)}`,
        isThisDevice: false,
        revokedAt: 5000,
      }),
    ]);
    expect(
      screen.getByText(/Create a new recovery code so the backup key/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Turn off backup" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Turn off backup?",
    });
    const confirm = screen
      .getAllByRole("button", { name: "Turn off backup" })
      .find((button) => dialog.contains(button))!;
    fireEvent.click(confirm);
    await waitFor(() => expect(manager.turnOff).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Backup is off/)).toBeInTheDocument();
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
