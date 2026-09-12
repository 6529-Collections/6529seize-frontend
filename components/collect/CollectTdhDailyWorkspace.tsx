"use client";

import type { ApiCollectDailyTdhPlan } from "@/generated/models/ApiCollectDailyTdhPlan";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { createCollectDailyTdhPlan } from "@/services/api/collect-tdh-daily-api";
import { useLayoutEffect, useRef, useState } from "react";
import CollectTdhDailyController from "./CollectTdhDailyController";
import CollectTdhDailyResults from "./CollectTdhDailyResults";
import CollectTdhTargetDelivery from "./CollectTdhTargetDelivery";
import {
  collectDailyTdhEstimate,
  collectDailyTdhRequest,
  collectDailyTdhSelection,
  validateCollectDailyTdhPlan,
} from "./collect-tdh-daily.helpers";
import {
  collectProfileWallets,
  defaultCollectRecipient,
  isCollectProfileWallet,
} from "./collect-recipient.helpers";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import type { CollectCollection } from "./collect.types";

interface Props {
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string | undefined;
  readonly collection: CollectCollection;
  readonly onConnect: () => void;
  readonly onReviewPurchase: (
    items: readonly CollectSelectedListing[],
    recipient: string
  ) => void;
  readonly onPlanOffers?: ((plan: ApiCollectDailyTdhPlan) => void) | undefined;
}

export default function CollectTdhDailyWorkspace(props: Props) {
  const membership = collectProfileWallets(props.profile)
    .map((wallet) => wallet.wallet.toLowerCase())
    .sort()
    .join(":");
  const contextKey = `${props.profile?.id ?? "guest"}:${membership}:${props.payingWallet?.toLowerCase() ?? ""}:${props.collection}`;
  return <DailyWorkspace key={contextKey} {...props} />;
}

function DailyWorkspace({
  profile,
  payingWallet,
  collection,
  onConnect,
  onReviewPurchase,
  onPlanOffers,
}: Props) {
  const locale = useBrowserLocale();
  const [recipient, setRecipient] = useState(() =>
    defaultCollectRecipient(profile, payingWallet)
  );
  const [error, setError] = useState<string>();
  const current = useRef({ profile, recipient });
  useLayoutEffect(() => {
    current.current = { profile, recipient };
  });
  useLayoutEffect(
    () => () => {
      current.current = { profile: null, recipient: "" };
    },
    []
  );
  const readyProfile =
    profile && isCollectProfileWallet(profile, recipient) ? profile : null;
  const continuePlan = (plan: ApiCollectDailyTdhPlan, offers: boolean) => {
    if (
      !profile ||
      current.current.profile !== profile ||
      current.current.recipient.toLowerCase() !==
        plan.request.recipient.toLowerCase()
    )
      return;
    try {
      const items = collectDailyTdhSelection(plan, profile);
      if (offers) {
        if (recipient.toLowerCase() !== payingWallet?.toLowerCase())
          throw new Error("OFFER_WALLET");
        onPlanOffers?.(plan);
      } else onReviewPurchase(items, recipient);
    } catch {
      setError(t(locale, "collect.tdhTarget.stale"));
    }
  };
  return (
    <div className="tw-min-w-0 tw-space-y-4">
      <CollectTdhDailyController
        contextKey={recipient}
        onConnect={onConnect}
        calculate={
          readyProfile
            ? async (input, signal) => {
                setError(undefined);
                const request = collectDailyTdhRequest(
                  input,
                  readyProfile,
                  recipient,
                  collection
                );
                const plan = await createCollectDailyTdhPlan(request, signal);
                signal.throwIfAborted();
                validateCollectDailyTdhPlan(plan, request, readyProfile);
                return collectDailyTdhEstimate(plan);
              }
            : null
        }
        renderResult={(plan, guardAction) => (
          <CollectTdhDailyResults
            key={plan.plan_id}
            plan={plan}
            error={error}
            onReview={guardAction(() => continuePlan(plan, false))}
            onPlanOffers={
              onPlanOffers
                ? guardAction(() => continuePlan(plan, true))
                : undefined
            }
            offersDisabledReason={
              onPlanOffers &&
              recipient.toLowerCase() !== payingWallet?.toLowerCase()
                ? t(locale, "collect.tdhTarget.offerWallet")
                : undefined
            }
          />
        )}
      />
      {profile && (
        <CollectTdhTargetDelivery
          profile={profile}
          value={recipient}
          onChange={(value) => {
            current.current = { profile, recipient: value };
            setError(undefined);
            setRecipient(value);
          }}
        />
      )}
    </div>
  );
}
