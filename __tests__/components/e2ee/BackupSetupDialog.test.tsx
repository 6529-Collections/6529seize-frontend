import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BackupSetupDialog } from "@/components/e2ee/backup/BackupSetupDialog";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import { BackupError } from "@/lib/e2ee/backup/errors";

const CODE =
  "ABCD-EFGH-JKMN-PQRS-TVWX-YZ01-2345-6789-ABCD-EFGH-JKMN-PQRS-TVWX-YZ01";

function fakeManager() {
  let current: E2eeBackupSnapshot = {
    phase: "off",
    backupCreatedAt: null,
    backupUpdatedAt: null,
    usedBytes: 0,
    quotaBytes: 0,
    lastBackupAt: null,
    busy: false,
    uploading: false,
    lastError: null,
  };
  const listeners = new Set<() => void>();
  let finishUpload: (() => void) | null = null;
  let failUpload: ((error: unknown) => void) | null = null;
  const manager = {
    getSnapshot: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(patch: Partial<E2eeBackupSnapshot>) {
      current = { ...current, ...patch };
      listeners.forEach((listener) => listener());
    },
    confirmBackup: jest.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          manager.set({ phase: "on", uploading: true });
          finishUpload = () => {
            manager.set({
              uploading: false,
              lastBackupAt: Date.now(),
              counts: { chats: 38, messages: 1240 },
            });
            resolve();
          };
          failUpload = reject;
        })
    ),
    backupNow: jest.fn(async () => {
      manager.set({ uploading: false, lastError: null });
    }),
    finish: () => act(() => finishUpload?.()),
    fail: (error: unknown) => act(() => failUpload?.(error)),
  };
  return manager;
}

function renderDialog(
  manager = fakeManager(),
  { replacing = false, onClose = jest.fn() } = {}
) {
  render(
    <BackupSetupDialog
      manager={manager as unknown as E2eeBackupManager}
      prepared={{ code: CODE, secret: new Uint8Array(32) }}
      replacing={replacing}
      onClose={onClose}
      checkGroups={[3, 10]}
    />
  );
  return { manager, onClose };
}

const dialog = () => screen.getByRole("dialog");
const button = (name: string | RegExp) =>
  within(dialog()).getByRole("button", { name });

async function toCheckStep() {
  fireEvent.click(button("Continue"));
  fireEvent.click(
    within(dialog()).getByRole("checkbox", {
      name: "I wrote it down on paper instead",
    })
  );
  fireEvent.click(button("Continue"));
  await screen.findByRole("dialog", { name: "Check your saved code" });
}

describe("BackupSetupDialog", () => {
  it("explains why first, then shows the code in numbered groups", () => {
    renderDialog();
    expect(
      screen.getByRole("dialog", { name: "Back up your encrypted messages" })
    ).toHaveTextContent("Step 1 of 4");
    fireEvent.click(button("Continue"));
    const save = screen.getByRole("dialog", { name: "Save your recovery code" });
    const groups = within(save).getByRole("list", { name: "Recovery code" });
    expect(within(groups).getAllByRole("listitem")).toHaveLength(14);
    expect(groups).toHaveTextContent("4PQRS");
  });

  it("unlocks Continue only after Copy, Download or the paper option", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn(async () => undefined) },
    });
    renderDialog();
    fireEvent.click(button("Continue"));
    expect(button("Continue")).toBeDisabled();
    expect(dialog()).toHaveTextContent("Copy or download the code to continue.");
    fireEvent.click(button("Copy code"));
    await waitFor(() => expect(button("Continue")).toBeEnabled());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CODE);
    expect(dialog()).toHaveTextContent(
      "Copied. Paste it into your password manager now."
    );
  });

  it("checks two groups in the browser, forgiving case and look-alikes", async () => {
    const { manager } = renderDialog();
    await toCheckStep();
    expect(dialog()).toHaveTextContent("enter groups 4 and 11");
    fireEvent.change(screen.getByLabelText("Group 4"), {
      target: { value: "pqrs" },
    });
    fireEvent.change(screen.getByLabelText("Group 11"), {
      target: { value: "jkmn" },
    });
    fireEvent.click(button("Turn on backup"));
    await screen.findByRole("dialog", { name: "Backing up your messages" });
    expect(manager.confirmBackup).toHaveBeenCalledTimes(1);
  });

  it("names the group that doesn't match, and suggests saving again after three misses", async () => {
    const { manager } = renderDialog();
    await toCheckStep();
    fireEvent.change(screen.getByLabelText("Group 4"), {
      target: { value: "PQRS" },
    });
    fireEvent.change(screen.getByLabelText("Group 11"), {
      target: { value: "JKMX" },
    });
    for (let miss = 0; miss < 3; miss += 1) {
      fireEvent.click(button("Turn on backup"));
    }
    const alert = within(dialog()).getByRole("alert");
    expect(alert).toHaveTextContent("That doesn’t match group 11.");
    expect(alert).toHaveTextContent("Can’t find it? Go back and save the code again.");
    const group11 = screen.getByLabelText("Group 11");
    expect(group11).toHaveAttribute("aria-invalid", "true");
    expect(group11).toHaveAttribute("aria-describedby", alert.id);
    expect(screen.getByLabelText("Group 4")).not.toHaveAttribute(
      "aria-describedby"
    );
    expect(manager.confirmBackup).not.toHaveBeenCalled();
    fireEvent.click(button("See the code again"));
    expect(
      screen.getByRole("dialog", { name: "Save your recovery code" })
    ).toBeInTheDocument();
  });

  it("treats an empty answer as not started: no error, the first field focused", async () => {
    const { manager } = renderDialog();
    await toCheckStep();
    fireEvent.click(button("Turn on backup"));
    expect(within(dialog()).queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Group 4")).toHaveFocus();
    expect(manager.confirmBackup).not.toHaveBeenCalled();
  });

  it("says why Continue waits, right beside it", () => {
    renderDialog();
    fireEvent.click(button("Continue"));
    const hint = within(dialog()).getByText(
      "Copy or download the code to continue."
    );
    expect(button("Continue")).toHaveAttribute("aria-describedby", hint.id);
  });

  it("accepts the whole code pasted instead", async () => {
    const { manager } = renderDialog();
    await toCheckStep();
    fireEvent.click(button("Paste the whole code instead"));
    fireEvent.change(screen.getByLabelText("Recovery code"), {
      target: { value: CODE.toLowerCase().replaceAll("-", " ") },
    });
    fireEvent.click(button("Turn on backup"));
    await waitFor(() => expect(manager.confirmBackup).toHaveBeenCalled());
  });

  it("uploads in the background and finishes with what is backed up", async () => {
    const onClose = jest.fn();
    const { manager } = renderDialog(undefined, { onClose });
    await toCheckStep();
    fireEvent.change(screen.getByLabelText("Group 4"), {
      target: { value: "PQRS" },
    });
    fireEvent.change(screen.getByLabelText("Group 11"), {
      target: { value: "JKMN" },
    });
    fireEvent.click(button("Turn on backup"));
    const upload = await screen.findByRole("dialog", {
      name: "Backing up your messages",
    });
    expect(upload).toHaveTextContent("You can close this window.");
    expect(within(upload).getByRole("progressbar")).toBeInTheDocument();
    act(() => manager.set({ progress: { done: 1, total: 4 } }));
    expect(within(upload).getByRole("progressbar")).toHaveAttribute(
      "value",
      "25"
    );
    manager.finish();
    const done = await screen.findByRole("dialog", { name: "Backup is on" });
    expect(done).toHaveTextContent("38 chats, 1,240 messages");
    // The title changes in place, so the outcome is also announced.
    expect(
      within(done).getByText("Backup is on", { selector: "output" })
    ).toBeInTheDocument();
    fireEvent.click(button("Done"));
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the code when the first upload stops, and tries again", async () => {
    const { manager } = renderDialog();
    await toCheckStep();
    fireEvent.change(screen.getByLabelText("Group 4"), {
      target: { value: "PQRS" },
    });
    fireEvent.change(screen.getByLabelText("Group 11"), {
      target: { value: "JKMN" },
    });
    fireEvent.click(button("Turn on backup"));
    await screen.findByRole("dialog", { name: "Backing up your messages" });
    manager.fail(new BackupError("E2EE_RATE_LIMITED"));
    const failed = await screen.findByRole("dialog", {
      name: "Backup didn’t finish",
    });
    expect(failed).toHaveTextContent("You keep the same recovery code");
    expect(within(failed).getByRole("alert")).toHaveTextContent(
      "Too many backup requests"
    );
    fireEvent.click(button("Try again"));
    await screen.findByRole("dialog", { name: "Backup is on" });
    expect(manager.backupNow).toHaveBeenCalledTimes(1);
  });

  it("returns to the check when the backup couldn't be created", async () => {
    const manager = fakeManager();
    manager.confirmBackup.mockRejectedValueOnce(
      new BackupError("E2EE_BACKUP_NOT_READY")
    );
    renderDialog(manager);
    await toCheckStep();
    fireEvent.click(button("Paste the whole code instead"));
    fireEvent.change(screen.getByLabelText("Recovery code"), {
      target: { value: CODE },
    });
    fireEvent.click(button("Turn on backup"));
    const check = await screen.findByRole("dialog", {
      name: "Check your saved code",
    });
    expect(within(check).getByRole("alert")).toHaveTextContent(
      "Set up encrypted messages on this device first."
    );
  });

  it("explains what a new code replaces", () => {
    renderDialog(undefined, { replacing: true });
    const why = screen.getByRole("dialog", {
      name: "Replace your recovery code",
    });
    expect(why).toHaveTextContent(
      "Messages that are in your backup but not on this browser won’t be in the new backup."
    );
    fireEvent.click(button("Continue"));
    expect(
      screen.getByRole("dialog", { name: "Save your new recovery code" })
    ).toBeInTheDocument();
  });
});
