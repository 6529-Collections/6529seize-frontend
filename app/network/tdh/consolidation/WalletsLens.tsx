"use client";

import { useMemo } from "react";
import { useFact } from "@/components/explained/facts/FactsProvider";
import WalletGraph from "@/components/explained/figures/WalletGraph";
import { kt } from "@/components/explained/i18n";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import { EX_TEXT } from "@/components/explained/tokens";
import { formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";
import {
  secondsOf,
  utcClock,
  utcDay,
  utcDayYear,
} from "@/components/explained/layout/time";
import { wt } from "./copy";
import {
  walletCase,
  walletPositions,
  type WalletCase,
  type WalletPreset,
} from "./walletPresets";

interface PresetGroup {
  /** The group's accessible name: "Cases". */
  readonly label: string;
  /** A word before the group: "Add D". */
  readonly lead?: string;
  readonly options: readonly {
    readonly value: WalletPreset;
    readonly label: string;
  }[];
}

/** "A + D, B + C" or "B + C; A alone". */
function groupsText(locale: SupportedLocale, found: WalletCase): string {
  const groups = found.groups.map((group) => group.join(" + ")).join(", ");
  if (found.alone.length === 0) return groups;
  const alone = kt(locale, "explained.kit.wallets.alone", {
    wallets: formatList(locale, [...found.alone]),
  });
  return groups
    ? wt(locale, "explained.tdh.wallets.lens.groupsJoin", { groups, alone })
    : alone;
}

function sayOf(
  locale: SupportedLocale,
  preset: WalletPreset,
  found: WalletCase,
  gateDay: string
): { readonly lead: string | null; readonly rest: string } {
  switch (preset) {
    case "five":
      return {
        lead: wt(locale, "explained.tdh.wallets.lens.sayFiveLead"),
        rest: wt(locale, "explained.tdh.wallets.lens.sayFive", {
          alone: formatList(locale, [...found.alone]),
        }),
      };
    case "missing":
      return {
        lead: null,
        rest: wt(locale, "explained.tdh.wallets.lens.sayMissing"),
      };
    case "step1":
    case "step2":
      return {
        lead: wt(locale, "explained.tdh.wallets.lens.saySplitLead"),
        rest: wt(locale, "explained.tdh.wallets.lens.saySplit"),
      };
    case "batch":
      return {
        lead: wt(locale, "explained.tdh.wallets.lens.sayBatchLead"),
        rest: wt(locale, "explained.tdh.wallets.lens.sayBatch"),
      };
    case "oldfour":
      return {
        lead: null,
        rest: wt(locale, "explained.tdh.wallets.lens.sayOldFour", {
          date: gateDay,
        }),
      };
    case "three":
    case "step3":
      return {
        lead: null,
        rest: wt(locale, "explained.tdh.wallets.lens.sayOne"),
      };
  }
}

/**
 * Four wallets, one identity (TDH-DESIGN.md §5.9), on Your wallets and, as
 * the signing order, on Consolidation design. Each case is a set of
 * registrations the TDH v1.4 engine groups (P26 §6.2, §6.3); the figure
 * draws its result. Break it links a fifth wallet.
 */
export default function WalletsLens({
  locale,
  start,
  label,
  question,
  groups,
  withRule,
  caption,
}: {
  readonly locale: SupportedLocale;
  readonly start: WalletPreset;
  readonly label: string;
  readonly question: string;
  readonly groups: readonly PresetGroup[];
  /** The exact rule beside the stage (Your wallets). */
  readonly withRule: boolean;
  readonly caption?: string;
}) {
  const gate = useFact<string>("rules.gateActivation");
  const max = useFact<number>("rules.maxWallets");
  const ungated = useFact<number>("rules.ungatedMaxWallets");
  const model = useBreakable<{ preset: WalletPreset }>(
    { preset: start },
    () => ({ preset: "five" })
  );
  const preset = model.state.preset;
  const found = useMemo(() => walletCase(preset), [preset]);
  const at = walletPositions(found);
  const gateSeconds = gate ? secondsOf(gate.value) : null;
  const gateDay = gateSeconds === null ? "" : utcDay(locale, gateSeconds);
  const said = sayOf(locale, preset, found, gateDay);

  const rule =
    withRule && gateSeconds !== null && max && ungated
      ? {
          lines: [
            { text: wt(locale, "explained.tdh.wallets.lens.ruleBoth") },
            {
              text: wt(locale, "explained.tdh.wallets.lens.ruleNewest"),
              on: true,
            },
            {
              text: wt(locale, "explained.tdh.wallets.lens.ruleEvery"),
              on: true,
            },
            {
              text: wt(locale, "explained.tdh.wallets.lens.ruleGate", {
                ungated: formatCount(locale, ungated.value),
                gate: formatCount(locale, gateSeconds),
              }),
              on: preset === "oldfour" || preset === "batch",
            },
            {
              text: wt(locale, "explained.tdh.wallets.lens.ruleMax", {
                max: formatCount(locale, max.value),
              }),
              on: preset === "five",
            },
          ],
          source: wt(locale, "explained.tdh.wallets.lens.ruleSource", {
            gate: formatCount(locale, gateSeconds),
            date: `${utcDayYear(locale, gateSeconds)}, ${utcClock(locale, gateSeconds)} UTC`,
          }),
        }
      : undefined;

  return (
    <Lens
      id="wallets"
      label={label}
      question={question}
      broken={model.broken}
      locale={locale}
      stage={
        <>
          <div className="tw-grid tw-grid-cols-[minmax(0,1fr)] tw-gap-3">
            {groups.map((group) => {
              const value = group.options.some((o) => o.value === preset)
                ? preset
                : null;
              return (
                <div
                  key={group.label}
                  className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2"
                >
                  {group.lead !== undefined && (
                    <span
                      className="tw-text-sm tw-font-semibold tw-text-iron-400"
                      aria-hidden="true"
                    >
                      {group.lead}
                    </span>
                  )}
                  <Seg
                    label={group.label}
                    attr="preset"
                    value={value}
                    onChange={(next) => model.set({ preset: next })}
                    options={group.options}
                  />
                </div>
              );
            })}
          </div>
          <div className="tw-mt-6">
            <WalletGraph
              wallets={found.wallets.map((id) => ({
                id,
                x: at[id]?.x ?? 0.5,
                y: at[id]?.y ?? 0.5,
              }))}
              links={found.links}
              groups={found.groups}
              excluded={model.broken ? found.alone : []}
              locale={locale}
            />
          </div>
          {caption !== undefined && (
            <p className={`tw-m-0 tw-mt-2 ${EX_TEXT.cap}`}>{caption}</p>
          )}
        </>
      }
      {...(rule ? { rule } : {})}
      readout={
        <Readout
          big={
            <span
              className="tw-inline-block tw-whitespace-normal tw-text-[22px] tw-leading-7 md:tw-text-2xl md:tw-leading-[30px]"
              data-readout-groups=""
            >
              {groupsText(locale, found)}
            </span>
          }
          say={
            <>
              {said.lead && (
                <>
                  <b className="tw-font-semibold tw-text-iron-50">
                    {said.lead}
                  </b>{" "}
                </>
              )}
              {said.rest}
            </>
          }
        />
      }
      breakIt={
        <BreakIt
          id="five"
          pressed={model.broken}
          onToggle={model.toggleBreak}
          label={breakItLabel(
            locale,
            wt(locale, "explained.tdh.wallets.lens.break")
          )}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[{ kind: "decided", refText: "D136" }]}
          tag={{
            kind: "example",
            text: wt(locale, "explained.tdh.wallets.lens.tag"),
          }}
        />
      }
    />
  );
}
