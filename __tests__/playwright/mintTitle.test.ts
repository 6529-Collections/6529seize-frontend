import { MEMES_MINT_TITLE_PATTERN } from "../../tests/support/mintTitle";

describe("The Memes mint page title", () => {
  it.each([
    "Mint | The Memes",
    "Mint #1 | 6529Seizing | The Memes",
    "Mint #547 | The Great Meme Expo | Sgt. Pepe’s World — Episode 1 | The Memes",
    "Mint #12 | One | Two | Three | The Memes",
    "Mint #12 | Artwork | The Memes | The Memes",
  ])("accepts the supported title %s", (title) => {
    expect(title).toMatch(MEMES_MINT_TITLE_PATTERN);
  });

  it.each([
    "Mint # | Name | The Memes",
    "Mint #abc | Name | The Memes",
    "Mint #1 |  | The Memes",
    "Mint #1 | Name | Meme Lab",
    "Other Mint #1 | Name | The Memes",
    "Mint #1 | Name | The Memes trailing",
    "Mint | The Memes | extra",
  ])("rejects the malformed title %s", (title) => {
    expect(title).not.toMatch(MEMES_MINT_TITLE_PATTERN);
  });
});
