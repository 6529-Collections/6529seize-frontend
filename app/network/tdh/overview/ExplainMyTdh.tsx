"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import { LimitNote } from "@/components/explained/evidence/notes";
import { Seg } from "@/components/explained/lens/controls";
import { Icon } from "@/components/explained/marks/glyphs";
import Tag from "@/components/explained/marks/Tag";
import { EX_BUTTON, EX_FOCUS, EX_LINK } from "@/components/explained/tokens";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiConsolidatedTdh } from "@/generated/models/ApiConsolidatedTdh";
import type { SupportedLocale } from "@/i18n/locales";
import {
  factFromSnapshot,
  type FactId,
  type FactSnapshot,
} from "@/lib/explained/facts";
import { formatCents, formatCount, formatUtcDay } from "@/lib/explained/format";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { tdhProfileSchema, type TdhProfile } from "../tdh-profile.helpers";
import { orich, ot } from "./copy";
import {
  exampleSummary,
  includedIn,
  summarizeProfile,
  type LatestComparison,
  type RecordSummary,
} from "./explain";
import NewBuyerExample from "./NewBuyerExample";
import RecordTable from "./RecordTable";

/**
 * Explain my TDH (TDH-DESIGN.md §4.1 §03): a profile, an ENS name or an
 * address, looked up in 6529.io's stored calculation, shown as copies ×
 * whole days × rate per card, the boost, the total, and whether the latest
 * daily comparison included the record. Until a reader looks one up, three
 * labelled example records show the three answers: a record found, a card
 * bought this week, and a name not found.
 */
type Pick = "found" | "new" | "none";

const ROWS_SHOWN = 8;
/** The example record: one copy of #2 held long, two of #560 bought last week. */
const EXAMPLE_HOLDINGS = [
  { id: "2", copies: 1, days: 1592 },
  { id: "560", copies: 2, days: 5 },
] as const;
const BOLD = "tw-font-semibold tw-text-iron-50";

function num(snapshot: FactSnapshot, id: FactId): number | null {
  return factFromSnapshot<number>(snapshot, id)?.value ?? null;
}

function text(snapshot: FactSnapshot, id: FactId): string | null {
  return factFromSnapshot<string>(snapshot, id)?.value ?? null;
}

/** The latest comparison, from the facts: its block, and whether every record was equal. */
function latestComparison(snapshot: FactSnapshot): LatestComparison | null {
  const cutoff = num(snapshot, "tdh.latest.cutoff");
  const total = num(snapshot, "tdh.latest.agree.live.identities.total");
  const live = num(snapshot, "tdh.latest.agree.live.identities.equal");
  const python = num(snapshot, "tdh.latest.agree.python.identities.equal");
  if (cutoff === null || total === null) return null;
  return { cutoff, allEqual: live === total && python === total };
}

function foundExample(snapshot: FactSnapshot): RecordSummary | null {
  const holdings = EXAMPLE_HOLDINGS.map((holding) => ({
    ...holding,
    edition: num(snapshot, `meme.${holding.id}.edition` as FactId),
    rate: num(snapshot, `meme.${holding.id}.rate` as FactId),
  }));
  const ready = holdings.flatMap((holding) =>
    holding.edition === null || holding.rate === null
      ? []
      : [
          {
            id: holding.id,
            copies: holding.copies,
            days: holding.days,
            edition: holding.edition,
            rateCents: Math.round(holding.rate * 100),
          },
        ]
  );
  return ready.length === holdings.length ? exampleSummary(ready, 100) : null;
}

/** Each card's effective edition, from the facts' list of every Meme. */
function editionLookup(snapshot: FactSnapshot) {
  const list =
    factFromSnapshot<number[][]>(snapshot, "memes.editions")?.value ?? [];
  const byId = new Map(list.map((row) => [String(row[0]), row[3] ?? null]));
  return (collection: string, id: string): number | null =>
    collection === "memes" ? (byId.get(id) ?? null) : null;
}

function TotalLine({
  summary,
  date,
  locale,
}: {
  readonly summary: RecordSummary;
  readonly date: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <p className="tw-m-0 tw-mt-4 tw-text-[15px] tw-leading-6 tw-text-iron-300">
      {orich(locale, "explain.total", {
        base: formatCount(locale, summary.base),
        boost: formatCents(locale, summary.boostCents / 100),
        total: (
          <b className={BOLD}>
            {ot(locale, "explain.totalTdh", {
              total: formatCount(locale, summary.total),
            })}
          </b>
        ),
        date,
      })}
    </p>
  );
}

// Shown only when the record is the latest result's, whose date the total
// line above already gives.
function Included({
  cycle,
  locale,
}: {
  readonly cycle: number | null;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-mt-4">
      <LimitNote tone="holds" title={ot(locale, "explain.includedTitle")}>
        {ot(locale, "explain.included")}{" "}
        {cycle !== null && (
          <Link className={EX_LINK} href={`/network/tdh/verification/${cycle}`}>
            {ot(locale, "explain.includedLink")}
          </Link>
        )}
      </LimitNote>
    </div>
  );
}

function FoundExample({ locale }: { readonly locale: SupportedLocale }) {
  const snapshot = useFactSnapshot();
  const summary = foundExample(snapshot);
  const latest = text(snapshot, "tdh.latest.date");
  if (summary === null || latest === null) return null;
  const date = formatUtcDay(locale, latest);
  return (
    <div data-ans="found" data-ex-allow-number="">
      <RecordTable rows={summary.rows} locale={locale} />
      <TotalLine summary={summary} date={date} locale={locale} />
      {/* A constructed record was never compared: no verdict sits on it, only
          what the line says for a real one. */}
      <p className="tw-m-0 tw-mt-4 tw-text-[15px] tw-leading-6 tw-text-iron-400">
        {ot(locale, "explain.includedExample")}
      </p>
    </div>
  );
}

function NoneExample({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div data-ans="none">
      <p className="tw-m-0 tw-text-[21px] tw-font-semibold tw-leading-7 tw-text-iron-50">
        {ot(locale, "explain.noneTitle")}
      </p>
      <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {ot(locale, "explain.noneBody")}
      </p>
    </div>
  );
}

function RealRecord({
  profile,
  identity,
  locale,
}: {
  readonly profile: TdhProfile;
  readonly identity: string;
  readonly locale: SupportedLocale;
}) {
  const snapshot = useFactSnapshot();
  const summary = summarizeProfile(
    profile,
    ROWS_SHOWN,
    editionLookup(snapshot)
  );
  const date = formatUtcDay(locale, profile.date);
  const latest = latestComparison(snapshot);
  const latestDate = text(snapshot, "tdh.latest.date");
  return (
    <div data-ans="record" data-ex-allow-number="">
      <h3 className="tw-m-0 tw-break-words tw-text-[21px] tw-font-semibold tw-leading-7 tw-text-iron-50">
        {ot(locale, "explain.result", { identity })}
      </h3>
      {summary.rows.length > 0 ? (
        <div className="tw-mt-4">
          <RecordTable rows={summary.rows} locale={locale} />
          {summary.more.count > 0 && (
            <p className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-6 tw-text-iron-400">
              {ot(locale, "explain.more", {
                count: formatCount(locale, summary.more.count),
                base: formatCount(locale, summary.more.base),
              })}
            </p>
          )}
        </div>
      ) : (
        <p className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-6 tw-text-iron-300">
          {ot(locale, "explain.empty")}
        </p>
      )}
      <TotalLine summary={summary} date={date} locale={locale} />
      {includedIn(profile, latest) && latestDate !== null ? (
        <Included cycle={num(snapshot, "tdh.latest.cycle")} locale={locale} />
      ) : (
        <div className="tw-mt-4">
          <LimitNote title={ot(locale, "explain.notCheckedTitle")}>
            {ot(locale, "explain.notChecked", {
              block: formatCount(locale, profile.block),
              cutoff: formatCount(locale, latest?.cutoff ?? 0),
            })}
          </LimitNote>
        </div>
      )}
    </div>
  );
}

function useLookup(identity: string) {
  return useQuery({
    queryKey: [QueryKey.TDH_PROFILE_SNAPSHOT, identity],
    queryFn: async ({ signal }) =>
      tdhProfileSchema.parse(
        await commonApiFetch<ApiConsolidatedTdh>({
          endpoint: `tdh/consolidation/${encodeURIComponent(identity)}`,
          signal,
          errorMode: "structured",
          includeWalletAuth: false,
        })
      ),
    enabled: identity.length > 0,
    staleTime: 60_000,
    retry: false,
  });
}

function LookupResult({
  identity,
  locale,
}: {
  readonly identity: string;
  readonly locale: SupportedLocale;
}) {
  const query = useLookup(identity);
  let body: ReactNode = null;
  if (query.isFetching) {
    body = (
      <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {ot(locale, "explain.loading", { identity })}
      </p>
    );
  } else if (query.isError) {
    const status = getStructuredApiErrorStatus(query.error);
    body =
      status === 404 ? (
        <NoneExample locale={locale} />
      ) : (
        <div>
          <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
            {/* A name 6529.io cannot resolve comes back as a server error,
                so a name gets the spelling hint, not "did not answer". */}
            {identity.toLowerCase().endsWith(".eth")
              ? ot(locale, "explain.errorEns", { identity })
              : ot(locale, "explain.error")}
          </p>
          <button
            type="button"
            className={`${EX_BUTTON.secondary} tw-mt-3`}
            onClick={() => void query.refetch()}
          >
            {ot(locale, "explain.retry")}
          </button>
        </div>
      );
  } else if (query.data) {
    body = (
      <RealRecord profile={query.data} identity={identity} locale={locale} />
    );
  }
  return <div aria-live="polite">{body}</div>;
}

function LookupForm({
  onSubmit,
  locale,
  showsExample,
}: {
  readonly onSubmit: (identity: string) => void;
  readonly locale: SupportedLocale;
  readonly showsExample: boolean;
}) {
  const [input, setInput] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim().replace(/^@/, "");
    if (value) onSubmit(value);
  };
  const label = ot(locale, "explain.input");
  return (
    <form
      onSubmit={submit}
      className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-3 md:tw-grid-cols-[minmax(0,1fr)_auto_auto]"
      role="search"
    >
      <label className="tw-relative tw-block">
        <span className="tw-sr-only">{label}</span>
        <span className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-iron-400">
          <SearchGlyph />
        </span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={200}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={ot(locale, "explain.placeholder")}
          className={`tw-h-[50px] tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-[#0B0B0D] tw-pl-11 tw-pr-4 tw-text-base tw-text-iron-50 placeholder:tw-text-iron-400 ${EX_FOCUS}`}
        />
      </label>
      <button type="submit" className={EX_BUTTON.secondary}>
        {ot(locale, "explain.submit")}
        <Icon kind="arrow" className="tw-size-4" />
      </button>
      {showsExample && (
        <span className="tw-justify-self-start md:tw-justify-self-end">
          <Tag kind="example" locale={locale}>
            {ot(locale, "explain.examples")}
          </Tag>
        </span>
      )}
    </form>
  );
}

function SearchGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="tw-block tw-size-[18px]"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="7"
        cy="7"
        r="4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10.4 10.4 14 14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ExplainMyTdh({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [pick, setPick] = useState<Pick>("found");
  const [identity, setIdentity] = useState("");
  const showsExample = identity.length === 0;
  return (
    <div
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-4 md:tw-p-6"
      data-lens="picker"
    >
      <LookupForm
        onSubmit={setIdentity}
        locale={locale}
        showsExample={showsExample}
      />
      <div className="tw-mt-4">
        <Seg
          label={ot(locale, "explain.examplesGroup")}
          attr="pick"
          value={showsExample ? pick : null}
          onChange={(value) => {
            setPick(value);
            setIdentity("");
          }}
          options={[
            { value: "found", label: ot(locale, "explain.pickFound") },
            { value: "new", label: ot(locale, "explain.pickNew") },
            { value: "none", label: ot(locale, "explain.pickNone") },
          ]}
        />
      </div>
      <div className="tw-mt-6">
        {!showsExample && <LookupResult identity={identity} locale={locale} />}
        {showsExample && pick === "found" && <FoundExample locale={locale} />}
        {showsExample && pick === "new" && <NewBuyerExample locale={locale} />}
        {showsExample && pick === "none" && <NoneExample locale={locale} />}
      </div>
    </div>
  );
}
