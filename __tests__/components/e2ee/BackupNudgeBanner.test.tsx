import { act, fireEvent, render, screen } from "@testing-library/react";
import { BackupNudgeBanner } from "@/components/e2ee/backup/BackupNudgeBanner";
import { takeE2eeBackupSetupRequest } from "@/components/e2ee/backup/backupSetupRequest";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import {
  contextFor,
  createFakeE2eeEngine,
  E2eeTestProvider,
} from "./fakeE2eeEngine";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 9, 12, 0);

function manager(phase: E2eeBackupSnapshot["phase"]) {
  const snapshot = { phase } as E2eeBackupSnapshot;
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => undefined,
  } as unknown as E2eeBackupManager;
}

function renderBanner(
  phase: E2eeBackupSnapshot["phase"],
  status: "ready" | "needs-enrollment" = "ready"
) {
  const engine = createFakeE2eeEngine({ status });
  return render(
    <E2eeTestProvider value={contextFor(engine, { backup: manager(phase) })}>
      <BackupNudgeBanner />
    </E2eeTestProvider>
  );
}

describe("BackupNudgeBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    takeE2eeBackupSetupRequest();
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("asks to set up backup while it is off, and opens setup on Devices & security", () => {
    renderBanner("off");
    expect(
      screen.getByRole("region", { name: "Back up your encrypted messages" })
    ).toBeVisible();
    const setUp = screen.getByRole("link", { name: "Set up backup" });
    expect(setUp).toHaveAttribute("href", "/preferences?tab=security");
    fireEvent.click(setUp);
    expect(takeE2eeBackupSetupRequest()).toBe(true);
  });

  it("asks to restore when a backup from another device exists", () => {
    renderBanner("available");
    expect(
      screen.getByRole("region", {
        name: "Restore your encrypted messages on this browser",
      })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Restore messages" })
    ).toBeVisible();
  });

  it.each([
    ["on", "ready"],
    ["loading", "ready"],
    ["off", "needs-enrollment"],
  ] as const)("stays away while backup is %s and the engine is %s", (phase, status) => {
    const { container } = renderBanner(phase, status);
    expect(container).toBeEmptyDOMElement();
  });

  it("snoozes for 7 days, then 30", () => {
    const { container } = renderBanner("off");
    fireEvent.click(
      screen.getByRole("button", { name: "Remind me in 7 days" })
    );
    expect(container).toBeEmptyDOMElement();

    act(() => {
      jest.setSystemTime(NOW + 7 * DAY + 60_000);
      jest.advanceTimersByTime(60_000);
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Remind me in 30 days" })
    );
    expect(container).toBeEmptyDOMElement();

    act(() => {
      jest.setSystemTime(NOW + 7 * DAY + 29 * DAY);
      jest.advanceTimersByTime(60_000);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("comes back once the browser clears its storage", () => {
    const first = renderBanner("off");
    fireEvent.click(
      screen.getByRole("button", { name: "Remind me in 7 days" })
    );
    first.unmount();
    localStorage.clear();
    renderBanner("off");
    expect(
      screen.getByRole("button", { name: "Remind me in 7 days" })
    ).toBeVisible();
  });
});
