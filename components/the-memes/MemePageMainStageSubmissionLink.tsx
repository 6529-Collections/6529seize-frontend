"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiMemeCardDropMapping } from "@/generated/models/ApiMemeCardDropMapping";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowUpRightIcon, TrophyIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface MemePageMainStageSubmissionLinkProps {
  readonly memeCardId: number;
  readonly locale: SupportedLocale;
}

export default function MemePageMainStageSubmissionLink({
  memeCardId,
  locale,
}: MemePageMainStageSubmissionLinkProps) {
  const { seizeSettings } = useSeizeSettings();
  const [dropId, setDropId] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isSafeInteger(memeCardId) || memeCardId < 1) {
      setDropId(null);
      return;
    }

    const controller = new AbortController();
    setDropId(null);

    commonApiFetch<ApiMemeCardDropMapping>({
      endpoint: `meme-cards/${memeCardId}/drop`,
      signal: controller.signal,
      errorMode: "structured",
      includeWalletAuth: false,
    })
      .then((mapping) => {
        if (!controller.signal.aborted) {
          setDropId(mapping.drop_id);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDropId(null);
        }
      });

    return () => controller.abort();
  }, [memeCardId]);

  const href = useMemo(() => {
    const waveId = seizeSettings.memes_wave_id?.trim();
    if (!waveId || !dropId) {
      return null;
    }
    return getWaveRoute({
      waveId,
      extraParams: { drop: dropId },
      isDirectMessage: false,
      isApp: false,
    });
  }, [dropId, seizeSettings.memes_wave_id]);

  if (!href) {
    return null;
  }

  return (
    <Link
      href={href}
      className="tw-group tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4 tw-text-left tw-no-underline tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900"
    >
      <span
        aria-hidden="true"
        className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-iron-300 tw-transition-colors desktop-hover:group-hover:tw-bg-iron-700 desktop-hover:group-hover:tw-text-white"
      >
        <TrophyIcon className="tw-size-5" />
      </span>
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100 sm:tw-text-base">
          {t(locale, "theMemes.detail.mainStageSubmission.title")}
        </span>
        <span className="tw-mt-0.5 tw-block tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "theMemes.detail.mainStageSubmission.description")}
        </span>
      </span>
      <ArrowUpRightIcon
        aria-hidden="true"
        className="tw-size-5 tw-flex-shrink-0 tw-text-iron-500 tw-transition-colors desktop-hover:group-hover:tw-text-iron-200"
      />
    </Link>
  );
}
