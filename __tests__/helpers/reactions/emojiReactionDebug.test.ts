import { createEmojiReactionAttemptId } from "@/helpers/reactions/emojiReactionDebug";

describe("emojiReactionDebug", () => {
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "crypto"
  );

  afterEach(() => {
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, "crypto", originalCryptoDescriptor);
      return;
    }

    Reflect.deleteProperty(globalThis, "crypto");
  });

  it("creates attempt ids when crypto is unavailable", () => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined,
    });

    expect(createEmojiReactionAttemptId()).toMatch(/^attempt-/);
  });
});
