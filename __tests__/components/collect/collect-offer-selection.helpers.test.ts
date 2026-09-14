import {
  collectMissingOfferSelection,
  collectSelectedOfferSelection,
} from "@/components/collect/collect-offer-selection.helpers";
import { offerAsset } from "./offer-plan.fixture";

describe("selected NFT offer quantities", () => {
  it("combines copies from separate listings for the same edition exactly", () => {
    const first = offerAsset(1);
    const second = offerAsset(2);
    expect(
      collectSelectedOfferSelection([
        { asset: first, quantity: "2" },
        { asset: second, quantity: "1" },
        { asset: first, quantity: "3" },
      ])
    ).toEqual([
      { asset: first, quantity: "5" },
      { asset: second, quantity: "1" },
    ]);
  });

  it("does not silently truncate malformed or overflowing purchase quantities", () => {
    const asset = offerAsset(1);
    expect(() =>
      collectSelectedOfferSelection([{ asset, quantity: "1.5" }])
    ).toThrow("INVALID_OFFER_QUANTITY");
    expect(() =>
      collectSelectedOfferSelection([
        { asset, quantity: (2n ** 256n - 1n).toString() },
        { asset, quantity: "1" },
      ])
    ).toThrow("INVALID_OFFER_QUANTITY");
  });
});

describe("missing NFT offer selection", () => {
  it("includes unlisted missing NFTs while skipping already owned requirements", () => {
    expect(
      collectMissingOfferSelection(
        [
          { asset_keys: ["listed"], missing_quantity: "0" },
          { asset_keys: ["unlisted"], missing_quantity: "2" },
        ],
        []
      )
    ).toEqual({
      items: [{ assetKey: "unlisted", quantity: "2" }],
      hasAlternatives: false,
    });
  });

  it("uses the maximum missing quantity across overlapping requirements", () => {
    expect(
      collectMissingOfferSelection(
        [
          { asset_keys: ["same", "same"], missing_quantity: "2" },
          { asset_keys: ["same"], missing_quantity: "3" },
          { asset_keys: ["same"], missing_quantity: "1" },
        ],
        []
      ).items
    ).toEqual([{ assetKey: "same", quantity: "3" }]);
  });

  it("does not turn every Pebbles trait alternative into an offer", () => {
    expect(
      collectMissingOfferSelection(
        [
          { asset_keys: ["chosen", "alternative"], missing_quantity: "1" },
          { asset_keys: ["chosen", "other"], missing_quantity: "1" },
        ],
        [
          { asset_key: "chosen", quantity: "1" },
          { asset_key: "chosen", quantity: "1" },
          { asset_key: "unrelated", quantity: "1" },
        ]
      )
    ).toEqual({
      items: [{ assetKey: "chosen", quantity: "1" }],
      hasAlternatives: true,
    });
  });

  it("leaves unchosen trait alternatives unselected and rejects invalid quantities", () => {
    const requirements = ["-1", "1.5", "NaN", (2n ** 256n).toString()].map(
      (missing_quantity) => ({ asset_keys: ["invalid"], missing_quantity })
    );
    expect(
      collectMissingOfferSelection(
        [...requirements, { asset_keys: ["a", "b"], missing_quantity: "1" }],
        [{ asset_key: "a", quantity: "-1" }]
      )
    ).toEqual({ items: [], hasAlternatives: true });
  });
});
