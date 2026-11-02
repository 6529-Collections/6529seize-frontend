import {
  parseConsolidationLimits,
  parseConsolidationPolicy,
} from "@/helpers/consolidationPolicy";

test.each(["2026-10-15", "2026-10-12"])(
  "uses the cutoff supplied by the selected environment %s",
  (date) => {
    expect(
      parseConsolidationPolicy({
        max_wallets: 4,
        ungated_max_wallets: 3,
        four_wallet_activation_at: `${date}T00:00:00Z`,
        four_wallet_signing_opens_at: `${date}T00:10:00Z`,
      })
    ).toEqual({
      maxWallets: 4,
      ungatedMaxWallets: 3,
      activationMs: Date.parse(`${date}T00:00:00Z`),
      signingOpensMs: Date.parse(`${date}T00:10:00Z`),
    });
  }
);
test.each([
  undefined,
  null,
  {},
  { max_wallets: 4, ungated_max_wallets: 3, four_wallet_activation_at: "soon" },
  {
    max_wallets: 4,
    ungated_max_wallets: 3,
    four_wallet_activation_at: "2026-02-30T00:00:00Z",
    four_wallet_signing_opens_at: "2026-03-02T00:10:00Z",
  },
  {
    max_wallets: 4,
    ungated_max_wallets: 3,
    four_wallet_activation_at: "2026-10-15T00:00:00Z",
    four_wallet_signing_opens_at: "2026-10-15T00:00:00Z",
  },
])("does not supply a fallback for malformed settings %p", (value) => {
  expect(parseConsolidationPolicy(value)).toBeNull();
});

test("uses backend limits independently of unavailable activation dates", () => {
  expect(
    parseConsolidationLimits({ max_wallets: 4, ungated_max_wallets: 3 })
  ).toEqual({ maxWallets: 4, ungatedMaxWallets: 3 });
  expect(
    parseConsolidationPolicy({ max_wallets: 4, ungated_max_wallets: 3 })
  ).toBeNull();
});

test.each([
  {},
  { max_wallets: 4 },
  { max_wallets: "4", ungated_max_wallets: 3 },
  { max_wallets: 4.5, ungated_max_wallets: 3 },
  { max_wallets: 2, ungated_max_wallets: 3 },
  { max_wallets: 4, ungated_max_wallets: -1 },
])("rejects missing or invalid wallet limits %p", (value) => {
  expect(parseConsolidationLimits(value)).toBeNull();
  expect(
    parseConsolidationPolicy({
      ...value,
      four_wallet_activation_at: "2026-10-15T00:00:00Z",
      four_wallet_signing_opens_at: "2026-10-15T00:10:00Z",
    })
  ).toBeNull();
});
