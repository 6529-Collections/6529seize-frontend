let history: typeof import("@/helpers/reactions/reactionHistory");
let emojiMart: typeof import("emoji-mart");
const storageKey = "emoji-mart.frequently";

beforeEach(async () => {
  jest.resetModules();
  localStorage.clear();
  history = await import("@/helpers/reactions/reactionHistory");
  emojiMart = await import("emoji-mart");
});

it("preserves quick-reaction counts when the already-opened picker records another selection", async () => {
  localStorage.setItem(storageKey, JSON.stringify({ heart: 5, smile: 4 }));
  // The package typings misname get as _get1; exercise the public runtime
  // method used by the picker rather than mocking away its cached index.
  const getFrequent = Reflect.get(
    emojiMart.FrequentlyUsed,
    "get"
  ) as (options: { maxFrequentRows: number; perLine: number }) => string[];
  expect(getFrequent({ maxFrequentRows: 4, perLine: 9 })).toEqual([
    "heart",
    "smile",
  ]);
  await history.recordReaction(":heart:");
  await history.recordReaction(":heart:");
  emojiMart.FrequentlyUsed.add({ id: "wave" });

  expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
    heart: 7,
    smile: 4,
    wave: 1,
  });
  expect(history.getTopReactions(3)).toEqual([":heart:", ":smile:", ":wave:"]);
});

it("preserves consecutive reactions while the lazy runtime loads", async () => {
  await Promise.all([
    history.recordReaction(":heart:"),
    history.recordReaction(":heart:"),
    history.recordReaction(":smile:"),
  ]);
  expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
    heart: 2,
    smile: 1,
  });
});

it("notifies same-tab subscribers after both quick and picker selections", async () => {
  const listener = jest.fn();
  const unsubscribe = history.subscribeToReactionStore(listener);
  await history.recordReaction(":heart:");
  expect(listener).toHaveBeenCalledTimes(1);
  emojiMart.FrequentlyUsed.add({ id: "smile" });
  history.notifyReactionHistoryChange();
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
  history.notifyReactionHistoryChange();
  expect(listener).toHaveBeenCalledTimes(2);
});

it("reads the supplied hydration snapshot instead of browser history", () => {
  localStorage.setItem(storageKey, JSON.stringify({ heart: 5 }));
  expect(
    history.getTopReactions(3, history.getReactionSnapshotServer())
  ).toEqual([":+1:"]);
  expect(history.getTopReactions(3)).toEqual([":heart:"]);
});

it.each(["", "broken json", "null", "{}"])(
  "falls back safely for history %s",
  (value) => {
    expect(history.getTopReactions(3, value)).toEqual([":+1:"]);
  }
);

it("handles storage replacement and clearing from another tab", () => {
  const listener = jest.fn();
  const unsubscribe = history.subscribeToReactionStore(listener);
  globalThis.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
  globalThis.dispatchEvent(new StorageEvent("storage", { key: null }));
  globalThis.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
});

it("retains a history increment if the emoji runtime fails", async () => {
  localStorage.setItem(storageKey, JSON.stringify({ heart: 5 }));
  const add = jest
    .spyOn(emojiMart.FrequentlyUsed, "add")
    .mockImplementation(() => {
      throw new Error("runtime unavailable");
    });
  try {
    await history.recordReaction(":heart:");
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({ heart: 6 });
  } finally {
    add.mockRestore();
  }
});
