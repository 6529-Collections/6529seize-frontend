import { draftReady, parseCap, parseRoyalty, type Draft } from "@/lib/stream/createDraft";

const draft: Draft = {
  media: { bytes: new Uint8Array([1]), mimeType: "image/png" },
  title: "A work",
  description: "",
  artistName: "",
  royalty: "6.529",
  editions: false,
  cap: "",
};

describe("parseCap", () => {
  it.each([
    ["", 0],
    ["5", 5],
    [" 12 ", 12],
    ["4294967294", 4_294_967_294],
  ])("accepts %p", (value, expected) => {
    expect(parseCap(value)).toBe(expected);
  });
  it.each(["0", "-1", "1.5", "4294967295", "12abc", "1e3", "abc"])("rejects %p", (value) => {
    expect(parseCap(value)).toBeNull();
  });
});

describe("parseRoyalty", () => {
  it("reads percent as a rate out of 100,000", () => {
    expect(parseRoyalty("6.529")).toBe(6529);
    expect(parseRoyalty("6,5")).toBe(6500);
    expect(parseRoyalty("0")).toBe(0);
    expect(parseRoyalty("25")).toBe(25_000);
  });
  it.each(["26", "-1", "1e1", "0x5", "", "5.", "1.2.3"])("rejects %p", (value) => {
    expect(parseRoyalty(value)).toBeNull();
  });
});

describe("draftReady", () => {
  it("needs art and a title for both products", () => {
    expect(draftReady({ ...draft, media: null }, true)).toBe(false);
    expect(draftReady({ ...draft, title: "  " }, false)).toBe(false);
  });
  it("6529 Stream: ignores the royalty (the network sets the terms)", () => {
    expect(draftReady(draft, true)).toBe(true);
    expect(draftReady({ ...draft, royalty: "99" }, true)).toBe(true);
  });
  it("Independent Stream: needs a valid royalty", () => {
    expect(draftReady(draft, false)).toBe(true);
    expect(draftReady({ ...draft, royalty: "99" }, false)).toBe(false);
  });
  it("checks the edition cap only when editions are on", () => {
    expect(draftReady({ ...draft, editions: true, cap: "12abc" }, true)).toBe(false);
    expect(draftReady({ ...draft, editions: false, cap: "12abc" }, true)).toBe(true);
  });
});
