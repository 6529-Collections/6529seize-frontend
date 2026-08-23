"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { displayCreditWithoutRepeatedLicense } from "@/lib/museum/credit";
import type { MuseumMedia } from "@/lib/museum/publication/types";
import { MuseumRightsLink } from "./MuseumRightsLink";

export function MuseumLiveGeneratorEncounter({
  media,
  title,
  creditLine,
}: {
  readonly media: MuseumMedia | undefined;
  readonly title: string;
  readonly creditLine?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!open || failed) return;
    const timeout = window.setTimeout(() => setRecovery(true), 12_000);
    return () => window.clearTimeout(timeout);
  }, [failed, open]);

  if (media?.kind !== "live" || media.role !== "source") return null;

  let toggleLabel = t(DEFAULT_LOCALE, "museum.network.artworkViewer.viewLive");
  if (open) {
    toggleLabel = t(
      DEFAULT_LOCALE,
      recovery && !failed
        ? "museum.network.artworkViewer.liveRecovery"
        : "museum.network.artworkViewer.returnToStill"
    );
  }

  return (
    <section
      className="tw-mt-10 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
      aria-labelledby="canonical-work-live-title"
    >
      <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div className="tw-max-w-2xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.artworkViewer.liveEyebrow")}
          </p>
          <h2
            id="canonical-work-live-title"
            className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.artworkViewer.liveHeading")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setRecovery(false);
            setOpen((current) => !current);
          }}
          aria-expanded={open}
          className="tw-inline-flex tw-min-h-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
        >
          {toggleLabel}
        </button>
      </div>
      {open ? (
        <div className="tw-mt-6">
          {failed ? (
            <div
              className="tw-flex tw-min-h-48 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-bg-black tw-p-8 tw-text-center"
              role="alert"
            >
              <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.artworkViewer.liveErrorTitle"
                )}
              </p>
              <p className="tw-m-0 tw-max-w-md tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.artworkViewer.liveErrorDescription"
                )}
              </p>
            </div>
          ) : (
            <iframe
              src={media.url}
              title={t(
                DEFAULT_LOCALE,
                "museum.network.artworkViewer.liveTitle",
                {
                  title,
                }
              )}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setFailed(true)}
              className="tw-aspect-square tw-h-auto tw-w-full tw-border-0 tw-bg-black"
            />
          )}
        </div>
      ) : null}
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-1 tw-text-xs tw-leading-5 tw-text-iron-500 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between sm:tw-gap-6">
        <p className="tw-m-0 tw-max-w-2xl">
          {displayCreditWithoutRepeatedLicense(
            creditLine ?? media.credit.creditLine,
            media.credit.licenseLabel
          )}
          {media.credit.licenseLabel === null ? null : (
            <>
              {" "}
              <MuseumRightsLink
                href={media.credit.licenseUrl ?? undefined}
                label={media.credit.licenseLabel}
                className="tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              />
            </>
          )}
        </p>
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-self-start tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.artworkViewer.openOfficialSource")}
        </a>
      </div>
    </section>
  );
}
