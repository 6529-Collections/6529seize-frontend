"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
  CONSOLIDATION_WALLET_LIMIT,
} from "@/constants/consolidation.constants";
import { formatAddress } from "@/helpers/addressFormatting";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getAddress } from "viem";
import { DelegationFormShell } from "../DelegationFormParts";
import { DelegationToast } from "../DelegationToast";
import {
  getConsolidationDepartures,
  getPrefillWallets,
  selectExistingMembers,
} from "./consolidation-groups";
import {
  createDirectedLinkLookup,
  resolveConsolidationProgress,
  toWalletKey,
  validateConsolidationWallets,
  type ConsolidationStepProgress,
} from "./consolidation-plan";
import {
  ConsolidationBuilderWarnings,
  ConsolidationDepartureNotice,
  ConsolidationPlanNotices,
} from "./ConsolidationBuilderNotices";
import {
  ConsolidationBuilderSteps,
  type ConsolidationStepsState,
} from "./ConsolidationBuilderSteps";
import {
  ConsolidationBuilderWallets,
  type ConsolidationGroupLookupState,
  type ConsolidationWalletEntry,
} from "./ConsolidationBuilderWallets";
import { useConsolidationGroups } from "./useConsolidationBuilderData";
import { useConsolidationPlan } from "./useConsolidationPlan";
import { useConsolidationStepWrite } from "./useConsolidationStepWrite";

interface Props {
  readonly connectedAddress: string | undefined;
  readonly walletResolving: boolean;
  readonly onConnect: () => void;
  readonly onHide: () => void;
}

interface WalletDraft {
  readonly entries: readonly ConsolidationWalletEntry[];
  readonly nextId: number;
}

const MIN_WALLET_ROWS = 2;
const MAX_TIMER_DELAY_MS = 2_147_483_647;
const EMPTY_WALLETS: readonly string[] = [];
const ACTIVATION_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
  timeZoneName: "short",
};

function createDraft(values: readonly string[]): WalletDraft {
  const rows = [...values];
  while (rows.length < MIN_WALLET_ROWS) {
    rows.push("");
  }
  return {
    entries: rows.map((value, index) => ({ id: String(index), value })),
    nextId: rows.length,
  };
}

/**
 * Current time, refreshed when the fourth slot activates. Waits longer than
 * the browser's timer limit are chained, so a long-open tab still flips.
 */
function useFourthSlotClock(): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const remainingMs = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS - nowMs;
    if (remainingMs <= 0) {
      return undefined;
    }
    const timer = globalThis.setTimeout(
      () => {
        setNowMs(Date.now());
      },
      Math.min(remainingMs, MAX_TIMER_DELAY_MS)
    );
    return () => globalThis.clearTimeout(timer);
  }, [nowMs]);

  return nowMs;
}

function getGroupLookupState(
  walletCount: number,
  groups: { readonly isPending: boolean; readonly isError: boolean }
): ConsolidationGroupLookupState {
  if (walletCount === 0) {
    return "ready";
  }
  if (groups.isError) {
    return "error";
  }
  return groups.isPending ? "loading" : "ready";
}

function getStepsState(input: {
  readonly isPrefilling: boolean;
  readonly isValid: boolean;
  readonly hasGroupError: boolean;
  readonly hasReadError: boolean;
  readonly progress: readonly ConsolidationStepProgress[] | undefined;
}): ConsolidationStepsState {
  if (input.isPrefilling) {
    return { kind: "loading" };
  }
  if (!input.isValid) {
    return { kind: "incomplete" };
  }
  if (input.hasReadError) {
    return { kind: "error" };
  }
  if (input.hasGroupError) {
    return { kind: "groupError" };
  }
  return input.progress
    ? { kind: "ready", steps: input.progress }
    : { kind: "loading" };
}

function hasUnfinishedStep(
  progress: readonly ConsolidationStepProgress[] | undefined
): boolean {
  return progress?.some((step) => step.status !== "complete") === true;
}

/**
 * Guided consolidation: plans one transaction per wallet in the safe order
 * and lets each step's signer submit it once every earlier step confirms.
 */
export default function ConsolidationBuilder(props: Readonly<Props>) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const nowMs = useFourthSlotClock();
  const connectedKey =
    !props.walletResolving && props.connectedAddress
      ? toWalletKey(props.connectedAddress)
      : undefined;

  const [draft, setDraft] = useState<WalletDraft | null>(null);
  const defaultDraft = useMemo(
    () => createDraft(connectedKey ? [connectedKey] : []),
    [connectedKey]
  );
  const entries = (draft ?? defaultDraft).entries;
  const validation = useMemo(
    () => validateConsolidationWallets(entries.map((entry) => entry.value)),
    [entries]
  );
  const walletsKey = validation.wallets.join(",");
  const wallets = useMemo(
    () => (walletsKey ? walletsKey.split(",") : EMPTY_WALLETS),
    [walletsKey]
  );

  const groupData = useConsolidationGroups(wallets);
  const { groups } = groupData;
  const connectedGroup = connectedKey ? groups.get(connectedKey) : undefined;
  if (draft === null && connectedKey && connectedGroup) {
    // Prefill once with the connected wallet's current consolidation; later
    // wallet switches keep the list so each signer can connect in turn.
    setDraft(createDraft(getPrefillWallets(connectedKey, connectedGroup)));
  }

  const groupsReady =
    !groupData.isPending &&
    !groupData.isError &&
    wallets.every((wallet) => groups.has(wallet));
  const existingMembers = useMemo(
    () => selectExistingMembers(wallets, groups),
    [groups, wallets]
  );
  const departures = useMemo(
    () => (groupsReady ? getConsolidationDepartures(wallets, groups) : []),
    [groups, groupsReady, wallets]
  );

  const planState = useConsolidationPlan({
    wallets,
    isValid: validation.isValid,
    groupsReady,
    existingMembers,
    nowMs,
  });
  const { plan, registeredLinkKeys, freshLinkKeys } = planState;

  function refreshConsolidationData() {
    planState.refetchLinks();
    for (const key of [
      QueryKey.CONSOLIDATION_GROUP,
      QueryKey.CONSOLIDATION_REGISTRATIONS,
    ]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  }

  const stepWrite = useConsolidationStepWrite({
    onConfirmed: () => {
      refreshConsolidationData();
      void queryClient.invalidateQueries({
        queryKey: [QueryKey.WALLET_CONSOLIDATIONS_CHECK],
      });
    },
  });
  const { recordedLinkKeys } = stepWrite;

  const progress = useMemo(
    () =>
      plan && registeredLinkKeys && freshLinkKeys
        ? resolveConsolidationProgress({
            plan,
            isRegistered: createDirectedLinkLookup(registeredLinkKeys),
            isFresh: createDirectedLinkLookup(freshLinkKeys),
            recordedLinkKeys,
            connectedAddress: connectedKey,
          })
        : undefined,
    [connectedKey, freshLinkKeys, plan, recordedLinkKeys, registeredLinkKeys]
  );

  function updateDraft(update: (current: WalletDraft) => WalletDraft) {
    setDraft((current) => update(current ?? defaultDraft));
  }

  function getWalletLabel(wallet: string): string {
    const index = entries.findIndex(
      (entry) => toWalletKey(entry.value) === wallet
    );
    return index < 0
      ? formatAddress(getAddress(wallet))
      : t(locale, "delegation.consolidationBuilder.wallets.label", {
          position: formatInteger(locale, index + 1),
        });
  }

  const activationDate = formatDate(
    locale,
    CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
    ACTIVATION_DATE_FORMAT
  );

  return (
    <DelegationFormShell
      title={t(locale, "delegation.consolidationBuilder.title")}
      description={t(locale, "delegation.consolidationBuilder.description", {
        limit: formatInteger(locale, CONSOLIDATION_WALLET_LIMIT),
      })}
      closeTitle={t(locale, "delegation.consolidationBuilder.closeTitle")}
      onHide={props.onHide}
    >
      <ConsolidationBuilderWarnings locale={locale} />
      <ConsolidationBuilderWallets
        locale={locale}
        entries={entries}
        issues={validation.issues}
        validCount={validation.wallets.length}
        connectedKey={connectedKey}
        existingMembers={new Set(existingMembers)}
        groupLookupState={getGroupLookupState(wallets.length, groupData)}
        onChange={(id, value) =>
          updateDraft((current) => ({
            ...current,
            entries: current.entries.map((entry) =>
              entry.id === id ? { ...entry, value } : entry
            ),
          }))
        }
        onRemove={(id) =>
          updateDraft((current) => ({
            ...current,
            entries: current.entries.filter((entry) => entry.id !== id),
          }))
        }
        onAdd={() =>
          updateDraft((current) => ({
            entries: [
              ...current.entries,
              { id: String(current.nextId), value: "" },
            ],
            nextId: current.nextId + 1,
          }))
        }
        onRetryGroups={refreshConsolidationData}
      />
      <ConsolidationDepartureNotice
        locale={locale}
        departures={departures}
        getWalletLabel={getWalletLabel}
        getShortAddress={(wallet) => formatAddress(getAddress(wallet))}
      />
      <div className="tw-mt-6 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-6">
        <ConsolidationBuilderSteps
          locale={locale}
          state={getStepsState({
            isPrefilling:
              draft === null && !!connectedKey && groupData.isPending,
            isValid: validation.isValid,
            hasGroupError: groupData.isError,
            hasReadError: planState.hasReadError,
            progress,
          })}
          activationDate={activationDate}
          walletResolving={props.walletResolving}
          isBusy={stepWrite.isBusy}
          busySigner={stepWrite.busySigner}
          gasError={stepWrite.gasError}
          gasErrorSigner={stepWrite.gasErrorSigner}
          getWalletLabel={getWalletLabel}
          getDisplayAddress={(wallet) => getAddress(wallet)}
          onSign={stepWrite.submit}
          onConnect={props.onConnect}
          onRetry={refreshConsolidationData}
        >
          {plan && hasUnfinishedStep(progress) && (
            <ConsolidationPlanNotices
              locale={locale}
              plan={plan}
              activationDate={activationDate}
            />
          )}
        </ConsolidationBuilderSteps>
      </div>
      {stepWrite.toast && (
        <DelegationToast
          toast={stepWrite.toast}
          showToast={stepWrite.showToast}
          setShowToast={(show) => {
            if (!show) {
              stepWrite.dismissToast();
            }
          }}
        />
      )}
    </DelegationFormShell>
  );
}
