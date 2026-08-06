"use client";

import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumGenerativeStudy } from "@/lib/museum/generative-studies";

interface MuseumHeldPositionSelectionProps {
  readonly study: MuseumGenerativeStudy;
  readonly locale: SupportedLocale;
  readonly selectedWorkId: string;
  readonly onSelectWork: (objectId: string) => void;
}

const controlClass =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-px-4 tw-text-sm tw-font-semibold tw-transition-colors motion-reduce:tw-transition-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
const selectedControlClass =
  "tw-border-primary-300 tw-bg-primary-500 tw-text-white";
const ordinaryControlClass =
  "tw-border-iron-700 tw-bg-black tw-text-iron-300 hover:tw-text-white";

export function MuseumHeldPositionSelection({
  study,
  locale,
  selectedWorkId,
  onSelectWork,
}: MuseumHeldPositionSelectionProps) {
  const selectedPosition =
    study.heldPositions.find(
      (position) => position.objectId === selectedWorkId
    ) ?? study.heldPositions[0];

  if (selectedPosition === undefined) return null;

  return (
    <section
      aria-labelledby="museum-position-selection-title"
      className="tw-mt-8 tw-grid tw-gap-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-5 lg:tw-grid-cols-[minmax(12rem,0.55fr)_minmax(0,1fr)] lg:tw-p-6"
    >
      <div>
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
          {t(locale, "museum.network.insideSystem.museumPositions")}
        </p>
        <h3
          id="museum-position-selection-title"
          className="tw-m-0 tw-mt-2 tw-text-xl tw-font-semibold tw-text-iron-50"
        >
          {selectedPosition.title}
        </h3>
        {study.heldPositions.length > 1 ? (
          <div
            className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2"
            aria-label={t(
              locale,
              "museum.network.insideSystem.chooseMuseumWork"
            )}
          >
            {study.heldPositions.map((position) => {
              const isSelected =
                position.objectId === selectedPosition.objectId;
              return (
                <button
                  key={position.objectId}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectWork(position.objectId)}
                  className={`${controlClass} ${isSelected ? selectedControlClass : ordinaryControlClass}`}
                >
                  {position.title.replace(`${study.projectTitle} `, "")}
                </button>
              );
            })}
          </div>
        ) : null}
        <Link
          href={`/museum/network/collection/${encodeURIComponent(selectedPosition.objectId)}`}
          className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(locale, "museum.network.insideSystem.viewObject")}
        </Link>
      </div>
      <div>
        <dl className="tw-m-0 tw-grid tw-gap-x-5 tw-gap-y-4 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {selectedPosition.coordinates.map((coordinate) => (
            <div key={coordinate.label}>
              <dt className="tw-text-xs tw-text-iron-500">
                {coordinate.label}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
                {coordinate.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="tw-m-0 tw-mt-5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-4 tw-text-sm tw-leading-6 tw-text-iron-300">
          {selectedPosition.reading}
        </p>
      </div>
    </section>
  );
}
