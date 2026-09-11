"use client";

import Button from "@/components/utils/button/Button";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import { ApiCollectPlanStateEnum } from "@/generated/models/ApiCollectPlan";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  advanceCollectPlan,
  createCollectPlan,
} from "@/services/api/collect-api";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { isAddress, parseEther, zeroAddress } from "viem";
import { collectAnalysisRequest, collectGoalOptions } from "./collect.adapters";
import type { CollectGoalDraft } from "./collect.types";
import CollectGoalForm from "./CollectGoalForm";
import CollectRecipientPicker from "./CollectRecipientPicker";
import { isPositiveEthAmount } from "./collect-form.validation";

const MAX_STALLED_SCAN_ATTEMPTS = 8;
const MAX_SCAN_ATTEMPTS = 2000 + MAX_STALLED_SCAN_ATTEMPTS;
const INITIAL_SCAN_DELAY_MS = 350;
const MAX_SCAN_DELAY_MS = 5000;

export default function CollectGoalsController({
  draft,
  catalog,
  profile,
  onChange,
  onPlan,
  onConnect,
}: {
  readonly draft: CollectGoalDraft;
  readonly catalog: ApiCollectCatalog | undefined;
  readonly profile: ApiIdentity | null;
  readonly onChange: (draft: CollectGoalDraft) => void;
  readonly onPlan: (plan: ApiCollectPlan | null) => void;
  readonly onConnect: () => void;
}) {
  const locale = useBrowserLocale();
  const [recipient, setRecipient] = useState(profile?.primary_wallet ?? "");
  const [plan, setPlan] = useState<ApiCollectPlan | null>(null);
  const [scanError, setScanError] = useState(false);
  const [recipientError, setRecipientError] = useState(false);
  const [budgetError, setBudgetError] = useState(false);
  const scanProgress = useRef({ attempts: 0, stalled: 0 });
  const create = useMutation({ mutationFn: createCollectPlan });
  const scanning = plan?.state === ApiCollectPlanStateEnum.Scanning;
  useEffect(() => {
    if (plan?.state !== ApiCollectPlanStateEnum.Scanning || scanError) return;
    const abort = new AbortController();
    const timer = globalThis.setTimeout(
      () => {
        scanProgress.current.attempts += 1;
        void advanceCollectPlan(plan.id, abort.signal)
          .then((next) => {
            if (!abort.signal.aborted) {
              scanProgress.current.stalled =
                next.checked_asset_count > plan.checked_asset_count
                  ? 0
                  : scanProgress.current.stalled + 1;
              setPlan(next);
              onPlan(next);
              if (
                next.state === ApiCollectPlanStateEnum.Scanning &&
                (scanProgress.current.stalled >= MAX_STALLED_SCAN_ATTEMPTS ||
                  scanProgress.current.attempts >= MAX_SCAN_ATTEMPTS)
              )
                setScanError(true);
            }
          })
          .catch(() => {
            if (!abort.signal.aborted) setScanError(true);
          });
      },
      Math.min(
        INITIAL_SCAN_DELAY_MS * 2 ** scanProgress.current.stalled,
        MAX_SCAN_DELAY_MS
      )
    );
    return () => {
      abort.abort();
      globalThis.clearTimeout(timer);
    };
  }, [plan, scanError, onPlan]);
  const submit = (value: CollectGoalDraft) => {
    if (!profile?.id || !catalog) return;
    const validBudget = isPositiveEthAmount(value.budgetEth);
    setBudgetError(!validBudget);
    if (!validBudget) return;
    const valid =
      isAddress(recipient) && recipient.toLowerCase() !== zeroAddress;
    setRecipientError(!valid);
    if (!valid) return;
    scanProgress.current = { attempts: 0, stalled: 0 };
    setScanError(false);
    onPlan(null);
    setPlan(null);
    create.mutate(
      {
        goal: collectAnalysisRequest(profile.id, catalog, value),
        options: {
          budget_wei: parseEther(value.budgetEth).toString(),
          recipient,
        },
      },
      {
        onSuccess: (next) => {
          setPlan(next);
          onPlan(next);
        },
      }
    );
  };
  const requestError = create.isError
    ? t(locale, "collect.error.analysis")
    : undefined;
  return (
    <div className="tw-space-y-4">
      <CollectGoalForm
        draft={draft}
        definitions={collectGoalOptions(catalog, draft, locale)}
        profile={
          profile?.id
            ? { id: profile.id, displayName: profile.handle ?? profile.display }
            : null
        }
        loading={create.isPending || scanning}
        error={
          budgetError ? t(locale, "collect.goal.invalidBudget") : requestError
        }
        onChange={(value) => {
          setBudgetError(false);
          setPlan(null);
          onPlan(null);
          onChange(value);
        }}
        onSubmit={submit}
        onConnect={onConnect}
      />
      <fieldset
        disabled={create.isPending}
        className="tw-m-0 tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4"
      >
        <CollectRecipientPicker
          profile={profile}
          value={recipient}
          invalid={recipientError}
          errorId="collect-goal-recipient-error"
          onChange={(address) => {
            setRecipient(address);
            setRecipientError(false);
            setPlan(null);
            onPlan(null);
          }}
        />
        {recipientError && (
          <p
            id="collect-goal-recipient-error"
            role="alert"
            className="tw-text-sm tw-text-red"
          >
            {t(locale, "collect.trade.invalid.recipient")}
          </p>
        )}
      </fieldset>
      {scanning && (
        <p role="status" className="tw-text-sm tw-text-iron-300">
          {t(locale, "collect.plan.scanning", {
            checked: plan.checked_asset_count,
            total: plan.total_asset_count,
          })}
        </p>
      )}
      {scanError && (
        <div role="alert" className="tw-space-y-3 tw-text-sm tw-text-iron-300">
          <p>{t(locale, "collect.plan.scanError")}</p>
          <Button
            variant="secondary"
            onClick={() => {
              scanProgress.current = { attempts: 0, stalled: 0 };
              setScanError(false);
            }}
          >
            {t(locale, "collect.retry")}
          </Button>
        </div>
      )}
    </div>
  );
}
