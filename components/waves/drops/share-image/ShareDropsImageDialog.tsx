"use client";

import {
  ArrowDownTrayIcon,
  ArrowUpOnSquareIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  DocumentDuplicateIcon,
  EyeSlashIcon,
  LockClosedIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  buildClipboardMessage,
  buildQuoteDropLookup,
} from "@/helpers/waves/drop-clipboard.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import {
  getDeviceTimeZone,
  getTimeZoneCityName,
} from "@/lib/display-time-zone/displayTimeZone";
import { getSupportedTimeZones } from "@/lib/display-time-zone/timeZoneSearch";
import {
  DEFAULT_SHARE_IMAGE_TIME,
  formatShareImageDateLine,
  formatShareImagePostTime,
  getShareImageFileName,
  getShareImageTimeSpan,
  type ShareImageTimeMode,
  type ShareImageTimeOption,
} from "@/lib/share-drops-image/shareDropsImageFormat";
import ShareDropsImageCard, {
  SHARE_IMAGE_WIDTH,
  type ShareImageInclude,
} from "./ShareDropsImageCard";
import {
  canCopyImages,
  canShareImageFiles,
  useShareImageExport,
} from "./useShareImageExport";

const TIME_MODES: readonly ShareImageTimeMode[] = [
  "utc",
  "elapsed",
  "hidden",
  "zone",
];
const PREVIEW_SCALE = 0.74;

const BUTTON_BASE =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-px-3.5 tw-text-sm tw-font-semibold focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

function isPrivateWave(wave: ApiWave): boolean {
  return (
    isWaveDirectMessage(wave.id, wave) || wave.visibility.scope.group !== null
  );
}

/**
 * Options, preview and actions for "Share as image". The card on screen is
 * the image: each action renders it to a PNG on the device.
 */
export default function ShareDropsImageDialog({
  wave,
  drops,
  onBack,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly drops: readonly ExtendedDrop[];
  readonly onBack: () => void;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const { isCapacitor } = useCapacitor();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const zoneSelectId = useId();
  const timeDescriptionId = useId();
  const [time, setTime] = useState<ShareImageTimeOption>(
    DEFAULT_SHARE_IMAGE_TIME
  );
  const [include, setInclude] = useState<ShareImageInclude>({
    waveHeader: true,
    reactions: true,
  });
  const [textStatus, setTextStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  useBodyScrollLock({ reserveScrollbarGap: true });

  const deviceTimeZone = useMemo(() => getDeviceTimeZone(), []);
  const zones = useMemo(() => getSupportedTimeZones(), []);
  const isPrivate = isPrivateWave(wave);
  const { first: firstAt, last: lastAt } = getShareImageTimeSpan(
    drops.map((drop) => drop.created_at)
  );
  const fileName = getShareImageFileName(wave.name, firstAt, isPrivate);
  const showsDeviceZone =
    time.mode === "zone" &&
    deviceTimeZone !== undefined &&
    time.timeZone === deviceTimeZone;

  const messages = useMemo(() => {
    const lookup = buildQuoteDropLookup([...drops]);
    return drops.map((drop) => buildClipboardMessage(drop, lookup));
  }, [drops]);

  const exporter = useShareImageExport({
    cardRef,
    fileName,
    isNativeApp: isCapacitor,
    nativeDialogTitle: t(locale, "shareImage.share"),
    refreshKey: `${drops.length}:${include.waveHeader}:${include.reactions}`,
  });
  const showCopyImage = canCopyImages() && !isCapacitor;
  const showShare = isCapacitor || canShareImageFiles();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    if (!dialog) return;
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, []);

  const copyText = async () => {
    const lines: string[] = [];
    if (include.waveHeader) {
      lines.push(
        `${wave.name} · ${formatShareImageDateLine(firstAt, lastAt, time, locale)}`,
        ""
      );
    }
    drops.forEach((drop, index) => {
      const author = drop.author.handle ?? drop.author.primary_address;
      const when = formatShareImagePostTime(
        drop.created_at,
        firstAt,
        time,
        locale
      );
      lines.push(when ? `${author} · ${when}` : author);
      const content = messages[index]?.plainContent.trim();
      if (content) lines.push(content);
      lines.push("");
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
      setTextStatus("copied");
    } catch {
      setTextStatus("failed");
    }
  };

  const statusText = (() => {
    if (exporter.status === "working")
      return t(locale, "shareImage.status.making");
    if (exporter.status === "copied")
      return t(locale, "shareImage.status.copied");
    if (exporter.status === "downloaded")
      return t(locale, "shareImage.status.downloaded", { fileName });
    if (exporter.status === "failed")
      return t(locale, "shareImage.status.failed");
    if (textStatus === "copied")
      return t(locale, "shareImage.status.textCopied");
    if (textStatus === "failed")
      return t(locale, "shareImage.status.textFailed");
    return "";
  })();
  const isWorking = exporter.status === "working";
  const title =
    drops.length === 1
      ? t(locale, "shareImage.dialog.subtitleOne", { wave: wave.name })
      : t(locale, "shareImage.dialog.subtitleOther", {
          count: drops.length,
          wave: wave.name,
        });

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="tailwind-scope tw-fixed tw-bottom-[env(safe-area-inset-bottom,0px)] tw-left-[env(safe-area-inset-left,0px)] tw-right-[env(safe-area-inset-right,0px)] tw-top-[env(safe-area-inset-top,0px)] tw-m-auto tw-max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem)] tw-w-[calc(100%-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px)-2rem)] tw-max-w-4xl tw-overflow-y-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-0 tw-text-iron-50 tw-shadow-2xl backdrop:tw-bg-black/75"
    >
      <header className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-items-start tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 sm:tw-px-6">
        <button
          type="button"
          onClick={onBack}
          aria-label={t(locale, "shareImage.dialog.back")}
          className="-tw-ml-2 tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <ChevronLeftIcon className="tw-size-5" aria-hidden="true" />
        </button>
        <div className="tw-min-w-0 tw-flex-1">
          <h2 id={titleId} className="tw-m-0 tw-text-lg tw-font-semibold">
            {t(locale, "shareImage.title")}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-break-words tw-text-sm tw-text-iron-400">
            {title}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t(locale, "shareImage.dialog.close")}
          className="tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <XMarkIcon className="tw-size-5" aria-hidden="true" />
        </button>
      </header>

      <div className="tw-grid tw-gap-5 tw-p-4 sm:tw-p-6 md:tw-grid-cols-[minmax(0,1fr)_20rem]">
        <section
          aria-label={t(locale, "shareImage.dialog.preview")}
          className="tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-[#08080a] tw-p-4"
        >
          <div
            className="tw-mx-auto tw-max-h-[34rem] tw-overflow-y-auto"
            style={{
              width: SHARE_IMAGE_WIDTH * PREVIEW_SCALE,
              maxWidth: "100%",
            }}
          >
            <div
              style={{
                width: SHARE_IMAGE_WIDTH,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
              }}
            >
              <ShareDropsImageCard
                ref={cardRef}
                wave={wave}
                drops={drops}
                messages={messages}
                time={time}
                include={include}
                locale={locale}
              />
            </div>
          </div>
        </section>

        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-5">
          <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
            <legend className="tw-mb-2 tw-text-xs tw-font-semibold tw-text-iron-300">
              {t(locale, "shareImage.time.legend")}
            </legend>
            <div className="tw-space-y-1">
              {TIME_MODES.map((mode) => (
                <label
                  key={mode}
                  className={clsx(
                    "tw-flex tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 has-[:focus-visible]:tw-ring-2 has-[:focus-visible]:tw-ring-primary-400",
                    time.mode === mode
                      ? "tw-border-primary-400/45 tw-bg-primary-500/10"
                      : "tw-border-transparent desktop-hover:hover:tw-bg-iron-900"
                  )}
                >
                  <input
                    type="radio"
                    name="share-image-time"
                    value={mode}
                    aria-label={t(locale, `shareImage.time.${mode}`)}
                    aria-describedby={`${timeDescriptionId}-${mode}`}
                    checked={time.mode === mode}
                    onChange={() =>
                      setTime(
                        mode === "zone"
                          ? {
                              mode,
                              timeZone:
                                time.timeZone ?? deviceTimeZone ?? "UTC",
                            }
                          : { mode }
                      )
                    }
                    className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-accent-primary-400"
                  />
                  <span className="tw-min-w-0">
                    <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50">
                      {t(locale, `shareImage.time.${mode}`)}
                    </span>
                    <span
                      id={`${timeDescriptionId}-${mode}`}
                      className="tw-block tw-text-xs tw-text-iron-400"
                    >
                      {t(locale, `shareImage.time.${mode}.description`)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {time.mode === "zone" && (
              <div className="tw-mt-2 tw-pl-7">
                <label
                  htmlFor={zoneSelectId}
                  className="tw-mb-1 tw-block tw-text-xs tw-font-medium tw-text-iron-400"
                >
                  {t(locale, "shareImage.time.zoneSelect")}
                </label>
                <span className="tw-relative tw-block">
                  <select
                    id={zoneSelectId}
                    value={time.timeZone}
                    onChange={(event) =>
                      setTime({ mode: "zone", timeZone: event.target.value })
                    }
                    className="tw-min-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-py-2 tw-pl-3 tw-pr-10 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                  >
                    {deviceTimeZone && (
                      <option value={deviceTimeZone}>
                        {t(locale, "shareImage.time.deviceZone", {
                          zone: getTimeZoneCityName(deviceTimeZone),
                        })}
                      </option>
                    )}
                    {zones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-3.5 tw-size-4 tw-text-iron-400"
                  />
                </span>
              </div>
            )}
            {showsDeviceZone && (
              <p className="tw-m-0 tw-mt-2 tw-flex tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/35 tw-bg-amber-400/10 tw-p-2.5 tw-text-xs tw-text-amber-100">
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-flex-shrink-0"
                />
                {t(locale, "shareImage.time.deviceZoneWarning")}
              </p>
            )}
            <p className="tw-m-0 tw-mt-2 tw-text-xs tw-text-iron-400">
              {t(locale, "shareImage.time.copyTextNote")}
            </p>
          </fieldset>

          <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
            <legend className="tw-mb-1 tw-text-xs tw-font-semibold tw-text-iron-300">
              {t(locale, "shareImage.include.legend")}
            </legend>
            {(
              [
                ["waveHeader", "shareImage.include.waveHeader"],
                ["reactions", "shareImage.include.reactions"],
              ] as const
            ).map(([key, labelKey]) => (
              <label
                key={key}
                className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-3 tw-text-sm tw-text-iron-100"
              >
                <input
                  type="checkbox"
                  checked={include[key]}
                  onChange={(event) =>
                    setInclude((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="tw-size-4 tw-accent-primary-400"
                />
                {t(locale, labelKey)}
              </label>
            ))}
          </fieldset>

          <p className="tw-m-0 tw-flex tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-p-2.5 tw-text-xs tw-text-iron-400">
            <EyeSlashIcon
              aria-hidden="true"
              className="tw-size-4 tw-flex-shrink-0"
            />
            <span>{t(locale, "shareImage.leftOut")}</span>
          </p>
          {exporter.unreadableImages > 0 && (
            <p className="tw-m-0 tw-flex tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/35 tw-bg-amber-400/10 tw-p-2.5 tw-text-xs tw-text-amber-100">
              <ExclamationTriangleIcon
                aria-hidden="true"
                className="tw-size-4 tw-flex-shrink-0"
              />
              {t(locale, "shareImage.mediaWarning", {
                count: exporter.unreadableImages,
              })}
            </p>
          )}
          {isPrivate && (
            <p className="tw-m-0 tw-flex tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-2.5 tw-text-xs tw-text-iron-200">
              <LockClosedIcon
                aria-hidden="true"
                className="tw-size-4 tw-flex-shrink-0"
              />
              {t(locale, "shareImage.privateNote")}
            </p>
          )}
        </div>
      </div>

      <footer className="tw-sticky tw-bottom-0 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-4 tw-py-3 sm:tw-px-6">
        <p className="tw-m-0 tw-mr-auto tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
          <LockClosedIcon aria-hidden="true" className="tw-size-4" />
          {t(locale, "shareImage.onDevice")}
        </p>
        <button
          type="button"
          onClick={() => void copyText()}
          className={`${BUTTON_BASE} tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800`}
        >
          {t(locale, "shareImage.copyText")}
        </button>
        <button
          type="button"
          onClick={() => void exporter.download()}
          disabled={isWorking}
          className={`${BUTTON_BASE} tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-50 desktop-hover:hover:tw-bg-iron-700`}
        >
          <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
          {t(locale, "shareImage.download")}
        </button>
        {showShare && (
          <button
            type="button"
            onClick={() => void exporter.share()}
            disabled={isWorking}
            className={`${BUTTON_BASE} tw-border-0 ${showCopyImage ? "tw-bg-iron-800 tw-text-iron-50" : "tw-bg-primary-500 tw-text-white desktop-hover:hover:tw-bg-primary-600"}`}
          >
            <ArrowUpOnSquareIcon aria-hidden="true" className="tw-size-4" />
            {t(locale, "shareImage.share")}
          </button>
        )}
        {showCopyImage && (
          <button
            type="button"
            onClick={exporter.copyImage}
            disabled={isWorking}
            className={`${BUTTON_BASE} tw-border-0 tw-bg-primary-500 tw-text-white desktop-hover:hover:tw-bg-primary-600`}
          >
            <DocumentDuplicateIcon aria-hidden="true" className="tw-size-4" />
            {isWorking
              ? t(locale, "shareImage.status.making")
              : t(locale, "shareImage.copyImage")}
          </button>
        )}
        <output className="tw-m-0 tw-block tw-w-full tw-text-xs tw-text-iron-300 empty:tw-hidden">
          {statusText}
        </output>
      </footer>
    </dialog>,
    document.body
  );
}
