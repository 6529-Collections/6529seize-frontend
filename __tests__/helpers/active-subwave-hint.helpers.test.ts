import {
  readActiveSubwaveParentHint,
  resolveActiveSubwaveParent,
  writeActiveSubwaveParentHint,
} from "@/helpers/waves/active-subwave-hint.helpers";

describe("active-subwave parent hint storage", () => {
  afterEach(() => window.sessionStorage.clear());

  it("round-trips a hint", () => {
    writeActiveSubwaveParentHint({ waveId: "sub-1", parentWaveId: "parent-1" });
    expect(readActiveSubwaveParentHint()).toEqual({
      waveId: "sub-1",
      parentWaveId: "parent-1",
    });
  });

  it("returns null when nothing is stored", () => {
    expect(readActiveSubwaveParentHint()).toBeNull();
  });

  it("ignores malformed or partial stored values", () => {
    window.sessionStorage.setItem(
      "sidebar-active-subwave-parent:v1",
      "{not json"
    );
    expect(readActiveSubwaveParentHint()).toBeNull();
    window.sessionStorage.setItem(
      "sidebar-active-subwave-parent:v1",
      JSON.stringify({ waveId: "x" })
    );
    expect(readActiveSubwaveParentHint()).toBeNull();
  });
});

describe("resolveActiveSubwaveParent", () => {
  const hint = { waveId: "sub-1", parentWaveId: "parent-1" };

  it("prefers the live parent when known", () => {
    expect(resolveActiveSubwaveParent("sub-1", "live-parent", hint)).toBe(
      "live-parent"
    );
  });

  it("falls back to the hint when the live parent is not yet resolved", () => {
    expect(resolveActiveSubwaveParent("sub-1", null, hint)).toBe("parent-1");
  });

  it("ignores a hint that belongs to a different active wave", () => {
    expect(resolveActiveSubwaveParent("sub-2", null, hint)).toBeNull();
  });

  it("returns null with no live parent and no hint", () => {
    expect(resolveActiveSubwaveParent("sub-1", null, null)).toBeNull();
  });

  it("returns null for a top-level wave (no live parent, hint is for a subwave)", () => {
    expect(resolveActiveSubwaveParent("top-level-wave", null, hint)).toBeNull();
  });
});
