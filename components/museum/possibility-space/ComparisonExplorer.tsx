"use client";

/* Public token identifiers and traits are intentionally compared directly. */
/* eslint-disable security/detect-possible-timing-attacks */

import { useMemo, useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumGenerativeStudy,
  MuseumHeldPosition,
  MuseumMintedProjectIndex,
  MuseumMintedToken,
} from "@/lib/museum/generative-studies";
import {
  MuseumRemoteImage,
  focusClass,
  nextSeed,
  smallControlClass,
  useUrlStringState,
  type ComparisonMode,
} from "./shared";

export function invocationFromPosition(
  position: MuseumHeldPosition | undefined
): number {
  if (position === undefined) return 0;
  const match = /#(?<invocation>\d+)$/u.exec(position.title);
  return Number.parseInt(match?.groups?.["invocation"] ?? "0", 10);
}

function sharedTraitCount(
  first: MuseumMintedToken,
  second: MuseumMintedToken
): number {
  return Object.entries(first.traits).reduce(
    (total, [trait, value]) => total + (second.traits[trait] === value ? 1 : 0),
    0
  );
}

export function suggestionTokens(
  index: MuseumMintedProjectIndex,
  museumToken: MuseumMintedToken
): readonly MuseumSuggestion[] {
  const candidates = index.tokens.filter(
    (token) => token.invocation !== museumToken.invocation
  );
  const nearest = [...candidates].sort(
    (a, b) =>
      sharedTraitCount(museumToken, b) - sharedTraitCount(museumToken, a) ||
      a.invocation - b.invocation
  );
  const complement = [...candidates].sort(
    (a, b) =>
      sharedTraitCount(museumToken, a) - sharedTraitCount(museumToken, b) ||
      a.invocation - b.invocation
  );
  const uncommon = [...candidates].sort(
    (a, b) =>
      a.editionProfile.statisticalRank - b.editionProfile.statisticalRank ||
      a.invocation - b.invocation
  );
  const selected: MuseumSuggestion[] = [];
  const seen = new Set<string>();
  for (const [kind, ranked] of [
    ["nearest", nearest],
    ["complement", complement],
    ["uncommon", uncommon],
  ] as const) {
    const token = ranked.find((candidate) => !seen.has(candidate.tokenId));
    if (token === undefined) continue;
    selected.push({ kind, token });
    seen.add(token.tokenId);
  }
  return selected;
}

type MuseumSuggestionKind = "nearest" | "complement" | "uncommon";

interface MuseumSuggestion {
  readonly kind: MuseumSuggestionKind;
  readonly token: MuseumMintedToken;
}

const RESTAGE_PROJECT_SLUGS = new Set(["pre-process", "923-empty-rooms"]);

function comparisonModeLabel(
  locale: SupportedLocale,
  projectSlug: string
): string {
  return RESTAGE_PROJECT_SLUGS.has(projectSlug)
    ? t(locale, "museum.network.insideSystem.restageMode")
    : t(locale, "museum.network.insideSystem.counterfactualMode");
}

export function firstMintedToken(
  index: MuseumMintedProjectIndex
): MuseumMintedToken {
  const token = index.tokens[0];
  if (token === undefined) throw new Error("museum_minted_index_empty");
  return token;
}

function MintedMediaComparison({
  study,
  locale,
  museumToken,
  candidateToken,
}: {
  readonly study: MuseumGenerativeStudy;
  readonly locale: SupportedLocale;
  readonly museumToken: MuseumMintedToken;
  readonly candidateToken: MuseumMintedToken;
}) {
  const items = [
    {
      label: t(locale, "museum.network.insideSystem.museumReference"),
      token: museumToken,
    },
    {
      label: t(locale, "museum.network.insideSystem.mintedComparison"),
      token: candidateToken,
    },
  ];
  const traitNames = Array.from(
    new Set([
      ...Object.keys(museumToken.traits),
      ...Object.keys(candidateToken.traits),
    ])
  ).sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true })
  );
  const shared = sharedTraitCount(museumToken, candidateToken);
  return (
    <div className="tw-mt-7">
      <div className="tw-grid tw-gap-5 md:tw-grid-cols-2">
        {items.map(({ label, token }) => (
          <figure
            key={`${label}-${token.tokenId}`}
            className="tw-m-0 tw-min-w-0"
          >
            <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-400">
              {label}
            </p>
            <div className="tw-relative tw-aspect-square tw-overflow-hidden tw-bg-iron-950">
              <MuseumRemoteImage
                src={token.mediaUrl}
                alt={t(locale, "museum.network.insideSystem.mintedImageAlt", {
                  project: study.projectTitle,
                  invocation: `${token.invocation}`,
                })}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="tw-object-contain"
                unavailableText={t(
                  locale,
                  "museum.network.insideSystem.officialStillUnavailable"
                )}
              />
              <span className="tw-absolute tw-bottom-3 tw-left-3 tw-rounded-md tw-bg-black/80 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-text-white">
                #{token.invocation}
              </span>
            </div>
            <figcaption className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-text-xs tw-text-iron-500">
              <span>
                {t(locale, "museum.network.insideSystem.mintedTokenContext", {
                  tokenId: token.tokenId,
                  hash: `${token.tokenHash.slice(0, 10)}…`,
                })}
              </span>
              <a
                href={token.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {t(locale, "museum.network.insideSystem.openOfficialStill")}
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
      <details className="tw-mt-5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
        <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-text-sm tw-font-semibold tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
          {t(locale, "museum.network.insideSystem.compareTraitsSummary", {
            shared: `${shared}`,
            different: `${Math.max(0, traitNames.length - shared)}`,
          })}
        </summary>
        <section
          className="tw-mt-3 tw-overflow-x-auto"
          aria-label={t(
            locale,
            "museum.network.insideSystem.compareTraitsTable"
          )}
        >
          <table className="tw-w-full tw-min-w-[32rem] tw-border-collapse tw-text-left tw-text-sm">
            <thead className="tw-text-iron-500">
              <tr>
                <th className="tw-p-2">
                  {t(locale, "museum.network.insideSystem.trait")}
                </th>
                <th className="tw-p-2">#{museumToken.invocation}</th>
                <th className="tw-p-2">#{candidateToken.invocation}</th>
              </tr>
            </thead>
            <tbody>
              {traitNames.map((trait) => {
                const museumValue = museumToken.traits[trait] ?? "—";
                const candidateValue = candidateToken.traits[trait] ?? "—";
                return (
                  <tr
                    key={trait}
                    className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800"
                  >
                    <th
                      scope="row"
                      className="tw-p-2 tw-font-medium tw-text-iron-300"
                    >
                      {trait}
                    </th>
                    <td className="tw-p-2 tw-text-iron-300">{museumValue}</td>
                    <td
                      className={`tw-p-2 ${candidateValue === museumValue ? "tw-text-iron-300" : "tw-text-primary-200 tw-font-semibold"}`}
                    >
                      {candidateValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </details>
    </div>
  );
}

export function ComparisonSelector({
  study,
  locale,
  index,
  museumToken,
  candidateToken,
  mode,
  setMode,
  selectToken,
}: {
  readonly study: MuseumGenerativeStudy;
  readonly locale: SupportedLocale;
  readonly index: MuseumMintedProjectIndex;
  readonly museumToken: MuseumMintedToken;
  readonly candidateToken: MuseumMintedToken;
  readonly mode: ComparisonMode;
  readonly setMode: (mode: ComparisonMode) => void;
  readonly selectToken: (token: MuseumMintedToken) => void;
}) {
  const traitNames = useMemo(
    () =>
      Array.from(
        new Set(index.tokens.flatMap((token) => Object.keys(token.traits)))
      ).sort((first, second) =>
        first.localeCompare(second, undefined, { numeric: true })
      ),
    [index]
  );
  const [lookup, setLookup] = useState(`${candidateToken.invocation}`);
  const [filterTrait, setFilterTrait] = useUrlStringState(
    "trait",
    traitNames[0] ?? "",
    traitNames
  );
  const values = useMemo(
    () =>
      Array.from(
        new Set(
          index.tokens
            .map((token) => token.traits[filterTrait])
            .filter((value): value is string => value !== undefined)
        )
      ).sort((first, second) =>
        first.localeCompare(second, undefined, { numeric: true })
      ),
    [filterTrait, index]
  );
  const [filterValue, setFilterValue] = useUrlStringState(
    "value",
    values[0] ?? "",
    values
  );
  const effectiveFilterValue = values.includes(filterValue)
    ? filterValue
    : (values[0] ?? "");
  const [randomState, setRandomState] = useState(6_529);
  const [lookupError, setLookupError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const modelModeLabel = comparisonModeLabel(locale, study.projectSlug);
  const filteredTokens = useMemo(
    () =>
      index.tokens.filter(
        (token) => token.traits[filterTrait] === effectiveFilterValue
      ),
    [effectiveFilterValue, filterTrait, index]
  );
  const resultPageValues = Array.from(
    { length: Math.max(1, Math.ceil(filteredTokens.length / 12)) },
    (_, pageIndex) => `${pageIndex + 1}`
  );
  const [resultPage, setResultPage] = useUrlStringState(
    "page",
    "1",
    resultPageValues
  );
  const currentResultPage = Number(resultPage);
  const pageStart = (currentResultPage - 1) * 12;
  const visibleFilteredTokens = filteredTokens.slice(pageStart, pageStart + 12);

  const chooseToken = (token: MuseumMintedToken) => {
    setLookup(`${token.invocation}`);
    setLookupError(false);
    setLinkCopied(false);
    selectToken(token);
  };

  const chooseMode = (nextMode: ComparisonMode) => {
    setLinkCopied(false);
    setMode(nextMode);
  };

  const chooseInvocation = () => {
    const normalizedLookup = lookup.trim().replace(/^#/u, "");
    if (!/^\d+$/u.test(normalizedLookup)) {
      setLookupError(true);
      return;
    }
    const value = Number(normalizedLookup);
    const token = index.tokens.find(
      (item) => item.invocation === value || item.tokenId === normalizedLookup
    );
    setLookupError(token === undefined);
    if (token !== undefined) chooseToken(token);
  };

  const chooseAdjacent = (direction: -1 | 1) => {
    const currentIndex = index.tokens.findIndex(
      (token) => token.tokenId === candidateToken.tokenId
    );
    const nextIndex =
      (Math.max(0, currentIndex) + direction + index.tokens.length) %
      index.tokens.length;
    const token = index.tokens[nextIndex];
    if (token !== undefined) chooseToken(token);
  };

  const copyComparisonLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
    } catch {
      setLinkCopied(false);
    }
  };

  const chooseRandom = (filtered: boolean) => {
    const pool = filtered ? filteredTokens : index.tokens;
    const next = nextSeed(randomState);
    setRandomState(next);
    const token = pool[next % Math.max(1, pool.length)];
    if (token !== undefined) {
      chooseToken(token);
    }
  };

  return (
    <section
      aria-labelledby="comparison-lab-title"
      className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-7"
    >
      <div className="tw-flex tw-flex-col tw-gap-5 lg:tw-flex-row lg:tw-items-end lg:tw-justify-between">
        <div className="tw-max-w-2xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(locale, "museum.network.insideSystem.comparisonLabEyebrow")}
          </p>
          <h3
            id="comparison-lab-title"
            className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "museum.network.insideSystem.comparisonLabTitle")}
          </h3>
        </div>
        <div
          className="tw-flex tw-flex-wrap tw-gap-2"
          aria-label={t(
            locale,
            "museum.network.insideSystem.comparisonModeLabel"
          )}
        >
          <button
            type="button"
            aria-pressed={mode === "minted"}
            onClick={() => chooseMode("minted")}
            className={`${smallControlClass} ${mode === "minted" ? "tw-border-primary-300 tw-bg-primary-500 tw-text-white" : "tw-border-iron-700 tw-bg-black tw-text-iron-300"}`}
          >
            {t(locale, "museum.network.insideSystem.mintedMode")}
          </button>
          <button
            type="button"
            aria-pressed={mode === "counterfactual"}
            onClick={() => chooseMode("counterfactual")}
            className={`${smallControlClass} ${mode === "counterfactual" ? "tw-border-primary-300 tw-bg-primary-500 tw-text-white" : "tw-border-iron-700 tw-bg-black tw-text-iron-300"}`}
          >
            {modelModeLabel}
          </button>
        </div>
      </div>
      {mode === "minted" ? (
        <MintedMediaComparison
          study={study}
          locale={locale}
          museumToken={museumToken}
          candidateToken={candidateToken}
        />
      ) : null}
      {mode === "minted" ? (
        <div className="tw-mt-7 tw-grid tw-gap-4 xl:tw-grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)]">
          <div>
            <label
              htmlFor="minted-invocation"
              className="tw-text-sm tw-font-medium tw-text-iron-200"
            >
              {t(locale, "museum.network.insideSystem.mintedLookupLabel")}
            </label>
            <form
              className="tw-mt-2 tw-flex tw-gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                chooseInvocation();
              }}
            >
              <input
                id="minted-invocation"
                value={lookup}
                onChange={(event) => {
                  setLookup(event.target.value);
                  setLookupError(false);
                }}
                inputMode="numeric"
                aria-invalid={lookupError}
                aria-describedby={
                  lookupError ? "minted-invocation-error" : undefined
                }
                className="tw-min-h-11 tw-min-w-0 tw-flex-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
              />
              <button
                type="submit"
                className={`${smallControlClass} tw-border-iron-600 tw-bg-iron-900 tw-text-iron-100`}
              >
                {t(locale, "museum.network.insideSystem.viewMinted")}
              </button>
            </form>
            {lookupError ? (
              <p
                id="minted-invocation-error"
                role="alert"
                className="tw-m-0 tw-mt-2 tw-text-sm tw-text-error"
              >
                {t(locale, "museum.network.insideSystem.mintedNotFound")}
              </p>
            ) : null}
            <fieldset className="tw-m-0 tw-mt-3 tw-flex tw-flex-wrap tw-gap-2 tw-border-0 tw-p-0">
              <legend className="tw-sr-only">
                {t(locale, "museum.network.insideSystem.browseMinted")}
              </legend>
              <button
                type="button"
                onClick={() => chooseAdjacent(-1)}
                className={`${smallControlClass} tw-border-iron-600 tw-bg-iron-900 tw-text-iron-100`}
              >
                {t(locale, "museum.network.insideSystem.previousMinted")}
              </button>
              <button
                type="button"
                onClick={() => chooseAdjacent(1)}
                className={`${smallControlClass} tw-border-iron-600 tw-bg-iron-900 tw-text-iron-100`}
              >
                {t(locale, "museum.network.insideSystem.nextMinted")}
              </button>
              <button
                type="button"
                onClick={() => chooseRandom(false)}
                className={`${smallControlClass} tw-border-primary-400 tw-bg-primary-500 tw-text-white`}
              >
                {t(locale, "museum.network.insideSystem.randomMinted")}
              </button>
            </fieldset>
          </div>
          <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)_auto]">
            <label className="tw-text-sm tw-font-medium tw-text-iron-200">
              {t(locale, "museum.network.insideSystem.filterTrait")}
              <select
                value={filterTrait}
                onChange={(event) => {
                  const nextTrait = event.target.value;
                  const nextValues = Array.from(
                    new Set(
                      index.tokens
                        .map((token) => token.traits[nextTrait])
                        .filter((value): value is string => value !== undefined)
                    )
                  ).sort((first, second) =>
                    first.localeCompare(second, undefined, { numeric: true })
                  );
                  setFilterTrait(nextTrait);
                  setFilterValue(nextValues[0] ?? "");
                  setResultPage("1");
                  setLinkCopied(false);
                }}
                className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
              >
                {traitNames.map((trait) => (
                  <option key={trait}>{trait}</option>
                ))}
              </select>
            </label>
            <label className="tw-text-sm tw-font-medium tw-text-iron-200">
              {t(locale, "museum.network.insideSystem.filterValue")}
              <select
                value={effectiveFilterValue}
                onChange={(event) => {
                  setFilterValue(event.target.value);
                  setResultPage("1");
                  setLinkCopied(false);
                }}
                className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
              >
                {values.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => chooseRandom(true)}
              className={`${smallControlClass} tw-self-end tw-border-iron-600 tw-bg-iron-900 tw-text-iron-100`}
            >
              {t(locale, "museum.network.insideSystem.randomFiltered")}
            </button>
          </div>
        </div>
      ) : null}
      {mode === "minted" ? (
        <div className="tw-mt-5">
          <p className="tw-m-0 tw-text-sm tw-text-iron-400" aria-live="polite">
            {t(locale, "museum.network.insideSystem.filterResults", {
              count: `${filteredTokens.length}`,
            })}
          </p>
          <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-500">
            {t(locale, "museum.network.insideSystem.filterResultRange", {
              start: `${filteredTokens.length === 0 ? 0 : pageStart + 1}`,
              end: `${Math.min(pageStart + 12, filteredTokens.length)}`,
              count: `${filteredTokens.length}`,
            })}
          </p>
          <div className="tw-mt-3 tw-grid tw-grid-cols-3 tw-gap-2 sm:tw-grid-cols-6">
            {visibleFilteredTokens.map((token) => {
              const selected = token.invocation === candidateToken.invocation;
              return (
                <button
                  key={token.tokenId}
                  type="button"
                  aria-pressed={selected}
                  aria-label={t(
                    locale,
                    "museum.network.insideSystem.selectMinted",
                    {
                      invocation: `${token.invocation}`,
                    }
                  )}
                  onClick={() => chooseToken(token)}
                  className={`tw-group tw-relative tw-aspect-square tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-bg-iron-950 tw-p-0 ${focusClass} ${selected ? "tw-border-primary-300 tw-ring-2 tw-ring-primary-400" : "tw-border-white/10"}`}
                >
                  <MuseumRemoteImage
                    src={token.mediaUrl}
                    alt=""
                    sizes="8rem"
                    className="tw-object-contain"
                    unavailableText={t(
                      locale,
                      "museum.network.insideSystem.officialStillUnavailable"
                    )}
                  />
                  <span className="tw-absolute tw-bottom-1 tw-left-1 tw-rounded tw-bg-black/80 tw-px-1.5 tw-py-0.5 tw-text-[0.65rem] tw-font-semibold tw-text-white">
                    #{token.invocation}
                  </span>
                </button>
              );
            })}
          </div>
          {resultPageValues.length > 1 ? (
            <nav
              aria-label={t(
                locale,
                "museum.network.insideSystem.browseResults"
              )}
              className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2"
            >
              <button
                type="button"
                disabled={currentResultPage <= 1}
                onClick={() => setResultPage(`${currentResultPage - 1}`)}
                className={`${smallControlClass} tw-border-iron-600 tw-bg-iron-900 tw-text-iron-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-40`}
              >
                {t(locale, "museum.network.insideSystem.previousResults")}
              </button>
              <button
                type="button"
                disabled={currentResultPage >= resultPageValues.length}
                onClick={() => setResultPage(`${currentResultPage + 1}`)}
                className={`${smallControlClass} tw-border-iron-600 tw-bg-iron-900 tw-text-iron-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-40`}
              >
                {t(locale, "museum.network.insideSystem.nextResults")}
              </button>
            </nav>
          ) : null}
        </div>
      ) : null}
      <div className="tw-mt-5">
        <button
          type="button"
          onClick={copyComparisonLink}
          className={`${smallControlClass} tw-border-iron-600 tw-bg-black tw-text-iron-200`}
        >
          {linkCopied
            ? t(locale, "museum.network.insideSystem.linkCopied")
            : t(locale, "museum.network.insideSystem.copyComparisonLink")}
        </button>
      </div>
    </section>
  );
}

export function SuggestedComparisons({
  study,
  locale,
  museumToken,
  selectedToken,
  suggestions,
  onSelect,
}: {
  readonly study: MuseumGenerativeStudy;
  readonly locale: SupportedLocale;
  readonly museumToken: MuseumMintedToken;
  readonly selectedToken: MuseumMintedToken;
  readonly suggestions: readonly MuseumSuggestion[];
  readonly onSelect: (token: MuseumMintedToken) => void;
}) {
  const labels: Readonly<Record<MuseumSuggestionKind, string>> = {
    nearest: t(locale, "museum.network.insideSystem.nearestSuggestion"),
    complement: t(locale, "museum.network.insideSystem.complementSuggestion"),
    uncommon: t(locale, "museum.network.insideSystem.uncommonSuggestion"),
  };
  const reasons = useMemo(() => {
    const total = Object.keys(museumToken.traits).length;
    return suggestions.map(({ kind, token }) => {
      const shared = sharedTraitCount(museumToken, token);
      if (kind === "nearest") {
        return t(locale, "museum.network.insideSystem.sharedTraitsReason", {
          shared: `${shared}`,
          total: `${total}`,
        });
      }
      if (kind === "complement") {
        return t(locale, "museum.network.insideSystem.differentTraitsReason", {
          different: `${Math.max(0, total - shared)}`,
          total: `${total}`,
        });
      }
      return t(locale, "museum.network.insideSystem.uncommonTraitsReason", {
        rank: `${token.editionProfile.statisticalRank}`,
        total: `${token.editionProfile.total}`,
      });
    });
  }, [locale, museumToken, suggestions]);
  return (
    <section aria-labelledby="suggested-comparisons-title" className="tw-mt-10">
      <h3
        id="suggested-comparisons-title"
        className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100"
      >
        {t(locale, "museum.network.insideSystem.suggestedComparisons")}
      </h3>
      <div className="tw-mt-4 tw-grid tw-gap-4 sm:tw-grid-cols-3">
        {suggestions.map(({ kind, token }, suggestionIndex) => (
          <button
            key={token.tokenId}
            type="button"
            aria-pressed={token.invocation === selectedToken.invocation}
            onClick={() => onSelect(token)}
            className={`tw-group tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-bg-iron-950 tw-p-0 tw-text-left ${focusClass} ${token.invocation === selectedToken.invocation ? "tw-border-primary-300 tw-ring-2 tw-ring-primary-400" : "tw-border-white/10"}`}
          >
            <span className="tw-relative tw-block tw-aspect-square tw-overflow-hidden">
              <MuseumRemoteImage
                src={token.mediaUrl}
                alt={t(locale, "museum.network.insideSystem.mintedImageAlt", {
                  project: study.projectTitle,
                  invocation: `${token.invocation}`,
                })}
                sizes="(min-width: 640px) 33vw, 100vw"
                className="tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.02] motion-reduce:tw-transition-none"
                unavailableText={t(
                  locale,
                  "museum.network.insideSystem.officialStillUnavailable"
                )}
              />
            </span>
            <span className="tw-block tw-p-4">
              <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
                {labels[kind]}
              </span>
              <span className="tw-mt-2 tw-block tw-text-base tw-font-semibold tw-text-white">
                #{token.invocation}
              </span>
              <span className="tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                {reasons[suggestionIndex]}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="tw-sr-only" aria-live="polite">
        {t(locale, "museum.network.insideSystem.nowComparing", {
          invocation: `${selectedToken.invocation}`,
        })}
      </p>
      <p className="tw-m-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
        {t(locale, "museum.network.insideSystem.suggestionMethodNote")}
      </p>
    </section>
  );
}
