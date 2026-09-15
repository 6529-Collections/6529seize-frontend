"use client";

import type { CollectCollection } from "./collect.types";
import { COLLECT_PLANNER_FAMILIES } from "./collect-families";
import { ApiCollectPlanningFamily } from "@/generated/models/ApiCollectPlanningFamily";
import type { ApiCollectTdhTargetPlan } from "@/generated/models/ApiCollectTdhTargetPlan";
import type { ApiCollectTdhTargetRequest } from "@/generated/models/ApiCollectTdhTargetRequest";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { createCollectTdhTargetPlan } from "@/services/api/collect-tdh-target-api";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CollectTdhTargetDelivery from "./CollectTdhTargetDelivery";
import CollectTdhTargetForm from "./CollectTdhTargetForm";
import CollectTdhTargetResults from "./CollectTdhTargetResults";
import {
  collectProfileWallets,
  defaultCollectRecipient,
  isCollectProfileWallet,
} from "./collect-recipient.helpers";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import {
  collectTdhTargetRequest,
  collectTdhTargetSelection,
  validateCollectTdhTargetPlan,
} from "./collect-tdh-target.helpers";
import type {
  CollectTdhTargetDraft,
  CollectTdhTargetField,
} from "./collect-tdh-target.types";
import { validateCollectTdhTargetDraft } from "./collect-tdh-target.validation";

interface Props {
  readonly revision?: number;
  readonly collection?: CollectCollection;
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string | undefined;
  readonly onConnect: () => void;
  readonly onReviewPurchase: (
    items: readonly CollectSelectedListing[],
    recipient: string
  ) => void;
  readonly onPlanOffers?: ((plan: ApiCollectTdhTargetPlan) => void) | undefined;
}

/** Keep account changes separate from in-flight analysis and its checkout callback. */
export default function CollectTdhTargetController(props: Props) {
  const membership = collectProfileWallets(props.profile)
    .map((wallet) => wallet.wallet.toLowerCase())
    .sort((left, right) => left.localeCompare(right))
    .join(":");
  return (
    <TargetController
      key={`${props.profile?.id ?? "guest"}:${membership}:${props.payingWallet?.toLowerCase() ?? ""}:${props.collection ?? "memes"}`}
      {...props}
    />
  );
}

function TargetController({
  collection = "memes",
  profile,
  payingWallet,
  onConnect,
  onReviewPurchase,
  onPlanOffers,
  revision: refreshRevision = 0,
}: Props) {
  const locale = useBrowserLocale();
  const [draft, setDraft] = useState<CollectTdhTargetDraft>({
    targetTdh: "",
    horizonDays: 30,
    family:
      COLLECT_PLANNER_FAMILIES.find(
        (family) => family.toString() === collection
      ) ?? ApiCollectPlanningFamily.Memes,
    mode: "total",
    budgetEth: "",
  });
  const [recipient, setRecipient] = useState(() =>
    defaultCollectRecipient(profile, payingWallet)
  );
  const [requested, setRequested] = useState<ApiCollectTdhTargetRequest | null>(
    null
  );
  const [invalid, setInvalid] = useState<CollectTdhTargetField>();
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{
    plan: ApiCollectTdhTargetPlan | null;
    request: ApiCollectTdhTargetRequest;
    revision: number;
    generation: number;
  } | null>(null);
  const pending = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useLayoutEffect(() => {
    // Invalidate captured actions before a receipt-triggered recalculation.
    revision.current++;
    pending.current?.abort();
    pending.current = null;
  }, [refreshRevision, requested, profile]);
  useLayoutEffect(
    () => () => {
      revision.current++;
      pending.current?.abort();
    },
    []
  );

  const clear = () => {
    revision.current++;
    pending.current?.abort();
    pending.current = null;
    setRequested(null);
    setResult(null);
    setError(undefined);
    setInvalid(undefined);
  };
  const submit = () => {
    if (!profile?.id || pending.current) return;
    const field = validateCollectTdhTargetDraft(draft);
    if (field) {
      setInvalid(field);
      setError(
        t(
          locale,
          field === "target"
            ? "collect.tdhTarget.invalidTarget"
            : "collect.goal.invalidBudget"
        )
      );
      return;
    }
    if (!isCollectProfileWallet(profile, recipient)) {
      setInvalid("recipient");
      setError(t(locale, "collect.tdhTarget.invalidRecipient"));
      return;
    }
    clear();
    setRequested(collectTdhTargetRequest(draft, profile, recipient));
  };
  useEffect(() => {
    if (!requested || !profile) return;
    const requestRevision = revision.current;
    const abort = new AbortController();
    pending.current = abort;
    const record = (plan: ApiCollectTdhTargetPlan | null) => {
      if (abort.signal.aborted || revision.current !== requestRevision) return;
      setError(undefined);
      setResult({
        plan,
        request: requested,
        revision: refreshRevision,
        generation: requestRevision,
      });
    };
    void createCollectTdhTargetPlan(requested, abort.signal)
      .then((plan) => {
        validateCollectTdhTargetPlan(plan, requested, profile);
        record(plan);
      })
      .catch(() => record(null))
      .finally(() => {
        if (pending.current === abort) pending.current = null;
      });
    return () => abort.abort();
  }, [requested, refreshRevision, profile]);
  const currentResult =
    result?.request === requested && result.revision === refreshRevision
      ? result
      : null;
  const loading = requested !== null && currentResult === null;
  const currentError =
    error ??
    (currentResult?.plan === null
      ? t(locale, "collect.tdhTarget.failed")
      : undefined);
  const continuePlan = (offers: boolean) => {
    if (
      !currentResult?.plan ||
      !profile ||
      currentResult.generation !== revision.current
    )
      return;
    if (
      offers &&
      currentResult.request.recipient.toLowerCase() !==
        payingWallet?.toLowerCase()
    ) {
      setError(t(locale, "collect.tdhTarget.offerWallet"));
      return;
    }
    try {
      validateCollectTdhTargetPlan(
        currentResult.plan,
        currentResult.request,
        profile
      );
      const items = collectTdhTargetSelection(currentResult.plan, profile);
      if (offers) onPlanOffers?.(currentResult.plan);
      else onReviewPurchase(items, currentResult.request.recipient);
    } catch {
      setError(t(locale, "collect.tdhTarget.stale"));
    }
  };
  return (
    <div className="tw-space-y-5">
      <CollectTdhTargetForm
        draft={draft}
        loading={loading}
        connected={Boolean(profile?.id)}
        invalid={invalid}
        error={currentError}
        delivery={
          profile ? (
            <CollectTdhTargetDelivery
              profile={profile}
              value={recipient}
              onChange={(value) => {
                clear();
                setRecipient(value);
              }}
            />
          ) : null
        }
        onChange={(value) => {
          clear();
          setDraft(value);
        }}
        onSubmit={submit}
        onConnect={onConnect}
      />
      {currentResult?.plan && (
        <CollectTdhTargetResults
          plan={currentResult.plan}
          onReview={() => continuePlan(false)}
          onPlanOffers={onPlanOffers ? () => continuePlan(true) : undefined}
          offersDisabledReason={
            onPlanOffers &&
            currentResult.request.recipient.toLowerCase() !==
              payingWallet?.toLowerCase()
              ? t(locale, "collect.tdhTarget.offerWallet")
              : undefined
          }
        />
      )}
    </div>
  );
}
