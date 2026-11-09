import { fireEvent, render, screen } from "@testing-library/react";
import { takeE2eeBackupSetupRequest } from "@/components/e2ee/backup/backupSetupRequest";
import DeviceSetupDialog from "@/components/device-signing/DeviceSetupDialog";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import {
  contextFor,
  createFakeE2eeEngine,
  device,
  E2eeTestProvider,
} from "../e2ee/fakeE2eeEngine";

// The card's own flow is tested elsewhere; here it only finishes or cancels.
jest.mock("@/components/e2ee/gate/E2eeEnrollmentCard", () => ({
  E2eeEnrollmentCard: ({ onClose }: { readonly onClose: () => void }) => (
    <button type="button" onClick={onClose}>
      Finish setup
    </button>
  ),
}));
jest.mock("@/components/e2ee/gate/E2eeEnrollmentIdentity", () => ({
  E2eeEnrollmentIdentity: () => null,
}));

const backup = (phase: E2eeBackupSnapshot["phase"]) => {
  // Stable, as the real manager's snapshot is.
  const snapshot = { phase } as E2eeBackupSnapshot;
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => undefined,
  } as unknown as E2eeBackupManager;
};

function renderSetup({
  status = "ready",
  phase = "off",
  scope = "both",
}: {
  readonly status?: "ready" | "needs-enrollment";
  readonly phase?: E2eeBackupSnapshot["phase"];
  readonly scope?: "both" | "dms" | "posts";
} = {}) {
  const onClose = jest.fn();
  const engine = createFakeE2eeEngine({
    status,
    thisDevice: device({
      deviceKey: `0x${"1".repeat(64)}`,
      isThisDevice: true,
      expiresAt: Date.UTC(2027, 4, 8, 12),
    }),
  });
  render(
    <E2eeTestProvider value={contextFor(engine, { backup: backup(phase) })}>
      <DeviceSetupDialog scope={scope} onClose={onClose} />
    </E2eeTestProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "Finish setup" }));
  return onClose;
}

describe("device setup's last step", () => {
  beforeEach(() => {
    takeE2eeBackupSetupRequest();
  });

  it("asks to back up once encrypted DMs are on and backup is off", () => {
    const onClose = renderSetup();
    const dialog = screen.getByRole("dialog", {
      name: "Signed posts and encrypted DMs are on",
    });
    expect(dialog).toHaveTextContent("In this browser until May 8, 2027.");
    expect(dialog).toHaveTextContent("One more step: back up your messages");
    expect(onClose).not.toHaveBeenCalled();
    const setUp = screen.getByRole("link", { name: "Set up backup" });
    expect(setUp).toHaveAttribute("href", "/preferences?tab=security");
    fireEvent.click(setUp);
    expect(onClose).toHaveBeenCalled();
    expect(takeE2eeBackupSetupRequest()).toBe(true);
  });

  it("offers restore when a backup from another device exists", () => {
    renderSetup({ phase: "available", scope: "dms" });
    expect(
      screen.getByRole("dialog", { name: "Encrypted DMs are on" })
    ).toHaveTextContent("One more step: restore your messages");
    expect(
      screen.getByRole("link", { name: "Restore messages" })
    ).toBeInTheDocument();
  });

  it("lets Later close it", () => {
    const onClose = renderSetup();
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    ["backup is already on", { phase: "on" as const }],
    ["the card was cancelled", { status: "needs-enrollment" as const }],
    ["only signed posts were set up", { scope: "posts" as const }],
  ])("closes straight away when %s", (_, options) => {
    const onClose = renderSetup(options);
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByText(/One more step/)).toBeNull();
  });
});
