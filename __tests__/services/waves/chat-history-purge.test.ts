import {
  getChatHistoryPurge,
  runChatHistoryPurge,
} from "@/services/waves/chat-history-purge";
import {
  commonApiDeleteWithResponse,
  commonApiPost,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDeleteWithResponse: jest.fn(),
}));
const prepare = jest.mocked(commonApiPost);
const remove = jest.mocked(commonApiDeleteWithResponse);

it("deletes a synthetic 40,000-message history in 400 bounded requests with constant token storage", async () => {
  const key = "large-history";
  prepare.mockResolvedValue({ purge_token: "fixed-cutoff" });
  let deleted = 0;
  remove.mockImplementation(async () => {
    const stored = JSON.parse(
      sessionStorage.getItem(`6529-chat-history-purge:${key}`) ?? "{}"
    );
    expect(stored.token).toBe("fixed-cutoff");
    const ids = Array.from({ length: 100 }, (_, i) => `drop-${deleted + i}`);
    deleted += ids.length;
    return {
      deleted_drop_ids: ids,
      has_more: deleted < 40_000,
      preserved_pinned_drop_id: null,
    };
  });
  const onBatch = jest.fn();
  const onSettled = jest.fn();
  await runChatHistoryPurge({
    key,
    waveId: "large-wave",
    signal: new AbortController().signal,
    authenticate: async () => ({ success: true }),
    onBatch,
    onSettled,
  });
  expect(prepare).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(400);
  expect(onBatch).toHaveBeenCalledTimes(400);
  expect(onSettled).toHaveBeenCalledTimes(1);
  expect(onSettled).toHaveBeenCalledWith(true, 40_000);
  expect(getChatHistoryPurge(key)).toMatchObject({
    phase: "complete",
    deletedCount: 40_000,
    token: null,
  });
  expect(sessionStorage.getItem(`6529-chat-history-purge:${key}`)).toBeNull();
});

it("recovers only the saved profile and wave operation after a page reload", () => {
  sessionStorage.setItem(
    "6529-chat-history-purge:restored-profile-wave",
    JSON.stringify({ token: "old-cutoff", deletedCount: 100 })
  );
  expect(getChatHistoryPurge("restored-profile-wave")).toMatchObject({
    phase: "paused",
    token: "old-cutoff",
    deletedCount: 100,
  });
  expect(getChatHistoryPurge("another-profile-wave")).toMatchObject({
    phase: "idle",
    token: null,
    deletedCount: 0,
  });
});
