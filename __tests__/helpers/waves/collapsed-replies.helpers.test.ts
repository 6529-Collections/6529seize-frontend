import {
  isReplyDrop,
  isWaveRepliesCollapsed,
  withoutCollapsedReplies,
} from "@/helpers/waves/collapsed-replies.helpers";
import { type Drop, DropSize } from "@/helpers/waves/drop.helpers";

const fullDrop = (id: string, replyToDropId?: string): Drop =>
  ({
    id,
    type: DropSize.FULL,
    ...(replyToDropId
      ? { reply_to: { drop_id: replyToDropId, drop_part_id: 1 } }
      : {}),
  }) as unknown as Drop;

const lightDrop = (id: string, isReplyDrop: boolean): Drop =>
  ({
    id,
    serial_no: 1,
    type: DropSize.LIGHT,
    waveId: "wave-1",
    stableKey: id,
    stableHash: id,
    is_reply_drop: isReplyDrop,
  }) as Drop;

describe("collapsed replies helpers", () => {
  it("detects collapsed-reply waves", () => {
    expect(
      isWaveRepliesCollapsed({
        chat: { replies: { collapsed: true } },
      } as never)
    ).toBe(true);
    expect(isWaveRepliesCollapsed({ chat: {} } as never)).toBe(false);
    expect(isWaveRepliesCollapsed(undefined)).toBe(false);
  });

  it("recognises full and light reply drops", () => {
    expect(isReplyDrop(fullDrop("reply", "root"))).toBe(true);
    expect(isReplyDrop(fullDrop("root"))).toBe(false);
    expect(isReplyDrop(lightDrop("light-reply", true))).toBe(true);
    expect(isReplyDrop(lightDrop("light-root", false))).toBe(false);
  });

  it("removes replies and keeps the same object when there are none", () => {
    const messages = {
      key: "wave-1",
      drops: [fullDrop("root"), fullDrop("reply", "root")],
    };
    expect(withoutCollapsedReplies(messages).drops.map((d) => d.id)).toEqual([
      "root",
    ]);

    const withoutReplies = { key: "wave-1", drops: [fullDrop("root")] };
    expect(withoutCollapsedReplies(withoutReplies)).toBe(withoutReplies);
  });
});
