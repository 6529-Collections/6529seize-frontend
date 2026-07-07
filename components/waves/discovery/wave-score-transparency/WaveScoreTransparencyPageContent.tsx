"use client";

import { useRef, useState, type FormEvent } from "react";

import { useSetTitle } from "@/contexts/TitleContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchWaveById, searchWavesByName } from "@/services/api/waves-v2-api";
import type { SidebarWave } from "@/types/waves.types";
import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import {
  CalculatorPanel,
  FormulaPipeline,
  FormulaSummary,
} from "./OverviewPanels";
import { WaveScoreResult } from "./WaveScoreResult";
import {
  DEFAULT_BACK_HREF,
  getBackLinkLabel,
  getErrorMessage,
  hasFormulaMetadata,
  parseWaveIdFromInput,
  sanitizeReturnTo,
  scrollElementIntoNearestView,
} from "./scoreUtils";
import type { CalculatorStatus } from "./types";

export function WaveScoreTransparencyPage({
  initialReturnTo,
}: {
  readonly initialReturnTo?: string | null | undefined;
}) {
  useSetTitle("Wave Score | Network");

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<CalculatorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [wave, setWave] = useState<ApiWave | null>(null);
  const [matches, setMatches] = useState<SidebarWave[]>([]);
  const returnTo = sanitizeReturnTo(initialReturnTo) ?? DEFAULT_BACK_HREF;
  const resultContainerRef = useRef<HTMLDivElement>(null);

  const currentScore = wave?.wave_score ?? null;
  const apiHasFormulaMetadata =
    currentScore !== null && hasFormulaMetadata(currentScore);
  const backLinkLabel = getBackLinkLabel(returnTo);

  const loadWave = async (waveId: string) => {
    setStatus("loading");
    setError(null);
    setWave(null);
    try {
      const nextWave = await fetchWaveById({ waveId });
      setWave(nextWave);
      setStatus("success");
      if (typeof globalThis.requestAnimationFrame === "function") {
        globalThis.requestAnimationFrame(() => {
          scrollElementIntoNearestView(resultContainerRef.current);
        });
      } else {
        setTimeout(() => {
          scrollElementIntoNearestView(resultContainerRef.current);
        }, 0);
      }
    } catch (loadError) {
      setStatus("error");
      setError(getErrorMessage(loadError));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    setWave(null);
    if (trimmedInput.length < 2) {
      setStatus("error");
      setError("Enter a wave name, wave id, or wave URL.");
      return;
    }

    setStatus("loading");
    setError(null);
    setMatches([]);

    const waveId = parseWaveIdFromInput(trimmedInput);
    if (waveId) {
      await loadWave(waveId);
      return;
    }

    try {
      const searchMatches = await searchWavesByName({
        name: trimmedInput,
        pageSize: 5,
      });
      if (searchMatches.length === 0) {
        setStatus("error");
        setError("No matching waves found.");
        return;
      }

      setMatches(searchMatches);
      const exactMatch =
        searchMatches.find(
          (match) => match.name.toLowerCase() === trimmedInput.toLowerCase()
        ) ?? searchMatches[0];

      if (exactMatch) {
        await loadWave(exactMatch.id);
      }
    } catch (searchError) {
      setStatus("error");
      setError(getErrorMessage(searchError));
    }
  };

  return (
    <div className="tw-px-4 tw-pb-16 tw-pt-6 md:tw-px-6 md:tw-pt-8 lg:tw-px-8">
      <div className="tw-mx-auto tw-max-w-7xl tw-space-y-8">
        <section className="tw-grid tw-gap-6 xl:tw-grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)]">
          <div className="tw-rounded-lg tw-bg-iron-950/50 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10 md:tw-p-6">
            <Link
              href={returnTo}
              className="tw-text-primary-200 desktop-hover:hover:tw-text-primary-100 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-no-underline tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <ArrowLongLeftIcon className="tw-size-4" aria-hidden="true" />
              {backLinkLabel}
            </Link>
            <p className="tw-mt-5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
              {t(DEFAULT_LOCALE, "waveScore.navigation.breadcrumb")}
            </p>
            <h1 className="tw-mt-5 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-white md:tw-text-4xl">
              Wave score transparency
            </h1>
            <p className="tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
              {t(DEFAULT_LOCALE, "waveScore.navigation.description")}
            </p>
          </div>

          <CalculatorPanel
            input={input}
            status={status}
            error={error}
            matches={matches}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onSelectMatch={(waveId) => {
              void loadWave(waveId);
            }}
          />
        </section>

        {wave && (
          <div
            ref={resultContainerRef}
            className="tw-animate-slideUp tw-space-y-3 motion-reduce:tw-animate-none"
          >
            {currentScore && (
              <div
                className={`tw-rounded-lg tw-p-4 tw-text-sm tw-ring-1 tw-ring-inset ${
                  apiHasFormulaMetadata
                    ? "tw-bg-emerald-500/10 tw-text-emerald-100 tw-ring-emerald-400/25"
                    : "tw-bg-amber-500/10 tw-text-amber-100 tw-ring-amber-400/25"
                }`}
              >
                {apiHasFormulaMetadata
                  ? "This result is using formula constants returned by the API."
                  : "This result is using the v1 fallback constants because the API response did not include formula metadata yet."}
              </div>
            )}
            <WaveScoreResult wave={wave} />
          </div>
        )}

        <FormulaPipeline />

        <FormulaSummary />
      </div>
    </div>
  );
}
