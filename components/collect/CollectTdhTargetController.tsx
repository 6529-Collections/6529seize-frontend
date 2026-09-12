"use client";

import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectTdhTargetPlan } from "@/generated/models/ApiCollectTdhTargetPlan";
import type { ApiCollectTdhTargetRequest } from "@/generated/models/ApiCollectTdhTargetRequest";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { createCollectTdhTargetPlan } from "@/services/api/collect-tdh-target-api";
import { useEffect, useRef, useState } from "react";
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
      key={`${props.profile?.id ?? "guest"}:${membership}:${props.payingWallet?.toLowerCase() ?? ""}`}
      {...props}
    />
  );
}

function TargetController({
  profile,
  payingWallet,
  onConnect,
  onReviewPurchase,
  onPlanOffers,
}: Props) {
  const locale = useBrowserLocale();
  const [draft, setDraft] = useState<CollectTdhTargetDraft>({
    targetTdh: "",
    horizonDays: 30,
    family: ApiCollectFamily.Memes,
    mode: "total",
    budgetEth: "",
  });
  const [recipient, setRecipient] = useState(() =>
    defaultCollectRecipient(profile, payingWallet)
  );
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState<CollectTdhTargetField>();
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{
    plan: ApiCollectTdhTargetPlan;
    request: ApiCollectTdhTargetRequest;
  } | null>(null);
  const pending = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useEffect(
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
    setLoading(false);
    setResult(null);
    setError(undefined);
    setInvalid(undefined);
  };
  const submit = async () => {
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
    const requestRevision = revision.current;
    const abort = new AbortController();
    pending.current = abort;
    setLoading(true);
    try {
      const request = collectTdhTargetRequest(draft, profile, recipient);
      const plan = await createCollectTdhTargetPlan(request, abort.signal);
      if (abort.signal.aborted || revision.current !== requestRevision) return;
      validateCollectTdhTargetPlan(plan, request, profile);
      setResult({ plan, request });
    } catch {
      if (!abort.signal.aborted && revision.current === requestRevision)
        setError(t(locale, "collect.tdhTarget.failed"));
    } finally {
      if (revision.current === requestRevision) {
        pending.current = null;
        setLoading(false);
      }
    }
  };
  const continuePlan = (offers: boolean) => {
    if (!result || !profile) return;
    if (
      offers &&
      result.request.recipient.toLowerCase() !== payingWallet?.toLowerCase()
    ) {
      setError(t(locale, "collect.tdhTarget.offerWallet"));
      return;
    }
    try {
      validateCollectTdhTargetPlan(result.plan, result.request, profile);
      const items = collectTdhTargetSelection(result.plan, profile);
      if (offers) onPlanOffers?.(result.plan);
      else onReviewPurchase(items, result.request.recipient);
    } catch {
      setError(t(locale, "collect.tdhTarget.stale"));
    }
  };
  return (
    <div className="tw-space-y-8">
      <CollectTdhTargetForm
        draft={draft}
        loading={loading}
        connected={Boolean(profile?.id)}
        invalid={invalid}
        error={error}
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
        onSubmit={() => {
          void submit();
        }}
        onConnect={onConnect}
      />
      {result && (
        <CollectTdhTargetResults
          plan={result.plan}
          onReview={() => continuePlan(false)}
          onPlanOffers={onPlanOffers ? () => continuePlan(true) : undefined}
          offersDisabledReason={
            onPlanOffers &&
            result.request.recipient.toLowerCase() !==
              payingWallet?.toLowerCase()
              ? t(locale, "collect.tdhTarget.offerWallet")
              : undefined
          }
        />
      )}
    </div>
  );
}
