import {
  isMemesNomineePresentationVariant,
  isMemesNomineeSearchPrefix,
} from "@/helpers/waves/memes-nomination";

describe("isMemesNomineePresentationVariant", () => {
  it.each([
    "MemesNominee",
    "memesnominee",
    "MEMES NOMINEE",
    " Memes  Nominee ",
    "Memes-Nominee",
    "Memes_Nominee",
    "Memes/Nominee",
    "Memes.Nominee",
    "Memes—Nominee",
    "ＭｅｍｅｓＮｏｍｉｎｅｅ",
  ])("matches case, spacing, punctuation, and width variation: %s", (value) => {
    expect(isMemesNomineePresentationVariant(value)).toBe(true);
  });

  it.each([
    "MemeNominee",
    "MemesNominees",
    "MemesNomine",
    "NomineeMemes",
    "Memes Nominee 2",
  ])("does not match a real spelling change: %s", (value) => {
    expect(isMemesNomineePresentationVariant(value)).toBe(false);
  });
});

describe("isMemesNomineeSearchPrefix", () => {
  it.each([
    "MemesN",
    "memes nom",
    "memes nomin",
    "Memes-Nominee",
    "ＭｅｍｅｓＮｏｍｉｎ",
  ])(
    "matches a clear partial search for the submission category: %s",
    (value) => {
      expect(isMemesNomineeSearchPrefix(value)).toBe(true);
    }
  );

  it.each(["meme", "memes", "meme nominee", "memes artist"])(
    "does not match an ambiguous or differently spelled search: %s",
    (value) => {
      expect(isMemesNomineeSearchPrefix(value)).toBe(false);
    }
  );
});
