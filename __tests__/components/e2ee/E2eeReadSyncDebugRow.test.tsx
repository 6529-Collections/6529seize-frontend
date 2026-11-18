import { act, render, screen, within } from "@testing-library/react";
import { E2eeReadSyncDebugRow } from "@/components/e2ee/devices/E2eeReadSyncDebugRow";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import type { E2eeEngine, E2eeReadSyncStatus } from "@/lib/e2ee/types";

jest.mock("@/hooks/useDisplayTimeZone", () => ({
  useDisplayTimeZone: jest.fn(),
}));

const mockZone = useDisplayTimeZone as jest.MockedFunction<
  typeof useDisplayTimeZone
>;

const at = (hour: number, minute: number) =>
  Date.UTC(2026, 10, 18, hour, minute);

/** Only what the row reads: the status and change notifications. */
function fakeEngine(initial: E2eeReadSyncStatus | null) {
  let status = initial;
  const listeners = new Set<() => void>();
  const engine = {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getReadSyncStatus: () => status,
  } as unknown as E2eeEngine;
  return {
    engine,
    set(next: E2eeReadSyncStatus | null) {
      status = next;
      for (const listener of listeners) listener();
    },
  };
}

describe("E2eeReadSyncDebugRow (staging only)", () => {
  beforeEach(() => {
    mockZone.mockReturnValue({ timeZone: "UTC", isLocal: false });
  });

  it("says when this device shares no self group yet", () => {
    const { engine } = fakeEngine({
      group: null,
      sharedWith: 0,
      olderGroups: 0,
      reasons: [{ kind: "maintenance", nextAt: at(14, 10) }],
    });
    render(<E2eeReadSyncDebugRow engine={engine} />);
    const row = screen.getByRole("region", {
      name: "Read sync debug (staging only)",
    });
    expect(row).toHaveTextContent("Only this device · group none");
    expect(within(row).getByRole("listitem")).toHaveTextContent(
      /^next maintenance at 14:10( UTC)?$/u
    );
  });

  it("lists whom it shares with, the short group id and every reason", () => {
    const { engine } = fakeEngine({
      group: `0x${"ab".repeat(32)}`,
      sharedWith: 2,
      olderGroups: 1,
      reasons: [
        {
          kind: "older-key-packages",
          deviceKey: "0xa1",
          device: "Old Firefox",
        },
        {
          kind: "invited",
          deviceKey: "0xb2",
          device: "Phone",
          since: at(13, 58),
        },
        { kind: "claim-budget", nextAt: at(14, 5) },
        { kind: "maintenance", nextAt: at(14, 10) },
      ],
    });
    render(<E2eeReadSyncDebugRow engine={engine} />);
    const row = screen.getByTestId("e2ee-read-sync-debug");
    expect(row).toHaveTextContent(
      "Shared with 2 other devices · group 0xababab…abab · also in 1 older self group"
    );
    const items = within(row)
      .getAllByRole("listitem")
      .map((item) => item.textContent?.replace(/ UTC\b/gu, ""));
    expect(items).toEqual([
      "sibling Old Firefox on old KeyPackages",
      "invite sent to Phone at 13:58, waiting for accept",
      "waiting for claim budget (next at 14:05)",
      "next maintenance at 14:10",
    ]);
  });

  it("lists siblings that share a label once each", () => {
    const { engine } = fakeEngine({
      group: "0x01",
      sharedWith: 0,
      olderGroups: 0,
      reasons: [
        {
          kind: "older-key-packages",
          deviceKey: "0xa1",
          device: "Chrome on Windows",
        },
        {
          kind: "older-key-packages",
          deviceKey: "0xb2",
          device: "Chrome on Windows",
        },
        { kind: "claim-budget", nextAt: null },
      ],
    });
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(<E2eeReadSyncDebugRow engine={engine} />);
      expect(
        screen.getAllByRole("listitem").map((item) => item.textContent)
      ).toEqual([
        "sibling Chrome on Windows on old KeyPackages",
        "sibling Chrome on Windows on old KeyPackages",
        "waiting for claim budget",
      ]);
      // No duplicate-key warning from React.
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("follows the engine's changes", () => {
    const fake = fakeEngine({
      group: "0x01",
      sharedWith: 0,
      olderGroups: 0,
      reasons: [],
    });
    render(<E2eeReadSyncDebugRow engine={fake.engine} />);
    expect(screen.getByTestId("e2ee-read-sync-debug")).toHaveTextContent(
      "Only this device · group 0x01"
    );
    act(() => {
      fake.set({ group: "0x01", sharedWith: 1, olderGroups: 0, reasons: [] });
    });
    expect(screen.getByTestId("e2ee-read-sync-debug")).toHaveTextContent(
      "Shared with 1 other device · group 0x01"
    );
    act(() => {
      fake.set(null);
    });
    expect(screen.queryByTestId("e2ee-read-sync-debug")).toBeNull();
  });

  it("renders nothing without an engine", () => {
    const { container } = render(<E2eeReadSyncDebugRow engine={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
