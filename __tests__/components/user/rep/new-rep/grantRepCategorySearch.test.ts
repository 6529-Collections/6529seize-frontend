import {
  buildGrantRepCategoryOptions,
  getRepCategoryMatchKey,
  getRepCategorySearchTerms,
} from "@/components/user/rep/new-rep/grantRepCategorySearch";

describe("grantRepCategorySearch", () => {
  it("treats spacing, case, and punctuation as equivalent", () => {
    const canonicalKey = getRepCategoryMatchKey("MemesNominee");

    expect(getRepCategoryMatchKey(" memes  nominee ")).toBe(canonicalKey);
    expect(getRepCategoryMatchKey("MEMES-NOMINEE!")).toBe(canonicalKey);
  });

  it("searches both compact and word-separated spellings", () => {
    expect(getRepCategorySearchTerms("MemesNominee")).toEqual([
      "MemesNominee",
      "Memes Nominee",
    ]);
    expect(getRepCategorySearchTerms("Memes  Nominee")).toEqual([
      "Memes Nominee",
      "memesnominee",
    ]);
  });

  it("always selects the exact submission eligibility category", () => {
    expect(
      buildGrantRepCategoryOptions({
        search: "Memes Nominee",
        categories: ["Memes Nominee", "memesnominee", "MemesNominee"],
      })
    ).toEqual([
      {
        kind: "existing",
        category: "MemesNominee",
        aliases: ["Memes Nominee", "memesnominee"],
        selectionReason: "submission",
      },
    ]);
  });

  it("uses the most active spelling for existing duplicate categories", () => {
    expect(
      buildGrantRepCategoryOptions({
        search: "Top Artist",
        categories: ["Top Artist", "top artist"],
        activities: [
          { category: "Top Artist", pairCount: 1, totalRep: 111 },
          { category: "top artist", pairCount: 5, totalRep: 22_040 },
        ],
      })
    ).toEqual([
      {
        kind: "existing",
        category: "top artist",
        aliases: ["Top Artist"],
        selectionReason: "most-active",
      },
    ]);
  });

  it("offers creation only when no equivalent existing category exists", () => {
    const options = buildGrantRepCategoryOptions({
      search: "Fresh Category",
      categories: ["Fresh Art"],
    });

    expect(options).toEqual([
      {
        kind: "existing",
        category: "Fresh Art",
        aliases: [],
        selectionReason: "existing",
      },
      { kind: "new", category: "Fresh Category" },
    ]);

    expect(
      buildGrantRepCategoryOptions({
        search: "Fresh-Category!",
        categories: ["fresh category"],
      })
    ).toEqual([
      {
        kind: "existing",
        category: "fresh category",
        aliases: [],
        selectionReason: "existing",
      },
    ]);
  });
});
