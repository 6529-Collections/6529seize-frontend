import { createCurationMasonryLayout } from "@/hooks/useCurationMasonryPositioner";

describe("Curation masonry positions", () => {
  it("retains the positioner when another page is appended", () => {
    const before = createCurationMasonryLayout(["a", "b"], 640);
    before.positioner.set(0, 100);
    before.positioner.set(1, 300);
    const after = createCurationMasonryLayout(["a", "b", "c"], 640, before);
    expect(after.positioner).toBe(before.positioner);
    expect(after.positioner.get(1)?.height).toBe(300);
  });

  it("reassociates mixed media heights by ID when positions change", () => {
    const before = createCurationMasonryLayout(["a", "b", "c"], 300);
    [100, 300, 200].forEach((height, index) =>
      before.positioner.set(index, height)
    );
    const after = createCurationMasonryLayout(["c", "a", "b"], 300, before);
    expect(
      after.positioner.all().map(({ height, top }) => ({ height, top }))
    ).toEqual([
      { height: 200, top: 0 },
      { height: 100, top: 216 },
      { height: 300, top: 332 },
    ]);
  });

  it("keeps positions valid after removal, a distant page jump, and resize", () => {
    const before = createCurationMasonryLayout(
      Array.from({ length: 500 }, (_, i) => String(i)),
      940
    );
    before.ids.forEach((_, index) =>
      before.positioner.set(index, 100 + (index % 4) * 100)
    );
    const after = createCurationMasonryLayout(
      ["499", "450", "new"],
      300,
      before
    );
    expect(after.positioner.all().map(({ height }) => height)).toEqual([
      400, 300, 420,
    ]);
    expect(after.positioner.columnCount).toBe(1);
    expect(after.positioner.size()).toBe(3);
  });
});
