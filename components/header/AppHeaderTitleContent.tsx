"use client";

import Link from "next/link";
import { WaveTrustSignals } from "@/components/waves/WaveTrustSignals";
import type { ReactNode } from "react";
import { PlaintextDmEncryptionNotice } from "@/components/e2ee/plaintext/PlaintextDmEncryptionNotice";
import WaveParentNavigation from "@/components/waves/header/WaveParentNavigation";
import WavePicture from "@/components/waves/WavePicture";
import { useWaveInformation } from "@/contexts/WaveInformationContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { HeaderWavePreview } from "./app-header-wave-preview";

/** The app header's title: wave picture and name, or a DM's profile link. */
export default function HeaderTitleContent({
  displayWave,
  activeWave,
  isDm,
  directMessageProfileHref,
  previewText,
  finalTitle,
  phoneWave = false,
  scoreLearnMoreHref,
}: {
  readonly displayWave: HeaderWavePreview | null;
  readonly activeWave: ApiWave | null;
  readonly isDm: boolean;
  readonly directMessageProfileHref: string | null;
  readonly previewText: string | null;
  readonly finalTitle: ReactNode;
  readonly phoneWave?: boolean | undefined;
  readonly scoreLearnMoreHref?: string | undefined;
}) {
  const information = useWaveInformation();
  const locale = useBrowserLocale();
  if (displayWave === null) {
    return <span className="tw-text-sm tw-font-semibold">{finalTitle}</span>;
  }

  const wavePicture = (
    <div className="tw-relative tw-size-9 tw-flex-shrink-0">
      <div className="tw-size-full tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-white/30">
        <WavePicture
          name={displayWave.name}
          picture={displayWave.picture}
          contributors={displayWave.contributors}
        />
      </div>
      {phoneWave && activeWave && (
        <WaveTrustSignals
          waveRep={activeWave.wave_rep}
          waveScore={activeWave.wave_score}
          scoreDetailsDisabled
          variant="header-avatar"
          mode="summary"
          learnMoreHref={scoreLearnMoreHref}
          className="tw-absolute -tw-bottom-1.5 -tw-right-1 tw-z-10"
        />
      )}
    </div>
  );
  const directMessageProfileLink =
    activeWave !== null && isDm ? directMessageProfileHref : null;

  return (
    <div
      className={
        phoneWave
          ? "tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2"
          : "tw-flex tw-min-w-0 tw-max-w-[min(62vw,28rem)] tw-items-center tw-gap-2"
      }
    >
      {directMessageProfileLink !== null ? (
        <Link
          href={directMessageProfileLink}
          aria-label={`View ${displayWave.name}'s profile`}
          className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-iron-50 tw-no-underline tw-transition-colors desktop-hover:hover:tw-text-white"
        >
          {wavePicture}
          <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold">
            {displayWave.name}
          </span>
        </Link>
      ) : (
        <>
          {phoneWave && activeWave ? (
            <button
              type="button"
              aria-label={t(locale, "waves.information.avatarLabel")}
              onClick={() => information?.open(activeWave.id)}
              className="tw-shrink-0 tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {wavePicture}
            </button>
          ) : (
            wavePicture
          )}
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start">
            <WaveParentNavigation
              parentWave={activeWave?.parent_wave}
              variant="compact-header"
            />
            {activeWave !== null && !isDm ? (
              <button
                type="button"
                onClick={() => information?.open(activeWave.id)}
                aria-haspopup="dialog"
                aria-label={t(locale, "waves.information.open", {
                  name: displayWave.name,
                })}
                className={`tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-start tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-font-medium tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${phoneWave ? "tw-min-h-11" : "tw-min-h-6"}`}
              >
                {phoneWave ? (
                  <span className="tw-line-clamp-2 tw-min-w-0 tw-break-words tw-text-sm tw-font-medium tw-leading-[18px]">
                    {displayWave.name}
                  </span>
                ) : (
                  <span className="tw-w-full tw-truncate tw-text-sm tw-font-medium">
                    {displayWave.name}
                  </span>
                )}
                {!phoneWave && previewText && (
                  <span className="tw-hidden tw-w-full tw-truncate tw-text-xs tw-font-normal tw-text-iron-400 sm:tw-block">
                    {previewText}
                  </span>
                )}
              </button>
            ) : (
              <span className="tw-w-full tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold">
                {displayWave.name}
              </span>
            )}
          </div>
        </>
      )}
      {/* Plaintext DMs (D109): one tap to an encrypted chat. */}
      {activeWave !== null && isDm ? (
        <PlaintextDmEncryptionNotice wave={activeWave} variant="icon" appOnly />
      ) : null}
    </div>
  );
}
