import { formatEther } from "viem";
import {
  proposeBlendedPolicy,
  type BlendedPolicyInput,
} from "./collect-blended-policy";
import type {
  OfferPlanAnalysisInput,
  OfferPlanAnalysisView,
  OfferPlanPrice,
} from "./collect-offer-plan.types";

/** Proposal reads only. Temporary MANUAL pins bind the funding check, never the user's edit ownership. */
export async function analyzeBlendedOffers({
  input,
  policy,
  analyze,
  isCurrent,
}: {
  readonly input: OfferPlanAnalysisInput;
  readonly policy: Omit<BlendedPolicyInput, "rows" | "analysis">;
  readonly analyze: (
    input: OfferPlanAnalysisInput
  ) => Promise<OfferPlanAnalysisView>;
  readonly isCurrent: () => boolean;
}) {
  const observed = await analyze({
    ...input,
    controls: { ...input.controls, method: "match_bid" },
  });
  if (!isCurrent()) return null;
  const proposal = proposeBlendedPolicy({
    ...policy,
    rows: input.rows,
    analysis: observed,
  });
  const proposals = new Map(proposal.rows.map((row) => [row.assetKey, row]));
  const fundingRows = input.rows.flatMap((row) => {
    const next = proposals.get(row.assetKey);
    return next?.route === "offer" && next.unitAmountWei !== null
      ? [
          {
            ...row,
            unitPriceEth: formatEther(BigInt(next.unitAmountWei)),
            pinned: true,
          },
        ]
      : [];
  });
  const funding =
    fundingRows.length > 0
      ? await analyze({
          ...input,
          rows: fundingRows,
          controls: { ...input.controls, method: "manual" },
        })
      : observed;
  if (!isCurrent()) return null;
  const until = Math.min(
    Date.parse(funding.validUntil),
    Date.parse(proposal.sourceValidUntil ?? funding.validUntil)
  );
  if (!Number.isFinite(until) || until <= Date.now())
    throw new Error("BLEND_REFERENCE_EXPIRED");
  const prices: OfferPlanPrice[] = input.rows.map((row) => {
    const next = proposals.get(row.assetKey);
    const original = observed.prices.find(
      (price) => price.assetKey === row.assetKey
    );
    const checked = funding.prices.find(
      (price) => price.assetKey === row.assetKey
    );
    const amount = next?.route === "offer" ? next.unitAmountWei : null;
    if (
      amount !== null &&
      (checked?.quantity !== row.quantity || checked.unitAmountWei !== amount)
    )
      throw new Error("BLEND_FUNDING_TERMS_CHANGED");
    return {
      assetKey: row.assetKey,
      ...(original?.asset ? { asset: original.asset } : {}),
      quantity: row.quantity,
      status:
        amount === null ? "UNAVAILABLE" : (checked?.status ?? "UNAVAILABLE"),
      unitAmountWei: amount,
      selected: row.selected,
      reasons: [
        ...(next ? [`BLEND_${next.reason}`] : []),
        ...(amount === null
          ? []
          : (checked?.reasons.filter((reason) => reason !== "MANUAL_PRICE") ??
            [])),
      ],
      references: original?.references ?? [],
    };
  });
  return {
    proposal,
    view: { ...funding, validUntil: new Date(until).toISOString(), prices },
  };
}
