jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";
import { getCurrentSalesAndAuctionsEditorialMarkdown } from "@/lib/public-review/streamReviewSalesAndAuctionsPage";

async function loadSalesAndAuctionsEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  if (reviewVersion === undefined) {
    throw new Error("The active Stream review version is unavailable.");
  }
  const page = reviewVersion.pages.find(
    (candidate) => candidate.id === "fixed-price-sales-and-auctions"
  );
  if (page === undefined) {
    throw new Error("The sales and auctions test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: reviewVersion.source,
  };
}

describe("getCurrentSalesAndAuctionsEditorialMarkdown", () => {
  it("replaces the real snapshot with the plain current-page flow", async () => {
    const input = await loadSalesAndAuctionsEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentSalesAndAuctionsEditorialMarkdown({
        ...input,
        locale,
      });

      expect(currentMarkdown).toContain("## The sale flow in one minute");
      expect(currentMarkdown).toContain(
        "The reviewed code has two signed sale paths. Both use native ETH."
      );
      expect(currentMarkdown).toContain(
        "## How sale details are approved and checked"
      );
      expect(currentMarkdown).toContain(
        "## Current sales use the older minting path"
      );
      expect(currentMarkdown).toContain("ADR 0019");
      expect(currentMarkdown).toContain(
        "It is not accepted or implemented as a complete current sale path"
      );
      expect(currentMarkdown).not.toContain(
        "A sale contract turns approved terms into custody, payment, allocation"
      );
      expect(
        Array.from(currentMarkdown.matchAll(/^## (.+)$/gm), (match) => match[1])
      ).toEqual([
        "The sale flow in one minute",
        "How sale details are approved and checked",
        "How paid sales and free claims work",
        "The payer and NFT recipient can be different",
        "How an auction starts",
        "How bids and refunds work",
        "How the next minimum bid is calculated",
        "A late bid can extend the auction",
        "How an auction with a winner ends",
        "What happens if nobody bids",
        "When an auction can be cancelled",
        "Current sales use the older minting path",
        "Money owed to people is not spare money",
        "Some wallets and contracts may reject transfers",
        "Other sale types are not available yet",
        "What the contracts must make easy to check",
        "What reviewers should check for",
        "Questions for reviewers",
      ]);
    }
  });

  it("builds source and ADR links from the pinned source context", async () => {
    const input = await loadSalesAndAuctionsEditorial();
    const repository = "example/Stream";
    const commit = "a".repeat(40);

    const currentMarkdown = getCurrentSalesAndAuctionsEditorialMarkdown({
      ...input,
      source: { repository, commit },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamDrops.sol#L45-L61`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/AuctionContract.sol#L549-L559`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0002-auction-custody.md`
    );
    expect(currentMarkdown).not.toContain(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
  });

  it("fails loudly when the immutable source snapshot changes", async () => {
    const input = await loadSalesAndAuctionsEditorial();

    expect(() =>
      getCurrentSalesAndAuctionsEditorialMarkdown({
        ...input,
        editorialMarkdown: input.editorialMarkdown.replace(
          "## The minimum next bid is exact",
          "## The next bid"
        ),
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: fixed-price sales and auctions."
    );
  });
});
