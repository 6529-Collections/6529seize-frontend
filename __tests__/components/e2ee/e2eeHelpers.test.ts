import {
  createE2eeSignatureRejectedError,
  getE2eeErrorCode,
  isE2eeSignatureRejection,
} from "@/components/e2ee/e2eeErrors";
import {
  formatSafetyCode,
  getConversationTitle,
  getMessagePreview,
  getNoticeText,
  isUnpairedDm,
} from "@/components/e2ee/e2eeFormat";
import { getE2eeGrantOrigin } from "@/components/e2ee/e2eePlatform";
import {
  collectMentionIds,
  getActiveMentionQuery,
  splitMentions,
} from "@/components/e2ee/conversation/e2eeMentions";
import {
  E2EE_WAKE_MESSAGE_TYPES,
  signE2eeTypedData,
  subscribeE2eeWakes,
  verifyE2eeContractSignature,
} from "@/components/e2ee/useE2eeEngineDeps";
import { WsMessageType } from "@/helpers/Types";
import {
  ALICE_ID,
  BOB_ID,
  conversation,
  member,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

jest.mock("wagmi", () => ({
  usePublicClient: jest.fn(),
  useSignTypedData: jest.fn(),
}));
jest.mock("@/services/websocket/useWebSocket", () => ({
  useWebSocket: jest.fn(),
}));

const members = [
  member(SELF_ID, "me"),
  member(ALICE_ID, "alice"),
  member(BOB_ID, "bob"),
];
const typedData = {
  domain: { name: "6529 Encrypted Messages" },
  types: {},
  primaryType: "MlsDeviceGrant",
  message: {},
};

describe("engine deps", () => {
  it("passes the grant typed data to the wallet unchanged", async () => {
    const sign = jest.fn().mockResolvedValue("0xsig");
    await expect(signE2eeTypedData(sign as never, typedData)).resolves.toBe(
      "0xsig"
    );
    expect(sign).toHaveBeenCalledWith(typedData);
  });

  it("normalizes a wallet rejection", async () => {
    const sign = jest.fn().mockRejectedValue({
      name: "ContractFunctionExecutionError",
      cause: { name: "UserRejectedRequestError", code: 4001 },
    });
    const error: unknown = await signE2eeTypedData(
      sign as never,
      typedData
    ).catch((caught: unknown) => caught);
    expect(isE2eeSignatureRejection(error)).toBe(true);
    expect(getE2eeErrorCode(error)).toBe("E2EE_SIGNATURE_REJECTED");
  });

  it("subscribes to every E2EE wake type and forwards hints", () => {
    const unsubscribers = E2EE_WAKE_MESSAGE_TYPES.map(() => jest.fn());
    const handlers = new Map<string, (data: unknown) => void>();
    let index = 0;
    const subscribe = jest.fn(
      (type: string, handler: (data: unknown) => void) => {
        handlers.set(type, handler);
        const unsubscribe = unsubscribers[index]!;
        index += 1;
        return unsubscribe;
      }
    );
    const listener = jest.fn();
    const stop = subscribeE2eeWakes(subscribe as never, listener);
    expect([...handlers.keys()]).toEqual([
      WsMessageType.E2EE_GROUP_EVENT,
      WsMessageType.E2EE_WELCOME,
      WsMessageType.E2EE_DEVICE_ADDED,
      WsMessageType.E2EE_DEVICE_REVOKED,
      WsMessageType.E2EE_ROSTER_CHANGED,
    ]);
    handlers.get(WsMessageType.E2EE_GROUP_EVENT)?.({ group: "0x1", seq: 4 });
    expect(listener).toHaveBeenCalledWith({
      type: "E2EE_GROUP_EVENT",
      data: { group: "0x1", seq: 4 },
    });
    stop();
    for (const unsubscribe of unsubscribers) {
      expect(unsubscribe).toHaveBeenCalled();
    }
  });

  it("resumes identity reads on reconnect and removes lifecycle listeners on stop", () => {
    const listener = jest.fn();
    const stop = subscribeE2eeWakes(() => () => undefined, listener);
    window.dispatchEvent(new Event("online"));
    expect(listener).toHaveBeenCalledWith({
      type: "E2EE_LOOKUP_RESUME",
      data: null,
    });
    listener.mockClear();
    stop();
    window.dispatchEvent(new Event("online"));
    expect(listener).not.toHaveBeenCalled();
  });

  it("checks contract wallets on mainnet, or defers to the server without RPC", async () => {
    const client = { verifyHash: jest.fn().mockResolvedValue(true) };
    await expect(
      verifyE2eeContractSignature(client as never, "0xsafe", "0xhash", "0x")
    ).resolves.toBe(true);
    expect(client.verifyHash).toHaveBeenCalledWith({
      address: "0xsafe",
      hash: "0xhash",
      signature: "0x",
    });
    await expect(
      verifyE2eeContractSignature(undefined, "0xsafe", "0xhash", "0x")
    ).rejects.toThrow("E2EE_NO_RPC");
  });

  it("uses the desktop origin label in the desktop app", () => {
    expect(getE2eeGrantOrigin("desktop")).toBe("6529 Desktop");
    expect(getE2eeGrantOrigin("web")).toBe(globalThis.location.host);
  });

  it("builds a normalized rejection error", () => {
    const error = createE2eeSignatureRejectedError(new Error("denied"));
    expect(error.name).toBe("UserRejectedRequestError");
    expect(isE2eeSignatureRejection(error)).toBe(true);
  });
});

describe("format helpers", () => {
  it("titles groups by name and DMs by the other person", () => {
    expect(getConversationTitle("en-US", conversation(), SELF_ID)).toBe(
      "Collectors"
    );
    expect(
      getConversationTitle(
        "en-US",
        conversation({ kind: "dm", name: null, members: members.slice(0, 2) }),
        SELF_ID
      )
    ).toBe("alice");
    expect(
      getConversationTitle("en-US", conversation({ name: null }), SELF_ID)
    ).toBe("alice and bob");
  });

  it("titles a DM holding someone else by its members, not one person", () => {
    const crowded = conversation({
      kind: "dm",
      name: null,
      admins: [SELF_ID, ALICE_ID],
    });
    expect(isUnpairedDm(crowded, SELF_ID)).toBe(true);
    expect(getConversationTitle("en-US", crowded, SELF_ID)).toBe(
      "alice and bob"
    );
    const alone = conversation({
      kind: "dm",
      name: null,
      members: members.slice(0, 1),
    });
    expect(isUnpairedDm(alone, SELF_ID)).toBe(false);
    expect(isUnpairedDm(conversation(), SELF_ID)).toBe(false);
    expect(getConversationTitle("en-US", alone, SELF_ID)).toBe(
      "Unknown member"
    );
  });

  it("describes notices with names", () => {
    const notice = (
      type: "removed" | "renamed" | "safety_code_changed",
      detail?: string
    ) =>
      message({
        id: type,
        kind: "notice",
        notice: {
          type,
          actorProfileId: ALICE_ID,
          targetProfileIds: type === "removed" ? [BOB_ID] : [],
          ...(detail === undefined ? {} : { detail }),
        },
      });
    expect(getNoticeText("en-US", notice("removed"), members, SELF_ID)).toBe(
      "alice removed bob"
    );
    expect(
      getNoticeText("en-US", notice("renamed", "Owls"), members, SELF_ID)
    ).toBe("alice renamed the chat to “Owls”");
    expect(
      getNoticeText("en-US", notice("safety_code_changed"), members, SELF_ID)
    ).toBe("The safety code changed");
  });

  it("names who added a device not yet verified for its owner", () => {
    const wallet = "0x1111111111111111111111111111111111111111";
    const added = (actor: string | null, owner: string, detail?: string) =>
      message({
        id: `added-${actor}-${owner}`,
        kind: "notice",
        notice: {
          type: "device_added",
          actorProfileId: actor,
          targetProfileIds: [owner],
          unverified: true,
          ...(detail === undefined ? {} : { detail }),
        },
      });
    // alice (the committer) added a device of bob's.
    expect(
      getNoticeText("en-US", added(ALICE_ID, BOB_ID, wallet), members, SELF_ID)
    ).toMatch(
      /^alice added a device signed by wallet 0x1111…1111, which isn’t verified for bob on this device$/u
    );
    expect(
      getNoticeText("en-US", added(ALICE_ID, SELF_ID), members, SELF_ID)
    ).toBe("alice added a device that isn’t verified for you on this device");
    // A verified add keeps naming the device's owner.
    expect(
      getNoticeText(
        "en-US",
        message({
          id: "verified-add",
          kind: "notice",
          notice: {
            type: "device_added",
            actorProfileId: ALICE_ID,
            targetProfileIds: [BOB_ID],
          },
        }),
        members,
        SELF_ID
      )
    ).toBe("bob added a device");
  });

  it("previews undecryptable, deleted and attachment-only messages", () => {
    expect(
      getMessagePreview(
        "en-US",
        message({ id: "a", undecryptable: true }),
        members,
        SELF_ID
      )
    ).toBe("Couldn’t decrypt");
    expect(
      getMessagePreview(
        "en-US",
        message({ id: "b", deleted: true }),
        members,
        SELF_ID
      )
    ).toBe("Message deleted");
    expect(
      getMessagePreview(
        "en-US",
        message({
          id: "c",
          attachments: [
            { blob: "0x1", mime: "image/png", size: 1, name: "a.png" },
          ],
        }),
        members,
        SELF_ID
      )
    ).toBe("Attachment");
  });

  it("shows the safety code as four groups of four", () => {
    expect(formatSafetyCode("ABCD ef01 2345 6789")).toEqual([
      "abcd",
      "ef01",
      "2345",
      "6789",
    ]);
  });
});

describe("mentions", () => {
  it("highlights only mentioned members", () => {
    const segments = splitMentions("hi @alice and @carol", members, [ALICE_ID]);
    expect(segments).toEqual([
      { kind: "text", start: 0, value: "hi " },
      { kind: "mention", start: 3, value: "@alice", profileId: ALICE_ID },
      { kind: "text", start: 9, value: " and @carol" },
    ]);
  });

  it("collects mentioned profile ids from text", () => {
    expect(collectMentionIds("@alice @bob @alice @nobody", members)).toEqual([
      ALICE_ID,
      BOB_ID,
    ]);
  });

  it("finds the query being typed at the caret", () => {
    expect(getActiveMentionQuery("hey @al", 7)).toEqual({
      start: 4,
      query: "al",
    });
    expect(getActiveMentionQuery("mail@al", 7)).toBeNull();
    expect(getActiveMentionQuery("@alice done", 11)).toBeNull();
  });
});
