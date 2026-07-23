import { isDropEditableAt } from "@/helpers/waves/drop-editability.helpers";

describe("isDropEditableAt", () => {
  const atMillis = 1_000_000;

  it("treats an absent field as editable (legacy API compatibility)", () => {
    expect(isDropEditableAt({ editableUntil: undefined, atMillis })).toBe(true);
  });

  it("treats null as editing disabled", () => {
    expect(isDropEditableAt({ editableUntil: null, atMillis })).toBe(false);
  });

  it("is editable strictly before the deadline", () => {
    expect(isDropEditableAt({ editableUntil: atMillis + 1, atMillis })).toBe(
      true
    );
  });

  it("is not editable at or after the deadline", () => {
    expect(isDropEditableAt({ editableUntil: atMillis, atMillis })).toBe(false);
    expect(isDropEditableAt({ editableUntil: atMillis - 1, atMillis })).toBe(
      false
    );
  });
});
