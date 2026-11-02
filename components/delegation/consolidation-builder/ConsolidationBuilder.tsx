"use client";

import { useConsolidationPolicy } from "@/hooks/useConsolidationPolicy";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { formatAddress } from "@/helpers/addressFormatting";
import type { ConsolidationPolicy } from "@/helpers/consolidationPolicy";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
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
  ConsolidationSafeWalletNotice,
} from "./ConsolidationBuilderNotices";
import {
  ConsolidationBuilderSteps,
  type ConsolidationStepsState,
} from "./ConsolidationBuilderSteps";
import {
  ConsolidationBuilderWallets,
  getConsolidationWalletValue,
  type ConsolidationGroupLookupState,
  type ConsolidationWalletEntry,
} from "./ConsolidationBuilderWallets";
import {
  useConsolidationGroups,
  useConsolidationManagedWallets,
} from "./useConsolidationBuilderData";
import { useConsolidationPlan } from "./useConsolidationPlan";
import { useConsolidationStepWrite } from "./useConsolidationStepWrite";

interface Props {
  readonly connectedAddress: string | undefined;
  /** The connected wallet is a Safe (smart-contract wallet). */
  readonly isSafeWallet: boolean;
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
 * Current time, refreshed at the cutoff and signing opening. Waits longer than
 * the browser's timer limit are chained, so a long-open tab still flips.
 */
function useConsolidationClock(
  activationMs: number | undefined,
  signingOpensMs: number | undefined
): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const nextDeadline = Math.min(
      ...[activationMs, signingOpensMs].filter(
        (deadline): deadline is number =>
          deadline !== undefined && deadline > nowMs
      )
    );
    if (!Number.isFinite(nextDeadline)) {
      return undefined;
    }
    const remainingMs = Math.max(0, nextDeadline - Date.now());
    const timer = globalThis.setTimeout(
      () => {
        setNowMs(Date.now());
      },
      Math.min(remainingMs, MAX_TIMER_DELAY_MS)
    );
    return () => globalThis.clearTimeout(timer);
  }, [activationMs, nowMs, signingOpensMs]);

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
 * Formatted activation and signing-open times, empty until the policy loads.
 * The wallet list shows when signing opens only before the cutoff.
 */
function getPolicyDates(
  locale: SupportedLocale,
  policy: ConsolidationPolicy | null,
  nowMs: number
): {
  activationDate: string;
  signingOpensDate: string;
  preActivationSigningDate: string | null;
} {
  if (!policy) {
    return {
      activationDate: "",
      signingOpensDate: "",
      preActivationSigningDate: null,
    };
  }
  const signingOpensDate = formatDate(
    locale,
    policy.signingOpensMs,
    ACTIVATION_DATE_FORMAT
  );
  return {
    activationDate: formatDate(
      locale,
      policy.activationMs,
      ACTIVATION_DATE_FORMAT
    ),
    signingOpensDate,
    preActivationSigningDate:
      nowMs < policy.activationMs
        ? formatDate(locale, policy.signingOpensMs, {
            ...ACTIVATION_DATE_FORMAT,
            month: "short",
          }).replace(/\sUTC$/, "\u00a0UTC")
        : null,
  };
}

/**
 * Guided consolidation: plans one transaction per wallet in the safe order
 * and lets each step's signer submit it once every earlier step confirms.
 * A wallet's Delegation Manager can sign its step instead, one link at a
 * time, so a vault never has to connect.
 */
export default function ConsolidationBuilder(props: Readonly<Props>) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const {
    policy,
    limits,
    isLoading: policyLoading,
    reload: reloadPolicy,
  } = useConsolidationPolicy();
  const nowMs = useConsolidationClock(
    policy?.activationMs,
    policy?.signingOpensMs
  );
  const connectedKey =
    !props.walletResolving && props.connectedAddress
      ? toWalletKey(props.connectedAddress)
      : undefined;
  const connectedIsSafe = connectedKey !== undefined && props.isSafeWallet;

  const [draft, setDraft] = useState<WalletDraft | null>(null);
  const defaultDraft = useMemo(
    () => createDraft(connectedKey ? [connectedKey] : []),
    [connectedKey]
  );
  const entries = (draft ?? defaultDraft).entries;
  const validation = useMemo(
    () =>
      validateConsolidationWallets(
        entries.map(getConsolidationWalletValue),
        limits
      ),
    [entries, limits]
  );
  const walletsKey = validation.wallets.join(",");
  const wallets = useMemo(
    () => (walletsKey ? walletsKey.split(",") : EMPTY_WALLETS),
    [walletsKey]
  );

  const groupData = useConsolidationGroups(wallets);
  const { groups } = groupData;
  const connectedGroup = connectedKey ? groups.get(connectedKey) : undefined;
  if (draft === null && connectedKey && connectedGroup && limits) {
    // Prefill once with the connected wallet's current consolidation; later
    // wallet switches keep the list so each signer can connect in turn.
    setDraft(
      createDraft(
        getPrefillWallets(connectedKey, connectedGroup, limits.maxWallets)
      )
    );
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
    policy,
    limits,
  });
  const { plan, registeredLinkKeys, freshLinkKeys } = planState;
  const managers = useConsolidationManagedWallets(
    validation.isValid ? wallets : EMPTY_WALLETS,
    connectedKey
  );

  function refreshConsolidationData() {
    planState.refetchLinks();
    managers.refetch();
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
            connectedIsSafe,
            managedWallets: managers.managedWallets,
          })
        : undefined,
    [
      connectedIsSafe,
      connectedKey,
      freshLinkKeys,
      managers.managedWallets,
      plan,
      recordedLinkKeys,
      registeredLinkKeys,
    ]
  );

  function updateDraft(update: (current: WalletDraft) => WalletDraft) {
    setDraft((current) => {
      const initial = current ?? defaultDraft;
      const updated = update(initial);
      return updated === initial ? current : updated;
    });
  }

  function updateWallet(id: string, field: "value" | "address", value: string) {
    updateDraft((current) => {
      const target = current.entries.find((entry) => entry.id === id);
      const previous =
        field === "address"
          ? (target?.address ?? target?.value)
          : target?.value;
      if (!target || previous === value) return current;
      return {
        ...current,
        entries: current.entries.map((entry) =>
          entry.id === id ? { ...entry, [field]: value } : entry
        ),
      };
    });
  }

  function getWalletLabel(wallet: string): string {
    const index = entries.findIndex(
      (entry) => toWalletKey(getConsolidationWalletValue(entry)) === wallet
    );
    return index < 0
      ? formatAddress(getAddress(wallet))
      : t(locale, "delegation.consolidationBuilder.wallets.label", {
          position: formatInteger(locale, index + 1),
        });
  }

  const { activationDate, signingOpensDate, preActivationSigningDate } =
    getPolicyDates(locale, policy, nowMs);

  return (
    <DelegationFormShell
      title={t(locale, "delegation.consolidationBuilder.title")}
      description={
        limits
          ? t(locale, "delegation.consolidationBuilder.description", {
              limit: formatInteger(locale, limits.maxWallets),
            })
          : t(locale, "delegation.consolidationBuilder.metadataDescription")
      }
      closeTitle={t(locale, "delegation.consolidationBuilder.closeTitle")}
      onHide={props.onHide}
    >
      <ConsolidationBuilderWarnings locale={locale} />
      <ConsolidationSafeWalletNotice
        locale={locale}
        isSafeWallet={connectedIsSafe}
      />
      <ConsolidationBuilderWallets
        locale={locale}
        maxWallets={limits?.maxWallets ?? null}
        preActivationSigningDate={preActivationSigningDate}
        entries={entries}
        issues={validation.issues}
        validCount={validation.wallets.length}
        connectedKey={connectedKey}
        existingMembers={new Set(existingMembers)}
        groupLookupState={getGroupLookupState(wallets.length, groupData)}
        onChange={(id, value) => updateWallet(id, "value", value)}
        onAddressChange={(id, address) => updateWallet(id, "address", address)}
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
        {(!limits || validation.wallets.length > limits.ungatedMaxWallets) &&
          !policy &&
          policyLoading && (
            <output className="tw-mb-4 tw-block tw-text-sm tw-text-iron-300">
              {t(locale, "delegation.consolidationBuilder.policy.loading")}
            </output>
          )}
        {(!limits || validation.wallets.length > limits.ungatedMaxWallets) &&
          !policy &&
          !policyLoading && (
            <div role="alert" className="tw-mb-4 tw-text-sm tw-text-iron-300">
              {t(locale, "delegation.consolidationBuilder.policy.unavailable")}
              {reloadPolicy && (
                <button
                  type="button"
                  className="tw-ml-2 tw-underline"
                  onClick={() => {
                    void reloadPolicy({ reset: true }).catch(() => undefined);
                  }}
                >
                  {t(locale, "delegation.consolidationBuilder.retry")}
                </button>
              )}
            </div>
          )}
        <ConsolidationBuilderSteps
          locale={locale}
          state={getStepsState({
            isPrefilling:
              draft === null && !!connectedKey && groupData.isPending,
            isValid: validation.isValid,
            hasGroupError: groupData.isError,
            hasReadError: planState.hasReadError || managers.isError,
            progress,
          })}
          activationDate={signingOpensDate}
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
              signingOpensDate={signingOpensDate}
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
