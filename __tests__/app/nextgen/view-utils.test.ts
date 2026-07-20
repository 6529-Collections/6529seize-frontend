import { getNextGenView } from "@/app/nextgen/[[...view]]/view-utils";
import { NextgenView } from "@/types/enums";

describe("getNextGenView", () => {
  it.each([
    NextgenView.COLLECTIONS,
    NextgenView.COLLECTIONS.toLowerCase(),
    " COLLECTIONS ",
  ])("normalizes enum and path casing for %s", (view) => {
    expect(getNextGenView(view)).toBe(NextgenView.COLLECTIONS);
  });

  it("returns undefined for an unsupported view", () => {
    expect(getNextGenView("unknown")).toBeUndefined();
  });
});
