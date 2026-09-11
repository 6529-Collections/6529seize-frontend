import {
  clearWaveDraft,
  getWaveDraftStorageKey,
  isRestorableDraftJson,
  readRestorableWaveDraft,
  writeWaveDraft,
} from "@/helpers/waves/wave-draft.helpers";

// Minimal Lexical-shaped serialized states for the pure JSON checks.
const textState = (text: string): string =>
  JSON.stringify({
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", text }],
        },
      ],
    },
  });

const imageState = (): string =>
  JSON.stringify({
    root: {
      type: "root",
      children: [
        { type: "paragraph", children: [{ type: "text", text: "look" }] },
        { type: "image", src: "blob:http://x/y" },
      ],
    },
  });

const emptyState = (): string =>
  JSON.stringify({
    root: { type: "root", children: [{ type: "paragraph", children: [] }] },
  });

describe("isRestorableDraftJson", () => {
  it("accepts a non-empty text state", () => {
    expect(isRestorableDraftJson(textState("gm frens"))).toBe(true);
  });

  it("rejects null, empty and whitespace-only states", () => {
    expect(isRestorableDraftJson(null)).toBe(false);
    expect(isRestorableDraftJson(emptyState())).toBe(false);
    expect(isRestorableDraftJson(textState("   \n\t "))).toBe(false);
  });

  it("rejects a draft containing an image node (media can't survive reload)", () => {
    expect(isRestorableDraftJson(imageState())).toBe(false);
  });

  it("rejects malformed JSON and rootless objects", () => {
    expect(isRestorableDraftJson("{not json")).toBe(false);
    expect(isRestorableDraftJson(JSON.stringify({ foo: 1 }))).toBe(false);
  });

  it("rejects an oversized draft", () => {
    expect(isRestorableDraftJson(textState("x".repeat(70_000)))).toBe(false);
  });

  it("collects text across nested nodes", () => {
    const nested = JSON.stringify({
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              { type: "text", text: "" },
              { type: "mention", children: [{ type: "text", text: "@x" }] },
            ],
          },
        ],
      },
    });
    expect(isRestorableDraftJson(nested)).toBe(true);
  });
});

describe("sessionStorage round-trip", () => {
  const waveId = "wave-123";
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("keys drafts per wave", () => {
    expect(getWaveDraftStorageKey(waveId)).toBe("wave-draft:v1:wave-123");
  });

  it("writes and reads back a restorable draft", () => {
    writeWaveDraft(waveId, textState("hold this thought"));
    expect(readRestorableWaveDraft(waveId)).toBe(textState("hold this thought"));
  });

  it("write clears the key when content is not restorable", () => {
    window.sessionStorage.setItem(
      getWaveDraftStorageKey(waveId),
      textState("old")
    );
    writeWaveDraft(waveId, emptyState());
    expect(readRestorableWaveDraft(waveId)).toBeNull();
    expect(
      window.sessionStorage.getItem(getWaveDraftStorageKey(waveId))
    ).toBeNull();
  });

  it("does not restore an image-bearing draft even if present in storage", () => {
    window.sessionStorage.setItem(getWaveDraftStorageKey(waveId), imageState());
    expect(readRestorableWaveDraft(waveId)).toBeNull();
  });

  it("clearWaveDraft removes the draft", () => {
    writeWaveDraft(waveId, textState("bye"));
    clearWaveDraft(waveId);
    expect(readRestorableWaveDraft(waveId)).toBeNull();
  });

  it("does not collide across waves", () => {
    writeWaveDraft("wave-a", textState("aaa"));
    writeWaveDraft("wave-b", textState("bbb"));
    expect(readRestorableWaveDraft("wave-a")).toBe(textState("aaa"));
    expect(readRestorableWaveDraft("wave-b")).toBe(textState("bbb"));
  });
});
