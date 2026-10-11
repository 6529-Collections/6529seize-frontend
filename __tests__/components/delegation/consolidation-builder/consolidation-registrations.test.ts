import { toDirectedLinkKey } from "@/components/delegation/consolidation-builder/consolidation-plan";
import {
  getFreshLinkKeys,
  parseConsolidationRows,
} from "@/components/delegation/consolidation-builder/consolidation-registrations";
import { CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS } from "@/constants/consolidation.constants";

const A = `0x${"a".repeat(40)}`;
const B = `0x${"b".repeat(40)}`;
const C = `0x${"c".repeat(40)}`;
const D = `0x${"d".repeat(40)}`;
const E = `0x${"e".repeat(40)}`;

const ACTIVATION = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS / 1000;
const BEFORE = ACTIVATION - 1;
const AFTER = ACTIVATION + 60;

function rows(...data: unknown[]) {
  return parseConsolidationRows({ data });
}

describe("parseConsolidationRows", () => {
  it("reads pair rows with numeric, string, and missing registration times", () => {
    expect(
      rows(
        {
          wallet1: A.toUpperCase().replace("0X", "0x"),
          wallet2: D,
          confirmed: 1,
          wallet1_registered_at: `${AFTER}`,
          wallet2_registered_at: null,
        },
        { wallet1: B, wallet2: D, confirmed: false }
      )
    ).toEqual([
      {
        wallet1: A,
        wallet2: D,
        confirmed: true,
        wallet1RegisteredAt: AFTER,
        wallet2RegisteredAt: undefined,
      },
      {
        wallet1: B,
        wallet2: D,
        confirmed: false,
        wallet1RegisteredAt: undefined,
        wallet2RegisteredAt: undefined,
      },
    ]);
  });

  it("drops malformed rows and responses", () => {
    expect(
      rows(
        null,
        { wallet1: "nope", wallet2: D },
        { wallet1: A, wallet2: 7 },
        { wallet1: A, wallet2: B, wallet1_registered_at: "soon" }
      )
    ).toEqual([
      {
        wallet1: A,
        wallet2: B,
        confirmed: false,
        wallet1RegisteredAt: undefined,
        wallet2RegisteredAt: undefined,
      },
    ]);
    expect(parseConsolidationRows({ data: "x" })).toEqual([]);
    expect(parseConsolidationRows(undefined)).toEqual([]);
  });

  it("treats non-finite numbers as missing", () => {
    expect(
      rows({
        wallet1: A,
        wallet2: B,
        confirmed: "true",
        wallet1_registered_at: Number.NaN,
        wallet2_registered_at: AFTER,
      })[0]
    ).toMatchObject({
      confirmed: true,
      wallet1RegisteredAt: undefined,
      wallet2RegisteredAt: AFTER,
    });
  });
});

describe("backend contract", () => {
  it("uses the backend's activation second", () => {
    // CONSOLIDATION_FOURTH_WALLET_ACTIVATION_TIMESTAMP in the backend.
    expect(ACTIVATION).toBe(1_792_022_400);
  });

  it("reads a GET /api/consolidations/{wallet}?show_incomplete=true response", () => {
    // fetchConsolidationsForWallet returns `consolidations.*` plus ENS
    // display names, wrapped by returnPaginatedResult. MySQL sends
    // `confirmed` as 0/1 and the bigint times as numbers or strings.
    const response = {
      count: 2,
      page: 1,
      next: null,
      data: [
        {
          created_at: "2026-10-15T00:01:12.000Z",
          block: 23_600_000,
          wallet1: A,
          wallet2: D,
          confirmed: 1,
          wallet1_registered_at: ACTIVATION + 12,
          wallet2_registered_at: `${AFTER}`,
          wallet1_display: "alice.eth",
          wallet2_display: null,
        },
        {
          created_at: "2023-01-04T10:00:00.000Z",
          block: 16_300_000,
          wallet1: B,
          wallet2: A,
          confirmed: 0,
          wallet1_registered_at: null,
          wallet2_registered_at: null,
          wallet1_display: null,
          wallet2_display: null,
        },
      ],
    };

    expect(
      getFreshLinkKeys([parseConsolidationRows(response)], [A, B, D])
    ).toEqual([toDirectedLinkKey(A, D), toDirectedLinkKey(D, A)]);
  });
});

describe("getFreshLinkKeys", () => {
  it("reads wallet1 -> wallet2 from wallet1's time and the reverse only when confirmed", () => {
    const keys = getFreshLinkKeys(
      [
        rows(
          {
            wallet1: A,
            wallet2: D,
            confirmed: true,
            wallet1_registered_at: AFTER,
            wallet2_registered_at: AFTER,
          },
          {
            wallet1: B,
            wallet2: D,
            confirmed: false,
            wallet1_registered_at: AFTER,
            wallet2_registered_at: AFTER,
          }
        ),
      ],
      [A, B, D]
    );

    expect(keys).toEqual([
      toDirectedLinkKey(A, D),
      toDirectedLinkKey(D, A),
      toDirectedLinkKey(B, D),
    ]);
  });

  it("counts a time at activation but not before it or a missing one", () => {
    const keys = getFreshLinkKeys(
      [
        rows(
          {
            wallet1: A,
            wallet2: B,
            confirmed: true,
            wallet1_registered_at: ACTIVATION,
            wallet2_registered_at: BEFORE,
          },
          {
            wallet1: C,
            wallet2: D,
            confirmed: true,
            wallet1_registered_at: null,
            wallet2_registered_at: `${ACTIVATION}`,
          }
        ),
      ],
      [A, B, C, D]
    );

    expect(keys).toEqual([toDirectedLinkKey(A, B), toDirectedLinkKey(D, C)]);
  });

  it("deduplicates rows repeated across wallets and ignores unlisted wallets", () => {
    const shared = {
      wallet1: A,
      wallet2: D,
      confirmed: false,
      wallet1_registered_at: AFTER,
    };
    const keys = getFreshLinkKeys(
      [
        rows(shared, {
          wallet1: A,
          wallet2: E,
          confirmed: true,
          wallet1_registered_at: AFTER,
          wallet2_registered_at: AFTER,
        }),
        rows(shared),
      ],
      [A, D]
    );

    expect(keys).toEqual([toDirectedLinkKey(A, D)]);
  });
});
