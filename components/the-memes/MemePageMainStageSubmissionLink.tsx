"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiMemeCardDropMapping } from "@/generated/models/ApiMemeCardDropMapping";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowUpRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface MemePageMainStageSubmissionLinkProps {
  readonly memeCardId: number;
  readonly locale: SupportedLocale;
}

interface MemeCardDropState {
  readonly memeCardId: number;
  readonly dropId: string;
}

export default function MemePageMainStageSubmissionLink({
  memeCardId,
  locale,
}: MemePageMainStageSubmissionLinkProps) {
  const { seizeSettings } = useSeizeSettings();
  const [mapping, setMapping] = useState<MemeCardDropState | null>(null);

  useEffect(() => {
    if (!Number.isSafeInteger(memeCardId) || memeCardId < 1) {
      return;
    }

    const controller = new AbortController();

    commonApiFetch<ApiMemeCardDropMapping>({
      endpoint: `meme-cards/${memeCardId}/drop`,
      signal: controller.signal,
      errorMode: "structured",
      includeWalletAuth: false,
    })
      .then((mapping) => {
        if (!controller.signal.aborted) {
          setMapping({ memeCardId, dropId: mapping.drop_id });
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [memeCardId]);

  const href = useMemo(() => {
    const waveId = seizeSettings.memes_wave_id?.trim();
    const dropId = mapping?.memeCardId === memeCardId ? mapping.dropId : null;
    if (!waveId || !dropId) {
      return null;
    }
    return getWaveRoute({
      waveId,
      extraParams: { drop: dropId },
      isDirectMessage: false,
      isApp: false,
    });
  }, [mapping, memeCardId, seizeSettings.memes_wave_id]);

  if (!href) {
    return null;
  }

  return (
    <Link
      href={href}
      className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 hover:tw-bg-iron-800 hover:tw-text-white"
    >
      <span>{t(locale, "theMemes.detail.mainStageSubmission.title")}</span>
      <ArrowUpRightIcon
        aria-hidden="true"
        className="-tw-mr-1 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500"
      />
    </Link>
  );
}
