import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { E2eeDeviceList } from "@/components/e2ee/devices/E2eeDeviceList";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
import {
  contextFor,
  createFakeE2eeEngine,
  device,
  E2eeTestProvider,
} from "./fakeE2eeEngine";

const THIS_BROWSER = device({
  deviceKey: `0x${"1".repeat(64)}`,
  label: "Brave on Windows",
  isThisDevice: true,
  linkedAuthorProof: true,
});
const PHONE = device({
  deviceKey: `0x${"2".repeat(64)}`,
  label: "6529 app on iPhone",
  platform: "phone",
});

function backupManager(patch: Partial<E2eeBackupSnapshot>) {
  const snapshot: E2eeBackupSnapshot = {
    phase: "off",
    backupCreatedAt: null,
    backupUpdatedAt: null,
    usedBytes: 0,
    quotaBytes: 0,
    lastBackupAt: null,
    busy: false,
    uploading: false,
    lastError: null,
    ...patch,
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => undefined,
  } as unknown as E2eeBackupManager;
}

function renderList({
  devices = [THIS_BROWSER, PHONE],
  backup = backupManager({}),
  onSetUpBackup,
}: {
  readonly devices?: E2eeDeviceInfo[];
  readonly backup?: E2eeBackupManager | null;
  readonly onSetUpBackup?: () => void;
} = {}) {
  const engine = createFakeE2eeEngine({ devices });
  render(
    <E2eeTestProvider value={contextFor(engine, { backup })}>
      <E2eeDeviceList
        devices={devices}
        engine={engine}
        onSetUpBackup={onSetUpBackup}
      />
    </E2eeTestProvider>
  );
  return engine;
}

const rowOf = (label: string) =>
  screen.getByText(label, { selector: "span" }).closest("li")!;

describe("E2eeDeviceList", () => {
  it("shows one last-active line and a date-only expiry (F-11)", () => {
    renderList();
    const thisRow = rowOf("Brave on Windows");
    expect(within(thisRow).getByText("Active now")).toBeInTheDocument();
    const phoneRow = rowOf("6529 app on iPhone");
    expect(within(phoneRow).getByText(/^Last active /)).toBeInTheDocument();
    expect(within(phoneRow).getByText(/^Expires \w{3} \d{1,2}, 20\d\d$/)).toBeInTheDocument();
    expect(screen.queryByText(/^Last seen/)).not.toBeInTheDocument();
  });

  it("never calls an expired current browser active now", () => {
    const expired = {
      ...THIS_BROWSER,
      lastSeenAt: Date.UTC(2026, 4, 1, 12, 0),
      expiresAt: Date.now() - 60_000,
    };
    renderList({ devices: [expired, PHONE] });
    const thisRow = rowOf("Brave on Windows");
    expect(within(thisRow).queryByText("Active now")).not.toBeInTheDocument();
    expect(within(thisRow).getByText(/^Last active /)).toBeInTheDocument();
    expect(within(thisRow).getByText(/^Expired /)).toBeInTheDocument();
  });

  it("gives this browser its own revoke dialog that warns when backup is off (F-06)", async () => {
    const onSetUpBackup = jest.fn();
    const engine = renderList({ onSetUpBackup });
    fireEvent.click(
      within(rowOf("Brave on Windows")).getByRole("button", {
        name: "Revoke Brave on Windows",
      })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke this browser?",
    });
    expect(dialog).toHaveTextContent(
      "Brave on Windows is the browser you’re using now."
    );
    expect(dialog).toHaveTextContent(
      "Posts from here won’t be signed until you turn signed posts back on."
    );
    expect(dialog).toHaveTextContent(
      "the encrypted chats saved here are deleted."
    );
    expect(dialog).toHaveTextContent(
      "Backup is off. The encrypted chats in this browser can’t be restored after this."
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Set up backup first" })
    );
    expect(onSetUpBackup).toHaveBeenCalledTimes(1);
    expect(engine.revokeDevice).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Revoke this browser?" })
      ).not.toBeInTheDocument()
    );
  });

  it("reassures instead of warning when this browser is backed up", async () => {
    const engine = renderList({
      backup: backupManager({ phase: "on", lastBackupAt: Date.now() }),
      onSetUpBackup: jest.fn(),
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Revoke Brave on Windows" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke this browser?",
    });
    expect(dialog).toHaveTextContent(
      "Only messages included in your last backup can be restored."
    );
    expect(
      within(dialog).queryByRole("button", { name: "Set up backup first" })
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Revoke this browser" })
    );
    await waitFor(() =>
      expect(engine.revokeDevice).toHaveBeenCalledWith(THIS_BROWSER.deviceKey)
    );
  });

  it("says the backup state is unknown before the backup has loaded", async () => {
    renderList({ backup: null, onSetUpBackup: jest.fn() });
    fireEvent.click(
      screen.getByRole("button", { name: "Revoke Brave on Windows" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke this browser?",
    });
    expect(dialog).toHaveTextContent("This browser may not be backed up.");
  });

  it("keeps the shared dialog for other devices", async () => {
    renderList();
    fireEvent.click(
      screen.getByRole("button", { name: "Revoke 6529 app on iPhone" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke access to encrypted DMs for 6529 app on iPhone?",
    });
    expect(
      within(dialog).getByRole("button", { name: "Revoke device" })
    ).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent("Backup is off");
  });
});
