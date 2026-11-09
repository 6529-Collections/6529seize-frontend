/**
 * @jest-environment node
 *
 * 8.3: the conversation snapshot says what keeps a delayed conversation
 * waiting. A stuck commit wins over a failing send.
 */
import type { DeviceDirectory } from "@/lib/e2ee/engine/directory";
import { newRuntime } from "@/lib/e2ee/engine/groups";
import { EngineStore } from "@/lib/e2ee/engine/store";
import type { StoredGroup } from "@/lib/e2ee/records";

const directory = {
  version: 0,
  cached: () => null,
  isVerified: () => false,
} as unknown as DeviceDirectory;

const record = (delayed: boolean): StoredGroup =>
  ({
    g: "g",
    status: "active",
    metadata: {
      v: 1,
      g: "g",
      kind: "group",
      name: null,
      admins: [],
      created_by: "alice",
      history: "from_join",
    },
    epoch: 1,
    epochFp: "0".repeat(16),
    members: [],
    leaving: [],
    splitView: false,
    delayed,
    readSeq: 0,
    updatedAt: 0,
  }) as unknown as StoredGroup;

function reasonFor(state: {
  delayed: boolean;
  sendFailingSince: number | null;
  commitFailing: boolean;
}) {
  const store = new EngineStore("alice", directory);
  const runtime = newRuntime(record(state.delayed));
  runtime.sendFailingSince = state.sendFailingSince;
  runtime.commitFailing = state.commitFailing;
  store.groups.set("g", runtime);
  return store.getConversation("g")?.delayedReason;
}

describe("EngineStore delayed reason", () => {
  it.each([
    ["not delayed", false, null, false, null],
    ["not delayed, even while failing", false, 1_000, true, null],
    ["a failing send", true, 1_000, false, "send"],
    ["a stuck commit", true, null, true, "commit"],
    ["both: the commit wins", true, 1_000, true, "commit"],
    ["restored from storage, no owner yet", true, null, false, "commit"],
  ] as const)(
    "%s",
    (_label, delayed, sendFailingSince, commitFailing, expected) => {
      expect(reasonFor({ delayed, sendFailingSince, commitFailing })).toBe(
        expected
      );
    }
  );
});
