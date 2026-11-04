import { renderHook } from "@testing-library/react";
import { useEncryptedNotificationPreview } from "@/hooks/e2ee/useEncryptedNotificationPreview";

let mockAuth = {
  connectedProfile: { id: "self" },
  activeProfileProxy: null as object | null,
};
let mockEncrypted = { status: "ready", profileId: "self" };
const mockConversation = jest.fn();
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/hooks/e2ee/useE2ee", () => ({
  useE2ee: () => mockEncrypted,
  useE2eeConversation: (group: string | null) => mockConversation(group),
}));

beforeEach(() => {
  mockAuth = { connectedProfile: { id: "self" }, activeProfileProxy: null };
  mockEncrypted = { status: "ready", profileId: "self" };
  mockConversation.mockReturnValue({
    messages: [
      {
        kind: "message",
        senderProfileId: "other",
        text: "Readable local preview",
      },
      { kind: "message", senderProfileId: "self", text: "Own reply" },
      {
        kind: "message",
        senderProfileId: "other",
        text: "Deleted",
        deleted: true,
      },
      {
        kind: "message",
        senderProfileId: "other",
        text: "Locked",
        undecryptable: true,
      },
    ],
  });
});

it("previews only readable incoming local messages", () => {
  expect(
    renderHook(() => useEncryptedNotificationPreview("group")).result.current
  ).toEqual({ preview: "Readable local preview", needsSetup: false });
  expect(mockConversation).toHaveBeenLastCalledWith("group");
});

it("uses the saved local summary before the timeline is loaded after a reload", () => {
  mockConversation.mockReturnValue({
    messages: [],
    conversation: {
      lastMessage: {
        seq: 5,
        kind: "message",
        senderProfileId: "other",
        text: "Saved local preview",
      },
    },
  });
  const { result, rerender } = renderHook(
    ({ seq }) => useEncryptedNotificationPreview("group", seq),
    { initialProps: { seq: 5 } }
  );
  expect(result.current.preview).toBe("Saved local preview");
  rerender({ seq: 4 });
  expect(result.current.preview).toBeNull();
});

it.each(["needs-enrollment", "loading", "error"])(
  "uses a generic entry when local encryption is %s",
  (status) => {
    mockEncrypted.status = status;
    expect(
      renderHook(() => useEncryptedNotificationPreview("group")).result.current
    ).toEqual({ preview: null, needsSetup: status === "needs-enrollment" });
    expect(mockConversation).toHaveBeenLastCalledWith(null);
  }
);

it("never leaks a previous profile's plaintext or previews while using a proxy", () => {
  mockEncrypted.profileId = "previous";
  const { result, rerender } = renderHook(() =>
    useEncryptedNotificationPreview("group")
  );
  expect(result.current.preview).toBeNull();
  mockEncrypted.profileId = "self";
  mockAuth.activeProfileProxy = {};
  rerender();
  expect(result.current.preview).toBeNull();
  expect(mockConversation).toHaveBeenLastCalledWith(null);
});

it("only previews the specific message referenced by a notification", () => {
  mockConversation.mockReturnValue({
    messages: [
      { seq: 5, kind: "message", senderProfileId: "alice", text: "First" },
      { seq: 6, kind: "message", senderProfileId: "bob", text: "Second" },
    ],
  });
  const { result, rerender } = renderHook(
    ({ seq }) => useEncryptedNotificationPreview("group", seq),
    { initialProps: { seq: 5 } }
  );
  expect(result.current.preview).toBe("First");
  rerender({ seq: 4 });
  expect(result.current.preview).toBeNull();
});
