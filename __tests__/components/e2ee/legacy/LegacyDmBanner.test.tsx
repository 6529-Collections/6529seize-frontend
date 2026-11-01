import { fireEvent, render, screen } from "@testing-library/react";
import { LegacyDmComposerGate } from "@/components/e2ee/legacy/LegacyDmBanner";
import { findEncryptedEquivalent } from "@/components/e2ee/legacy/encryptedEquivalent";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { E2eeConversation } from "@/lib/e2ee/types";

let mockNow = Date.parse("2026-11-02T10:00:00Z");
let mockEquivalent: { g: string } | null = null;
let mockE2ee: { engine: object | null; status: string } = {
  engine: null,
  status: "idle",
};
let mockAuth: { activeProfileProxy: object | null } = {
  activeProfileProxy: null,
};
const mockStart = jest.fn();

jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/e2ee/useE2eeNow", () => ({
  useE2eeNow: () => mockNow,
}));
jest.mock("@/hooks/e2ee/useE2ee", () => ({ useE2ee: () => mockE2ee }));
jest.mock("@/components/e2ee/legacy/useEncryptedEquivalent", () => ({
  useEncryptedEquivalent: () => mockEquivalent,
}));
jest.mock("@/components/e2ee/plaintext/PlaintextDmEncryptionNotice", () => ({
  useStartEncryptedChatFromDm: () => ({
    available: true,
    pending: false,
    start: mockStart,
  }),
}));
jest.mock("@/components/e2ee/legacy/LegacyDmExportDialog", () => ({
  LegacyDmExportDialog: () => <div>export dialog</div>,
}));
jest.mock("@/components/e2ee/legacy/LegacyDmImportDialog", () => ({
  LegacyDmImportDialog: () => <div>import dialog</div>,
}));

const wave = { id: "dm-wave", name: "alice" } as unknown as ApiWave;
const composer = <textarea aria-label="composer" />;

function renderGate(enabled = true) {
  return render(
    <LegacyDmComposerGate wave={wave} enabled={enabled}>
      {composer}
    </LegacyDmComposerGate>
  );
}

describe("LegacyDmComposerGate", () => {
  beforeEach(() => {
    (isE2eeEnabled as jest.Mock).mockReturnValue(true);
    mockNow = Date.parse("2026-11-02T10:00:00Z");
    mockEquivalent = null;
    mockE2ee = { engine: null, status: "idle" };
    mockAuth = { activeProfileProxy: null };
    mockStart.mockClear();
  });

  it("leaves non-DM waves and builds without encrypted messages alone", () => {
    renderGate(false);
    expect(screen.getByLabelText("composer")).toBeInTheDocument();
    expect(screen.queryByText(/Not end-to-end encrypted/)).toBeNull();
    (isE2eeEnabled as jest.Mock).mockReturnValue(false);
    renderGate(true);
    expect(screen.queryByText(/Not end-to-end encrypted/)).toBeNull();
  });

  it("states the deletion date and keeps the composer before an encrypted chat exists", () => {
    renderGate();
    expect(
      screen.getByRole("region", { name: "Unencrypted chat notice" })
    ).toHaveTextContent(
      "Not end-to-end encrypted. This history will be deleted from 6529’s servers on Dec 1, 2026, unless we’re legally required to keep it."
    );
    expect(screen.getByLabelText("composer")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Start encrypted chat" })
    );
    expect(mockStart).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Move history" })).toBeNull();
  });

  it("opens the export", () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: "Export history" }));
    expect(screen.getByText("export dialog")).toBeInTheDocument();
  });

  it("goes read-only and offers the move once an encrypted chat with the same people exists", () => {
    mockEquivalent = { g: "0xabc" };
    mockE2ee = { engine: {}, status: "ready" };
    renderGate();
    expect(screen.queryByLabelText("composer")).toBeNull();
    expect(screen.getByText(/This chat is read-only/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open encrypted chat" })
    ).toHaveAttribute("href", expect.stringContaining("0xabc"));
    fireEvent.click(screen.getByRole("button", { name: "Move history" }));
    expect(screen.getByText("import dialog")).toBeInTheDocument();
  });

  it("closes the chat for everyone from the deletion date", () => {
    mockNow = Date.parse("2026-12-01T00:00:00Z");
    renderGate();
    expect(screen.queryByLabelText("composer")).toBeNull();
    expect(
      screen.getByText(
        "This unencrypted chat is closed. Its history was deleted from 6529’s servers on Dec 1, 2026, except anything we’re legally required to keep."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export history" })).toBeNull();
  });

  it("offers no actions to a proxy", () => {
    mockAuth = { activeProfileProxy: {} };
    renderGate();
    expect(screen.queryByRole("button", { name: "Export history" })).toBeNull();
    expect(screen.getByText(/Not end-to-end encrypted/)).toBeInTheDocument();
  });
});

describe("findEncryptedEquivalent", () => {
  const conversation = (
    g: string,
    members: string[],
    status: E2eeConversation["status"] = "active",
    updatedAt = 1
  ) =>
    ({
      g,
      status,
      updatedAt,
      members: members.map((profileId) => ({ profileId })),
    }) as E2eeConversation;

  it("matches exactly the same members, preferring the latest active chat", () => {
    const chats = [
      conversation("a", ["me", "you"], "active", 1),
      conversation("b", ["me", "you"], "active", 5),
      conversation("c", ["me", "you", "them"]),
      conversation("d", ["me", "you"], "left", 9),
    ];
    expect(findEncryptedEquivalent(chats, ["you", "me"])?.g).toBe("b");
    expect(findEncryptedEquivalent(chats, ["me", "them"])).toBeNull();
    expect(findEncryptedEquivalent(chats, ["me"])).toBeNull();
  });
});
