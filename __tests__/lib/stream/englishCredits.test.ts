/** @jest-environment node */
import type { TxResult } from "@/lib/stream/dataSource";
import { parseEthToWei } from "@/lib/stream/eth";
import { createMockStream, MOCK_ACCOUNTS } from "@/lib/stream/mock";

const B = MOCK_ACCOUNTS.collectorB;

function expectOk<T>(result: TxResult<T>): T {
  if (!result.ok) {
    throw new Error(`tx failed: ${result.error.code}`);
  }
  return result.value;
}

async function keyTitled(
  stream: ReturnType<typeof createMockStream>,
  title: string
): Promise<string> {
  const found = (await stream.dataSource.listWorks()).find(
    (summary) => summary.title === title && summary.variant === "stream-1of1"
  );
  if (found === undefined) {
    throw new Error(`no work ${title}`);
  }
  return found.key;
}

describe("1/1 auction credits and withdrawals", () => {
  it("reads claimable credits, records a withdrawn bid, and claims to zero", async () => {
    const stream = createMockStream({ wallNow: () => 0 });
    const key = await keyTitled(stream, "Glass Orchard");
    const auction = await stream.dataSource.auctionForWork(key);
    expect(auction?.state).toBe("PAUSED");
    expect(auction?.highBidder).toBe(B);
    const before = await stream.dataSource.claimableCredits(B);
    expectOk(
      await stream.actions
        .sale("ENGLISH_AUCTION")
        .withdrawBid(B, auction?.saleId ?? "")
    );
    const withdrawn = parseEthToWei("0.3") ?? 0n;
    expect(await stream.dataSource.claimableCredits(B)).toBe(
      before + withdrawn
    );
    const events = await stream.dataSource.provenance(key);
    expect(events.at(-1)).toMatchObject({
      kind: "bid-withdrawn",
      actor: B,
      amount: withdrawn,
      source: "IEnglishAuction.BidWithdrawn",
    });
    expect(
      expectOk(await stream.actions.sale("ENGLISH_AUCTION").claimCredits(B, B))
    ).toBe(before + withdrawn);
    expect(await stream.dataSource.claimableCredits(B)).toBe(0n);
  });
});
