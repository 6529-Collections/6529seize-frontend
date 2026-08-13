jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { getCurrentRevenueSplitsEditorialMarkdown } from "@/lib/public-review/streamReviewRevenueSplitsPage";

const SOURCE = {
  commit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
  repository: "6529-Collections/6529Stream",
} as const;

const ORIGINAL_MARKDOWN = `# Revenue, splits, and royalties

Old technical introduction.

## One wei should have one accountable path

Old accountable path.

## The current native-sale paths keep local accounting

Old native-sale path.

## Pull credits keep one recipient from blocking everyone

Old pull-credit path.

## The settlement foundation gives a sale one replay-safe identity

Old settlement path.

## Resolution separates policy from the sale mechanic

Old resolver path.

## Immutable split profiles make collaboration inspectable

Old split-profile path.

## Native ETH accounting must distinguish liabilities from surplus

Old native accounting.

## Approved ERC-20 transfers require balance checks

Old ERC-20 accounting.

## Payer-bound token sales remain a proposal

Old payer-bound proposal.

## Rounding is an allocation decision

Old rounding details.

## Curator rewards connect onchain claims to offchain allocation

Old curator details.

## ERC-2981 publishes royalty information

Old royalty details.

## Every value movement should be reconstructable

Old event details.

## Responsibilities carried by payment accounting

Old responsibility details.

## What can fail

Old failure list.

## Questions for reviewers

1. Old question.
9. Does every public royalty statement describe marketplace payment under
ERC-2981 as voluntary?`;

describe("getCurrentRevenueSplitsEditorialMarkdown", () => {
  it("replaces the current page with plain copy and pinned evidence links", () => {
    const result = getCurrentRevenueSplitsEditorialMarkdown({
      editorialMarkdown: ORIGINAL_MARKDOWN,
      source: SOURCE,
    });

    expect(result).toContain("**The short answer:**");
    expect(result).toContain(
      "Current fixed-price ETH sales and English auctions keep their own split rules"
    );
    expect(result).toContain("the current sale paths do not use it.");
    expect(result).toContain("ADR 0021 is accepted design, not implemented");
    expect(result).toContain("ADR 0019");
    expect(result).toContain("is proposed, not accepted");
    expect(result).toContain("A marketplace can choose whether to pay it.");
    expect(result).toContain(
      `https://github.com/${SOURCE.repository}/blob/${SOURCE.commit}/smart-contracts/StreamDrops.sol#L540-L559`
    );
    expect(result).not.toContain("Old technical introduction.");
    expect(result).not.toContain("Old settlement path.");
    expect(result.match(/^## /gm)).toHaveLength(16);
  });

  it("uses the English fallback for every supported locale", () => {
    const expected = getCurrentRevenueSplitsEditorialMarkdown({
      editorialMarkdown: ORIGINAL_MARKDOWN,
      locale: "en-US",
      source: SOURCE,
    });

    for (const locale of SUPPORTED_LOCALES) {
      expect(
        getCurrentRevenueSplitsEditorialMarkdown({
          editorialMarkdown: ORIGINAL_MARKDOWN,
          locale,
          source: SOURCE,
        })
      ).toBe(expected);
    }
  });

  it("fails closed when the source editorial structure changes", () => {
    expect(() =>
      getCurrentRevenueSplitsEditorialMarkdown({
        editorialMarkdown: ORIGINAL_MARKDOWN.replace(
          "## Rounding is an allocation decision",
          "## A renamed rounding section"
        ),
        source: SOURCE,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: rounding."
    );
  });

  it("fails closed when the pinned source commit changes", () => {
    expect(() =>
      getCurrentRevenueSplitsEditorialMarkdown({
        editorialMarkdown: ORIGINAL_MARKDOWN,
        source: {
          ...SOURCE,
          commit: "0000000000000000000000000000000000000000",
        },
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: revenue, splits, and royalties source commit."
    );
  });
});
