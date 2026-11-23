import { pinChanges } from "@/lib/personal-records/personal-record-changes";

const saved = (pins: Record<string, number | null>) =>
  Object.entries(pins).map(([id, position]) => ({ id, position }));

const positions = (items: ReturnType<typeof pinChanges>) =>
  Object.fromEntries(
    items.map((item) => [item.k, (item.b as { pos: number } | null)?.pos])
  );

describe("pinChanges", () => {
  it("writes nothing when the order is already the saved one", () => {
    expect(
      pinChanges(["a", "b", "c"], saved({ a: 0, b: 1024, c: 2048 }))
    ).toEqual([]);
  });

  it("puts a new pin after the last saved one, alone", () => {
    expect(
      positions(pinChanges(["a", "b", "new"], saved({ a: 0, b: 1024 })))
    ).toEqual({ new: 2048 });
  });

  it("moves one pin into the room between its new neighbours", () => {
    expect(
      positions(pinChanges(["b", "a", "c"], saved({ a: 0, b: 1024, c: 2048 })))
    ).toEqual({ a: 1536 });
    expect(
      positions(pinChanges(["a", "c", "b"], saved({ a: 0, b: 1024, c: 2048 })))
    ).toEqual({ b: 3072 });
  });

  it("spaces the whole order out again when a moved pin has no room", () => {
    // Today's routes save positions 0, 1, 2: nothing fits before 0.
    expect(
      positions(pinChanges(["c", "a", "b"], saved({ a: 0, b: 1, c: 2 })))
    ).toEqual({ c: 0, a: 1024, b: 2048 });
  });

  it("gives pins without a saved position positions in order", () => {
    expect(
      positions(pinChanges(["a", "b"], saved({ a: null, b: null })))
    ).toEqual({ a: 0, b: 1024 });
    // Only the unsaved one is written when the saved ones already rise.
    expect(
      positions(pinChanges(["a", "x", "b"], saved({ a: 0, x: null, b: 4 })))
    ).toEqual({ x: 2 });
  });

  it("keeps every position within what a pin record may carry", () => {
    const many = Array.from({ length: 100 }, (_, index) => `w${index}`);
    const items = pinChanges(many, []);
    expect(Math.max(...(Object.values(positions(items)) as number[]))).toBe(
      99 * 1024
    );
    expect(
      positions(pinChanges(["a", "b"], saved({ a: 999_900, b: null })))
    ).toEqual({ a: 0, b: 1024 });
  });
});
