import { createFactBook } from "@/lib/explained/facts";
import { loadFactInputs } from "@/lib/explained/feed.server";

jest.mock("@/lib/tdh/formal/loadFormalManifest.server", () => ({
  loadFormalManifest: jest.fn(async () => ({
    status: "bundled",
    reason: "unavailable",
    manifest: jest.requireActual("@/lib/tdh/formal/bundledManifest")
      .BUNDLED_FORMAL_MANIFEST,
  })),
}));
jest.mock("@/lib/tdh/verification/loadVerification.server", () => ({
  LATEST_DAY_REVALIDATE_SECONDS: 600,
  OLDER_DAY_REVALIDATE_SECONDS: 3600,
  loadVerificationIndex: jest.fn(async () => ({ status: "unavailable" })),
  loadVerificationDay: jest.fn(async () => ({ status: "unavailable" })),
}));

/**
 * P26 §5.2's minted count from the two counts 6529.io's API serves: the
 * owner total (`edition_size`) and the floor field (`edition_size_floor`).
 * Meme #4's owner total is 301 but 300 were minted, and 6529.io's own TDH
 * applies RATE(3941, 300) = 13.14 to it; Meme #508's floor is its claim's
 * 310, below the 328 minted.
 */
const EXTENDED = [
  { id: 2, season: 1, edition_size: 999, edition_size_floor: 1000 },
  { id: 4, season: 1, edition_size: 301, edition_size_floor: 300 },
  { id: 8, season: 1, edition_size: 3941, edition_size_floor: 3941 },
  { id: 508, season: 15, edition_size: 328, edition_size_floor: 310 },
  { id: 568, season: 17, edition_size: 158, edition_size_floor: 310 },
];
const NFTS = [
  { id: 2, mint_date: "2022-06-09T17:17:45Z", tdh: 5280283, tdh__raw: 1340167 },
  { id: 4, mint_date: "2022-06-29T15:36:35Z", tdh: 5233937, tdh__raw: 398320 },
  { id: 8, mint_date: "2022-07-23T15:20:38Z", tdh: 4981917, tdh__raw: 4981917 },
  { id: 508, mint_date: "2026-06-12T10:51:47Z", tdh: 546167, tdh__raw: 45437 },
  { id: 568, mint_date: "2026-10-30T12:07:23Z", tdh: 3888, tdh__raw: 308 },
];

function respond(data: unknown[]): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ count: data.length, next: null, data }),
  } as unknown as Response;
}

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

async function editionsWith(fetchImpl: typeof fetch) {
  global.fetch = fetchImpl;
  const inputs = await loadFactInputs();
  return { inputs, book: createFactBook(inputs) };
}

// The snapshot read runs first: a good live read is kept as the last good
// read, which a later failed read would use instead of the snapshot.
describe("each Meme's minted count", () => {
  it("chooses from the ship-time snapshot when the API cannot be read", async () => {
    const { inputs, book } = await editionsWith(
      jest.fn(async () => {
        throw new Error("offline");
      }) as unknown as typeof fetch
    );
    expect(inputs.editions?.source).toMatch(/as read at ship time/);
    expect(book.num("meme.4.minted")).toBe(300);
    expect(book.num("meme.4.rate")).toBe(13.14);
    expect(book.num("meme.25.edition")).toBe(969);
    expect(book.num("meme.128.edition")).toBe(369);
    expect(book.num("meme.508.edition")).toBe(328);
    expect(book.num("meme.2.edition")).toBe(1000);
  });

  it("from a live read, takes the count whose rate 6529.io's own TDH applies", async () => {
    const { inputs, book } = await editionsWith(
      jest.fn(async (url: RequestInfo | URL) =>
        respond(String(url).includes("/api/nfts") ? NFTS : EXTENDED)
      ) as unknown as typeof fetch
    );
    const minted = new Map(
      inputs.editions?.cards.map((card) => [card.id, card.minted])
    );
    expect(minted.get(2)).toBe(1000);
    expect(minted.get(4)).toBe(300);
    expect(minted.get(508)).toBe(328);
    expect(minted.get(568)).toBe(158);
    expect(book.num("meme.4.edition")).toBe(300);
    expect(book.num("meme.4.rate")).toBe(13.14);
    expect(book.num("meme.508.rate")).toBe(12.02);
    expect(book.num("meme.568.edition")).toBe(310);
  });
});
