"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiMemeCardDropMapping } from "@/generated/models/ApiMemeCardDropMapping";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { AdditionalDetailsSection } from "./MemePageAdditionalDetails";
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
    <AdditionalDetailsSection
      title={t(locale, "theMemes.detail.mainStageSubmission.title")}
      icon={TrophyIcon}
    >
      <Link
        href={href}
        className="tw-inline-flex tw-min-h-9 tw-items-center tw-gap-1.5 tw-rounded-md tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-text-sm"
      >
        <span>{t(locale, "theMemes.detail.mainStageSubmission.viewLink")}</span>
        <ArrowUpRightIcon
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400"
        />
      </Link>
    </AdditionalDetailsSection>
  );
}
