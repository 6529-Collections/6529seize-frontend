import { normalizeTypedEmojiShortcuts } from "@/helpers/waves/typed-emoji-shortcuts";

describe("normalizeTypedEmojiShortcuts", () => {
  it("converts supported standalone typed shortcuts", () => {
    expect(
      normalizeTypedEmojiShortcuts(
        [
          ":) :-)",
          ":D :-D",
          ";) ;-)",
          ":( :-(",
          ":P :-P :p :-p",
          ":'( :'-(",
          ":O :-O :o :-o",
          ":| :-|",
        ].join("\n")
      )
    ).toBe(
      [
        ":slightly_smiling_face: :slightly_smiling_face:",
        ":grinning: :grinning:",
        ":wink: :wink:",
        ":slightly_frowning_face: :slightly_frowning_face:",
        [
          ":stuck_out_tongue:",
          ":stuck_out_tongue:",
          ":stuck_out_tongue:",
          ":stuck_out_tongue:",
        ].join(" "),
        ":cry: :cry:",
        ":open_mouth: :open_mouth: :open_mouth: :open_mouth:",
        ":neutral_face: :neutral_face:",
      ].join("\n")
    );
  });

  it("converts shortcuts next to simple punctuation", () => {
    expect(normalizeTypedEmojiShortcuts("Nice :D! (Really ;)?)")).toBe(
      "Nice :grinning:! (Really :wink:?)"
    );
  });

  it("does not convert shortcuts inside words, urls, or paths", () => {
    expect(
      normalizeTypedEmojiShortcuts(
        "abc:D :Dabc https://example.com/:D /tmp/:D ./docs/:)"
      )
    ).toBe("abc:D :Dabc https://example.com/:D /tmp/:D ./docs/:)");
  });

  it("does not convert inline code spans", () => {
    expect(normalizeTypedEmojiShortcuts("Use `:D` then type :D")).toBe(
      "Use `:D` then type :grinning:"
    );
  });

  it("does not convert fenced code blocks", () => {
    const markdown = [
      "before :D",
      "```",
      ":D",
      "```not-a-close",
      ":)",
      "```",
      "after ;)",
    ].join("\n");

    const normalized = [
      "before :grinning:",
      "```",
      ":D",
      "```not-a-close",
      ":)",
      "```",
      "after :wink:",
    ].join("\n");

    expect(normalizeTypedEmojiShortcuts(markdown)).toBe(normalized);
  });

  it("leaves unsupported shortcuts unchanged", () => {
    expect(normalizeTypedEmojiShortcuts("<3 :/ XD :))")).toBe("<3 :/ XD :))");
  });
});
