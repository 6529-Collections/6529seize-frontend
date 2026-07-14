"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiMemeCardDropMapping } from "@/generated/models/ApiMemeCardDropMapping";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowUpRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface MemePageMainStageSubmissionLinkProps {
  readonly memeCardId: number;
  readonly locale?: SupportedLocale | undefined;
  readonly variant?: "button" | "details-row";
}

interface MemeCardDropState {
  readonly memeCardId: number;
  readonly dropId: string;
}

export default function MemePageMainStageSubmissionLink({
  memeCardId,
  locale,
  variant = "button",
}: MemePageMainStageSubmissionLinkProps) {
  const { seizeSettings } = useSeizeSettings();
  const browserLocale = useBrowserLocale();
  const resolvedLocale = locale ?? browserLocale;
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

  const label = t(resolvedLocale, "theMemes.detail.mainStageSubmission.title");

  if (variant === "details-row") {
    return (
      <div className="tw-flex tw-justify-between tw-gap-4">
        <span className="tw-text-iron-400">{label}</span>
        <Link
          href={href}
          aria-label={`View ${label}`}
          className="tw-text-iron-200 tw-underline tw-underline-offset-2 tw-transition-colors tw-duration-300 hover:tw-text-iron-50 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          View
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
    >
      <span>{label}</span>
      <ArrowUpRightIcon
        aria-hidden="true"
        className="-tw-mr-1 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500"
      />
    </Link>
  );
}
