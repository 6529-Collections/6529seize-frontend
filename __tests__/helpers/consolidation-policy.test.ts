import { parseConsolidationPolicy } from "@/helpers/consolidationPolicy";

test.each(["2026-10-15", "2026-10-12"])(
  "uses the cutoff supplied by the selected environment %s",
  (date) => {
    expect(
      parseConsolidationPolicy({
        four_wallet_activation_at: `${date}T00:00:00Z`,
        four_wallet_signing_opens_at: `${date}T00:10:00Z`,
      })
    ).toEqual({
      activationMs: Date.parse(`${date}T00:00:00Z`),
      signingOpensMs: Date.parse(`${date}T00:10:00Z`),
    });
  }
);
test.each([
  undefined,
  null,
  {},
  { four_wallet_activation_at: "soon" },
  {
    four_wallet_activation_at: "2026-02-30T00:00:00Z",
    four_wallet_signing_opens_at: "2026-03-02T00:10:00Z",
  },
  {
    four_wallet_activation_at: "2026-10-15T00:00:00Z",
    four_wallet_signing_opens_at: "2026-10-15T00:00:00Z",
  },
])("does not supply a fallback for malformed settings %p", (value) => {
  expect(parseConsolidationPolicy(value)).toBeNull();
});
