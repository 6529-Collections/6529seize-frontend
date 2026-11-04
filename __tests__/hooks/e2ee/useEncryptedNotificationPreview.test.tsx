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
        seq: 1,
        kind: "message",
        senderProfileId: "other",
        text: "Readable local preview",
      },
      { seq: 2, kind: "message", senderProfileId: "self", text: "Own reply" },
      {
        seq: 3,
        kind: "message",
        senderProfileId: "other",
        text: "Deleted",
        deleted: true,
      },
      {
        seq: 4,
        kind: "message",
        senderProfileId: "other",
        text: "Locked",
        undecryptable: true,
      },
    ],
  });
});

it("previews only readable incoming local messages", () => {
  const { result, rerender } = renderHook(
    ({ seq }) => useEncryptedNotificationPreview("group", seq),
    { initialProps: { seq: 1 } }
  );
  expect(result.current).toEqual({
    preview: "Readable local preview",
    needsSetup: false,
  });
  expect(mockConversation).toHaveBeenLastCalledWith("group");
  for (const seq of [2, 3, 4]) {
    rerender({ seq });
    expect(result.current.preview).toBeNull();
  }
});

it("keeps older notifications without a sequence generic even with local messages", () => {
  expect(
    renderHook(() => useEncryptedNotificationPreview("group")).result.current
  ).toEqual({ preview: null, needsSetup: false });
  expect(mockConversation).toHaveBeenLastCalledWith(null);
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

it("does not use an older saved preview when the timeline marks the message deleted", () => {
  const lastMessage = {
    seq: 5,
    kind: "message",
    senderProfileId: "other",
    text: "Stale local preview",
  };
  mockConversation.mockReturnValue({
    messages: [{ ...lastMessage, deleted: true }],
    conversation: { lastMessage },
  });
  const { result } = renderHook(() =>
    useEncryptedNotificationPreview("group", 5)
  );
  expect(result.current.preview).toBeNull();
});

it.each(["needs-enrollment", "loading", "error"])(
  "uses a generic entry when local encryption is %s",
  (status) => {
    mockEncrypted.status = status;
    expect(
      renderHook(() => useEncryptedNotificationPreview("group", 1)).result
        .current
    ).toEqual({ preview: null, needsSetup: status === "needs-enrollment" });
    expect(mockConversation).toHaveBeenLastCalledWith(null);
  }
);

it("never leaks a previous profile's plaintext or previews while using a proxy", () => {
  mockEncrypted.profileId = "previous";
  const { result, rerender } = renderHook(() =>
    useEncryptedNotificationPreview("group", 1)
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
