import {
  buildSanctionsPageModel,
  isListingInForce,
} from "@/lib/sanctions/sanctions-page-model";
import type {
  SanctionsListing,
  SanctionsListV1,
  SanctionsSourceId,
} from "@/lib/sanctions/sanctions-list.types";

const A = `0x${"a".repeat(40)}`;
const B = `0x${"b".repeat(40)}`;
const C = `0x${"c".repeat(40)}`;

function listing(
  source: SanctionsSourceId,
  entryId: string,
  validUntil: string | null = null
): SanctionsListing {
  return {
    source,
    entry_id: entryId,
    entity: `Entity ${entryId}`,
    programs: ["PROGRAM"],
    labels: ["ETH"],
    listed_on: "2024-01-21",
    valid_until: validUntil,
  };
}

function source(id: SanctionsSourceId) {
  return {
    id,
    authority: id,
    jurisdiction: "XX",
    list_name: id,
    nature: "sanctions_designation" as const,
    url: `https://example.gov/${id}`,
    acquisition: "automatic" as const,
    parser: `${id}/1`,
    inputs: [],
    source_published: "2026-11-01",
    evm_addresses: 0,
    listings: 0,
  };
}

const LIST: SanctionsListV1 = {
  schema: "6529.sanctions-list.v1",
  builder: "6529-sanctions-builder/1",
  chain_family: "evm",
  sources: [source("ca-sema"), source("il-nbctf"), source("us-ofac-sdn")],
  addresses: [
    {
      address: A,
      listings: [
        listing("il-nbctf", "FO 02/24", "2026-07-31"),
        listing("us-ofac-sdn", "1001"),
      ],
    },
    {
      address: B,
      listings: [
        listing("il-nbctf", "FO 01/25", "2028-04-29"),
        listing("il-nbctf", "FO 44/21", "2024-02-22"),
      ],
    },
    { address: C, listings: [listing("il-nbctf", "FO 09/23", "2025-01-01")] },
  ],
  totals: { addresses: 3, listings: 5, sources: 3 },
};

describe("buildSanctionsPageModel", () => {
  const model = buildSanctionsPageModel(LIST, "2026-11-06");

  it("orders groups by jurisdiction and puts lapsed orders right after their authority", () => {
    expect(model.groups.map((group) => group.key)).toEqual([
      "us-ofac-sdn",
      "il-nbctf",
      "il-nbctf-lapsed",
      "ca-sema",
    ]);
  });

  it("counts only addresses with a listing in force", () => {
    expect(model.enforcedAddressCount).toBe(2);
    expect(model.sourceCount).toBe(3);
  });

  it("keeps lapsed listings out of the enforced group", () => {
    const [, inForce, lapsed] = model.groups;
    expect(inForce.rows.map((row) => row.reference)).toEqual(["FO 01/25"]);
    expect(lapsed.lapsed).toBe(true);
    expect(lapsed.rows.map((row) => `${row.address}:${row.reference}`)).toEqual(
      [`${A}:FO 02/24`, `${B}:FO 44/21`, `${C}:FO 09/23`]
    );
    expect(lapsed.addressCount).toBe(3);
  });

  it("keeps an authority with no addresses as an empty group", () => {
    const canada = model.groups[3];
    expect(canada.rows).toEqual([]);
    expect(canada.addressCount).toBe(0);
  });

  it("moves an order to the lapsed group the day after its end date", () => {
    const onLastDay = buildSanctionsPageModel(LIST, "2026-07-31");
    const dayAfter = buildSanctionsPageModel(LIST, "2026-08-01");
    expect(onLastDay.enforcedAddressCount).toBe(2);
    expect(
      onLastDay.groups
        .find((group) => group.key === "il-nbctf")
        ?.rows.map((row) => row.reference)
    ).toContain("FO 02/24");
    expect(
      dayAfter.groups
        .find((group) => group.key === "il-nbctf")
        ?.rows.map((row) => row.reference)
    ).not.toContain("FO 02/24");
  });

  it("is built only from public list fields", () => {
    const allowed = new Set([
      "address",
      "labels",
      "reference",
      "programs",
      "entity",
      "listedOn",
      "validUntil",
    ]);
    for (const group of model.groups) {
      for (const row of group.rows) {
        expect(Object.keys(row).every((key) => allowed.has(key))).toBe(true);
      }
    }
  });
});

describe("isListingInForce", () => {
  it("treats the end date as inclusive and null as open-ended", () => {
    expect(
      isListingInForce(listing("il-nbctf", "x", "2026-07-31"), "2026-07-31")
    ).toBe(true);
    expect(
      isListingInForce(listing("il-nbctf", "x", "2026-07-31"), "2026-08-01")
    ).toBe(false);
    expect(isListingInForce(listing("us-ofac-sdn", "x"), "2999-01-01")).toBe(
      true
    );
  });
});
