import { getLatestEditableChatDrop } from "@/components/waves/utils/getLatestEditableChatDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";

const connectedProfile = {
  id: "profile-1",
  handle: "alice",
};

const createDrop = (overrides: Partial<ExtendedDrop> = {}): ExtendedDrop =>
  ({
    id: "drop-1",
    serial_no: 1,
    type: DropSize.FULL,
    stableKey: "drop-1",
    stableHash: "drop-1",
    drop_type: ApiDropType.Chat,
    wave: { id: "wave-1" },
    author: { id: "profile-1", handle: "alice" },
    rank: null,
    winning_context: undefined,
    parts: [],
    metadata: [],
    ...overrides,
  }) as ExtendedDrop;

describe("getLatestEditableChatDrop", () => {
  it("chooses the newest own chat drop by serial number", () => {
    const older = createDrop({ id: "older", serial_no: 10 });
    const newest = createDrop({ id: "newest", serial_no: 12 });
    const middle = createDrop({ id: "middle", serial_no: 11 });

    expect(
      getLatestEditableChatDrop({
        drops: [older, newest, middle],
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    ).toBe(newest);
  });

  it("ignores drops by other authors", () => {
    const otherAuthor = createDrop({
      id: "other",
      serial_no: 20,
      author: { id: "profile-2", handle: "bob" } as ExtendedDrop["author"],
    });
    const ownDrop = createDrop({ id: "own", serial_no: 10 });

    expect(
      getLatestEditableChatDrop({
        drops: [ownDrop, otherAuthor],
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    ).toBe(ownDrop);
  });

  it("matches own drops by normalized handle when ids do not match", () => {
    const ownDrop = createDrop({
      id: "own",
      author: { id: "profile-2", handle: "Alice" } as ExtendedDrop["author"],
    });

    expect(
      getLatestEditableChatDrop({
        drops: [ownDrop],
        waveId: "wave-1",
        connectedProfile: {
          id: "profile-1",
          handle: " @alice ",
        },
        isProxyMode: false,
      })
    ).toBe(ownDrop);
  });

  it("ignores temp drops", () => {
    const tempDrop = createDrop({ id: "temp-drop", serial_no: 20 });
    const savedDrop = createDrop({ id: "saved", serial_no: 10 });

    expect(
      getLatestEditableChatDrop({
        drops: [savedDrop, tempDrop],
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    ).toBe(savedDrop);
  });

  it("ignores drops from another wave", () => {
    const otherWaveDrop = createDrop({
      id: "other-wave",
      serial_no: 20,
      wave: { id: "wave-2" } as ExtendedDrop["wave"],
    });
    const sameWaveDrop = createDrop({ id: "same-wave", serial_no: 10 });

    expect(
      getLatestEditableChatDrop({
        drops: [sameWaveDrop, otherWaveDrop],
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    ).toBe(sameWaveDrop);
  });

  it("ignores participatory and winner drops", () => {
    const participatoryDrop = createDrop({
      id: "participatory",
      serial_no: 20,
      drop_type: ApiDropType.Participatory,
    });
    const winnerDrop = createDrop({
      id: "winner",
      serial_no: 30,
      drop_type: ApiDropType.Winner,
    });
    const chatDrop = createDrop({ id: "chat", serial_no: 10 });

    expect(
      getLatestEditableChatDrop({
        drops: [chatDrop, participatoryDrop, winnerDrop],
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    ).toBe(chatDrop);
  });

  it("ignores light drops", () => {
    const lightDrop = {
      id: "light",
      serial_no: 20,
      type: DropSize.LIGHT,
      waveId: "wave-1",
      stableKey: "light",
      stableHash: "light",
    } as Drop;
    const fullDrop = createDrop({ id: "full", serial_no: 10 });

    expect(
      getLatestEditableChatDrop({
        drops: [fullDrop, lightDrop],
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    ).toBe(fullDrop);
  });

  it("ignores all drops in proxy mode", () => {
    expect(
      getLatestEditableChatDrop({
        drops: [createDrop()],
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: true,
      })
    ).toBeNull();
  });
});
