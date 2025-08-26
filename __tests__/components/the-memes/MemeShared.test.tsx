import { getMemeTabTitle, MEME_FOCUS } from "@/components/the-memes/MemeShared";

jest.mock("@/services/6529api", () => ({ fetchUrl: jest.fn() }));

describe("getMemeTabTitle", () => {
  it("constructs title with id, nft name and focus", () => {
    const nft = { name: "Card" } as any;
    const title = getMemeTabTitle("The Memes", "3", nft, MEME_FOCUS.COLLECTORS);
    expect(title).toBe("Card | The Memes #3 | Collectors");
  });

  it("returns original title when no extras", () => {
    expect(getMemeTabTitle("The Memes")).toBe("The Memes");
  });
});
