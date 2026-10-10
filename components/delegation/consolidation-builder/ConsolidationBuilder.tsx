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
  buildConsolidationPlan,
  createDirectedLinkLookup,
  resolveConsolidationProgress,
  toWalletKey,
  validateConsolidationWallets,
  type ConsolidationPlan,
  type ConsolidationStepProgress,
} from "./consolidation-plan";
import {
  CONSOLIDATION_NOTICE_CLASS_NAME,
  ConsolidationBuilderWarnings,
  ConsolidationDepartureNotice,
  ConsolidationFourthSlotNotice,
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
import {
  useConsolidationGroups,
  useConsolidationLinkStatus,
} from "./useConsolidationBuilderData";
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

/**
 * On-chain link status captured when a wallet list is first planned. Step
 * numbering and order come from it, so confirmed steps stay in place while
 * live reads mark them done.
 */
interface LinkBaseline {
  readonly walletsKey: string;
  readonly registeredLinkKeys: readonly string[];
  readonly existingMembers: readonly string[];
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

function getNextBaseline(
  current: LinkBaseline | undefined,
  next: {
    readonly walletsKey: string;
    readonly registeredLinkKeys: readonly string[] | undefined;
    readonly existingMembers: readonly string[];
  }
): LinkBaseline | undefined {
  if (!next.registeredLinkKeys) {
    return undefined;
  }
  if (current?.walletsKey === next.walletsKey) {
    // Re-plan only when a direction the plan relied on has been revoked.
    const live = new Set(next.registeredLinkKeys);
    if (current.registeredLinkKeys.every((key) => live.has(key))) {
      return undefined;
    }
  }
  return {
    walletsKey: next.walletsKey,
    registeredLinkKeys: next.registeredLinkKeys,
    existingMembers: next.existingMembers,
  };
}

/** Current time, refreshed once when the fourth slot activates. */
function useFourthSlotClock(): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const remainingMs = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS - nowMs;
    if (remainingMs <= 0 || remainingMs > MAX_TIMER_DELAY_MS) {
      return undefined;
    }
    const timer = globalThis.setTimeout(() => {
      setNowMs(Date.now());
    }, remainingMs);
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

function shouldShowPlanNotices(
  plan: ConsolidationPlan,
  progress: readonly ConsolidationStepProgress[] | undefined
): boolean {
  return (
    plan.fourthSlotWait === "unreachable" ||
    progress?.some((step) => step.status !== "complete") === true
  );
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

  const linkStatus = useConsolidationLinkStatus(
    validation.isValid ? wallets : EMPTY_WALLETS
  );
  const [baseline, setBaseline] = useState<LinkBaseline>();
  const nextBaseline =
    validation.isValid && groupsReady
      ? getNextBaseline(baseline, {
          walletsKey,
          registeredLinkKeys: linkStatus.registeredLinkKeys,
          existingMembers,
        })
      : undefined;
  if (nextBaseline) {
    setBaseline(nextBaseline);
  }
  const activeBaseline =
    validation.isValid && baseline?.walletsKey === walletsKey
      ? baseline
      : undefined;

  const plan = useMemo<ConsolidationPlan | undefined>(
    () =>
      activeBaseline
        ? buildConsolidationPlan({
            wallets,
            existingMembers: activeBaseline.existingMembers,
            isRegistered: createDirectedLinkLookup(
              activeBaseline.registeredLinkKeys
            ),
            nowMs,
          })
        : undefined,
    [activeBaseline, nowMs, wallets]
  );
  const progress = useMemo(
    () =>
      plan && linkStatus.registeredLinkKeys
        ? resolveConsolidationProgress({
            plan,
            isRegistered: createDirectedLinkLookup(
              linkStatus.registeredLinkKeys
            ),
            connectedAddress: connectedKey,
          })
        : undefined,
    [connectedKey, linkStatus.registeredLinkKeys, plan]
  );

  function refreshConsolidationData() {
    linkStatus.refetch();
    void queryClient.invalidateQueries({
      queryKey: [QueryKey.CONSOLIDATION_GROUP],
    });
  }

  const stepWrite = useConsolidationStepWrite({
    onConfirmed: () => {
      refreshConsolidationData();
      void queryClient.invalidateQueries({
        queryKey: [QueryKey.WALLET_CONSOLIDATIONS_CHECK],
      });
    },
  });

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
            hasReadError: linkStatus.isError,
            progress,
          })}
          activationDate={activationDate}
          fourthSlotWait={plan?.fourthSlotWait ?? "none"}
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
          {plan && shouldShowPlanNotices(plan, progress) && (
            <>
              <ConsolidationFourthSlotNotice
                locale={locale}
                wait={plan.fourthSlotWait}
                activationDate={activationDate}
              />
              {plan.outOfOrder && (
                <p
                  className={`${CONSOLIDATION_NOTICE_CLASS_NAME} tw-mb-4 tw-mt-0`}
                >
                  {t(locale, "delegation.consolidationBuilder.outOfOrder")}
                </p>
              )}
            </>
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
