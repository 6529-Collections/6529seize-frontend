"use client";

import { getRouteHrefWithLocale } from "@/components/rememes/rememesRouteParams";
import useCapacitor from "@/hooks/useCapacitor";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toPng } from "html-to-image";
import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { DisplayTz, SeasonMintScanResult } from "./meme-calendar.helpers";
import {
  displayedSeasonNumberFromIndex,
  formatFullDate,
  formatFullDateTime,
  formatToFullDivision,
  getCanonicalNextMintNumber,
  getMintNumberForMintDate,
  getMintTimelineDetails,
  getNextMintStart,
  getUpcomingMintsForCurrentOrNextSeason,
  getUpcomingMintsForSeasonIndex,
  printCalendarInvites,
  ymd,
} from "./meme-calendar.helpers";

/**
 * Layout wrapper: global Local/UTC toggle + two cards
 */
interface MemeCalendarOverviewProps {
  readonly displayTz: DisplayTz;
  readonly locale?: SupportedLocale | undefined;
  readonly showViewAll?: boolean | undefined;
}

export default function MemeCalendarOverview({
  displayTz,
  locale = DEFAULT_LOCALE,
  showViewAll = false,
}: MemeCalendarOverviewProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-h-full tw-items-center tw-gap-3">
        <h1 className="tw-mb-0">{t(locale, "memeCalendar.title")}</h1>
        {showViewAll && (
          <Link
            href={getRouteHrefWithLocale({ href: "/meme-calendar", locale })}
            aria-label={t(locale, "memeCalendar.viewFullCalendarAriaLabel")}
          >
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium hover:tw-text-[#bbb] max-[800px]:tw-text-xs">
              {t(locale, "memeCalendar.viewFullCalendar")}
            </span>
          </Link>
        )}
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        <div className="tw-h-full">
          <MemeCalendarOverviewNextMint displayTz={displayTz} locale={locale} />
        </div>
        <div className="tw-h-full">
          <MemeCalendarOverviewUpcomingMints
            displayTz={displayTz}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Card 1 — Next mint: big number, date (single line governed by global toggle),
 * live countdown, calendar links.
 */
interface MemeCalendarOverviewNextMintProps {
  readonly displayTz: DisplayTz;
  readonly id?: number | undefined;
  readonly locale?: SupportedLocale | undefined;
}

const TopControls = memo(function TopControls(props: {
  canonicalNextMintNumber: number;
  selectedMintNumber: number;
  onSelect: (n: number) => void;
  mintInputRef: React.RefObject<HTMLInputElement | null>;
  onMintInputChange: (v: string) => void;
  onMintInputSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onScreenshot: () => void;
  isCapturing: boolean;
  locale: SupportedLocale;
}) {
  const { isCapacitor } = useCapacitor();
  const {
    canonicalNextMintNumber,
    selectedMintNumber,
    onSelect,
    mintInputRef,
    onMintInputChange,
    onMintInputSubmit,
    onScreenshot,
    isCapturing,
    locale,
  } = props;
  const mintInputId = "meme-overview-mint-input";

  return (
    <div
      className="tw-mb-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2"
      data-ignore-screenshot
    >
      <button
        disabled={canonicalNextMintNumber === selectedMintNumber}
        type="button"
        aria-label={t(locale, "memeCalendar.overview.controls.nextMint")}
        className="tw-inline-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-[#d1d1d1] tw-bg-white tw-px-3 tw-text-sm tw-font-semibold tw-text-black hover:tw-bg-[#e9e9e9] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-75 disabled:hover:tw-border-[#d1d1d1] disabled:hover:tw-bg-white disabled:hover:tw-text-black"
        onClick={() => onSelect(canonicalNextMintNumber)}
      >
        {t(locale, "memeCalendar.overview.controls.nextMint")}
      </button>

      <form onSubmit={onMintInputSubmit}>
        <label
          htmlFor={mintInputId}
          className="tw-flex tw-h-8 tw-items-center tw-rounded-md tw-border tw-border-[#d1d1d1] tw-bg-[#e5e5e5] tw-pl-3 tw-font-semibold tw-text-black"
        >
          <span className="tw-shrink-0 tw-select-none tw-pr-2">
            {t(locale, "memeCalendar.overview.controls.memeNumber")}
          </span>
          <input
            id={mintInputId}
            ref={mintInputRef}
            type="number"
            min={1}
            name="meme-overview-mint-input"
            placeholder="123"
            onChange={(event) => {
              const v = event.target.value.replace(/\D/g, "");
              onMintInputChange(v);
            }}
            className="tw-h-8 tw-w-[8ch] tw-rounded-r-md tw-border-none tw-px-2 tw-text-black placeholder:tw-text-gray-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          />
        </label>
      </form>

      {!isCapacitor && (
        <>
          {/* spacer so the camera can sit on the same row but push to the right when space exists */}
          <div className="tw-flex-1" />

          <ScreenshotCard
            onScreenshot={onScreenshot}
            isCapturing={isCapturing}
            locale={locale}
          />
        </>
      )}
    </div>
  );
});

export function MemeCalendarOverviewNextMint({
  displayTz,
  id,
  locale = DEFAULT_LOCALE,
}: MemeCalendarOverviewNextMintProps) {
  const [now, setNow] = useState(new Date());
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [selectedMintNumber, setSelectedMintNumber] = useState(() => {
    if (id != null) return id;
    const upcomingInstant = getNextMintStart(new Date());
    const upcomingUtcDay = new Date(
      Date.UTC(
        upcomingInstant.getUTCFullYear(),
        upcomingInstant.getUTCMonth(),
        upcomingInstant.getUTCDate()
      )
    );
    return getMintNumberForMintDate(upcomingUtcDay);
  });
  const [mintInputValue, setMintInputValue] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const mintInputRef = useRef<HTMLInputElement>(null);

  const canonicalNextMintNumber = useMemo(
    () => getCanonicalNextMintNumber(now),
    [now]
  );

  const handleMintSelection = useCallback(
    (mintNumber: number) => {
      setSelectedMintNumber(mintNumber);
      setIsManualSelection(mintNumber !== canonicalNextMintNumber);
    },
    [canonicalNextMintNumber]
  );

  const handleMintInputChange = useCallback((v: string) => {
    setMintInputValue(v);
  }, []);

  const handleMintInputSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = parseInt(mintInputValue, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        return;
      }
      handleMintSelection(parsed);
      setMintInputValue("");
      mintInputRef.current?.blur();
    },
    [mintInputValue, handleMintSelection]
  );

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (id != null) {
      setSelectedMintNumber(id);
      setIsManualSelection(true);
    }
  }, [id]);

  useEffect(() => {
    if (
      id == null &&
      !isManualSelection &&
      selectedMintNumber !== canonicalNextMintNumber
    ) {
      setSelectedMintNumber(canonicalNextMintNumber);
    }
  }, [id, canonicalNextMintNumber, isManualSelection, selectedMintNumber]);

  useEffect(() => {
    if (
      id == null &&
      isManualSelection &&
      selectedMintNumber === canonicalNextMintNumber
    ) {
      setIsManualSelection(false);
    }
  }, [id, canonicalNextMintNumber, isManualSelection, selectedMintNumber]);

  const mintDetails = useMemo(
    () => getMintTimelineDetails(selectedMintNumber),
    [selectedMintNumber]
  );

  const invitesHtml = useMemo(
    () =>
      printCalendarInvites(
        mintDetails.instantUtc,
        mintDetails.mintNumber,
        "#fff",
        22,
        {
          addToCalendar: t(locale, "memeCalendar.invites.addToCalendar"),
          addToGoogleCalendar: t(
            locale,
            "memeCalendar.invites.addToGoogleCalendar"
          ),
        },
        locale
      ),
    [locale, mintDetails]
  );

  const nowMs = now.getTime();
  const startMs = mintDetails.instantUtc.getTime();
  const endMs = mintDetails.mintEndUtc.getTime();
  const isUpcoming = nowMs < startMs;
  const isPast = nowMs >= endMs;

  let heading: string;
  if (isUpcoming) {
    heading =
      mintDetails.mintNumber === canonicalNextMintNumber
        ? t(locale, "memeCalendar.overview.nextMint.heading.next")
        : t(locale, "memeCalendar.overview.nextMint.heading.upcoming");
  } else if (isPast) {
    heading = t(locale, "memeCalendar.overview.nextMint.heading.past");
  } else {
    heading = t(locale, "memeCalendar.overview.nextMint.heading.live");
  }

  let countdownTitle = t(locale, "memeCalendar.overview.countdown.mintingIn");
  let countdownSuffix: string | null = null;
  let countdownParts: ReturnType<typeof msToParts>;
  if (isUpcoming) {
    countdownParts = msToParts(startMs - nowMs);
  } else if (isPast) {
    countdownTitle = t(locale, "memeCalendar.overview.countdown.minted");
    countdownSuffix = t(locale, "memeCalendar.overview.countdown.ago");
    countdownParts = msToParts(nowMs - startMs);
  } else {
    countdownTitle = t(locale, "memeCalendar.overview.countdown.mintEndsIn");
    countdownParts = msToParts(endMs - nowMs);
  }

  const countdownText = formatDurationParts(countdownParts, locale);
  const finalCountdown = countdownSuffix ? (
    <>
      {countdownText}{" "}
      <span className="tw-text-sm tw-font-normal">{countdownSuffix}</span>
    </>
  ) : (
    countdownText
  );
  const handleScreenshot = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      setIsCapturing(true);

      // Clone the card and strip ignored elements
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll("[data-ignore-screenshot]")
        .forEach((el) => el.remove());

      // Create a tight, offscreen wrapper so there is no outside gap
      const mount = document.createElement("div");
      const rect = cardRef.current.getBoundingClientRect();
      Object.assign(mount.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        padding: "0",
        margin: "0",
        background: "transparent",
        display: "inline-block",
        lineHeight: "normal",
        width: `${rect.width}px`, // lock width to avoid reflow differences
      } as CSSStyleDeclaration);

      // Ensure the clone itself doesn't carry margins
      Object.assign(clone.style, {
        margin: "0",
        height: "auto",
        minHeight: "0",
        display: "block",
      } as CSSStyleDeclaration);

      mount.appendChild(clone);
      document.body.appendChild(mount);

      // Measure tight dimensions and render the clone directly
      const width = Math.ceil(clone.scrollWidth || rect.width);
      const height = Math.ceil(
        clone.scrollHeight || clone.getBoundingClientRect().height || 0
      );

      const dataUrl = await toPng(clone, {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio || 1,
        width,
        height,
        backgroundColor: "#0c0c0d", // solid card bg so PNG doesn't look empty
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `meme-${mintDetails.mintNumber}-mint.png`;
      link.click();

      document.body.removeChild(mount);
    } catch (error) {
      console.error("Failed to capture meme calendar panel", error);
    } finally {
      setIsCapturing(false);
    }
  }, [mintDetails]);

  return (
    <div className="tw-relative">
      <div
        ref={cardRef}
        className="tw-flex tw-flex-col tw-justify-between tw-rounded-md tw-border tw-border-solid tw-border-[#222222] tw-bg-[#0c0c0d] tw-p-4"
      >
        <div className="tw-space-y-1">
          {id == null && (
            <TopControls
              canonicalNextMintNumber={canonicalNextMintNumber}
              selectedMintNumber={selectedMintNumber}
              onSelect={handleMintSelection}
              mintInputRef={mintInputRef}
              onMintInputChange={handleMintInputChange}
              onMintInputSubmit={handleMintInputSubmit}
              onScreenshot={handleScreenshot}
              isCapturing={isCapturing}
              locale={locale}
            />
          )}
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <div className="tw-text-sm tw-text-gray-400">{heading}</div>
            {id != null && (
              <ScreenshotCard
                onScreenshot={handleScreenshot}
                isCapturing={isCapturing}
                locale={locale}
              />
            )}
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="!tw-text-3xl tw-font-bold md:!tw-text-4xl">
              #{formatInteger(locale, mintDetails.mintNumber)}
            </div>
          </div>
          <div className="tw-text-lg tw-font-semibold">
            {formatFullDateTime(mintDetails.instantUtc, displayTz, locale)}
          </div>
          <div className="tw-text-sm">
            {formatToFullDivision(mintDetails.instantUtc, locale)}
          </div>

          <div className="tw-pt-2 tw-text-sm tw-text-gray-400">
            {countdownTitle}
          </div>
          <div className="tw-text-2xl tw-font-semibold">{finalCountdown}</div>
        </div>

        <div
          data-ignore-screenshot
          className="tw-pt-3"
          dangerouslySetInnerHTML={{ __html: invitesHtml }}
        />
      </div>
    </div>
  );
}

/**
 * Card 2 — Upcoming mints for the current SZN.
 * Shows a table of remaining Mon/Wed/Fri date-times (timed, not all-day).
 */
interface MemeCalendarOverviewUpcomingMintsProps {
  readonly displayTz: DisplayTz;
  readonly locale?: SupportedLocale | undefined;
}

function MemeCalendarOverviewUpcomingMints({
  displayTz,
  locale = DEFAULT_LOCALE,
}: MemeCalendarOverviewUpcomingMintsProps) {
  const [now] = useState(new Date());

  const currentSeason = useMemo<SeasonMintScanResult>(
    () => getUpcomingMintsForCurrentOrNextSeason(now),
    [now]
  );

  const canonicalNextMintNumber = useMemo(
    () => getCanonicalNextMintNumber(now),
    [now]
  );

  const {
    seasonStart,
    seasonEndInclusive,
    seasonIndex,
    filteredRows,
    isNextSeason,
  } = useMemo(() => {
    const containsCanonical = currentSeason.rows.some(
      (row) => row.meme === canonicalNextMintNumber
    );
    const filtered = containsCanonical
      ? currentSeason.rows.filter((row) => row.meme !== canonicalNextMintNumber)
      : currentSeason.rows;

    if (filtered.length === 0 && containsCanonical) {
      const nextSeason = getUpcomingMintsForSeasonIndex(
        currentSeason.seasonIndex + 1,
        now
      );
      return {
        seasonStart: nextSeason.seasonStart,
        seasonEndInclusive: nextSeason.seasonEndInclusive,
        seasonIndex: nextSeason.seasonIndex,
        filteredRows: nextSeason.rows,
        isNextSeason: true,
      };
    }

    return {
      seasonStart: currentSeason.seasonStart,
      seasonEndInclusive: currentSeason.seasonEndInclusive,
      seasonIndex: currentSeason.seasonIndex,
      filteredRows: filtered,
      isNextSeason: false,
    };
  }, [currentSeason, canonicalNextMintNumber, now]);

  const formattedSeason = formatInteger(
    locale,
    displayedSeasonNumberFromIndex(seasonIndex)
  );
  const upcomingHeading = isNextSeason
    ? t(locale, "memeCalendar.overview.upcoming.nextSeason", {
        season: formattedSeason,
      })
    : t(locale, "memeCalendar.overview.upcoming.currentSeason", {
        season: formattedSeason,
      });
  const emptyStateCopy = t(locale, "memeCalendar.overview.upcoming.empty");

  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-rounded-md tw-border tw-border-solid tw-border-[#222222] tw-bg-[#0c0c0d] tw-p-4">
      <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
        <div className="tw-font-semibold">{upcomingHeading}</div>
        <div className="tw-text-sm tw-text-gray-400">
          {formatFullDate(seasonStart, displayTz, locale)} -{" "}
          {formatFullDate(seasonEndInclusive, displayTz, locale)}
        </div>
      </div>

      <div className="tw-max-h-[390px] tw-flex-1 tw-overflow-x-auto tw-overflow-y-auto tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        <table className="tw-w-full tw-text-sm">
          <caption className="tw-sr-only">{upcomingHeading}</caption>
          <thead>
            <tr className="tw-sr-only">
              <th scope="col">
                {t(locale, "memeCalendar.overview.upcoming.memeNumber")}
              </th>
              <th scope="col">
                {t(locale, "memeCalendar.overview.upcoming.mintTime")}
              </th>
              <th scope="col">
                {t(locale, "memeCalendar.overview.upcoming.calendarLinks")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td className="tw-py-3 tw-text-gray-500" colSpan={3}>
                  {emptyStateCopy}
                </td>
              </tr>
            ) : (
              filteredRows.map(({ utcDay, instantUtc, meme }) => (
                <tr key={ymd(utcDay)}>
                  <td className="tw-py-2 tw-font-semibold">
                    #{formatInteger(locale, meme)}
                  </td>
                  <td className="tw-py-2 tw-pr-4">
                    {formatFullDateTime(instantUtc, displayTz, locale)}
                  </td>
                  <td
                    className="tw-flex tw-items-center tw-justify-end tw-py-2 tw-pr-6"
                    dangerouslySetInnerHTML={{
                      __html: printCalendarInvites(
                        instantUtc,
                        meme,
                        "#fff",
                        18,
                        {
                          addToCalendar: t(
                            locale,
                            "memeCalendar.invites.addToCalendar"
                          ),
                          addToGoogleCalendar: t(
                            locale,
                            "memeCalendar.invites.addToGoogleCalendar"
                          ),
                        },
                        locale
                      ),
                    }}
                  ></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function msToParts(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { d, h, m, s: sec };
}

type DurationParts = ReturnType<typeof msToParts>;

function formatDurationParts(
  parts: DurationParts,
  locale: SupportedLocale
): string {
  const segments: string[] = [];
  const segment = (
    value: number,
    unitKey:
      | "memeCalendar.overview.duration.days"
      | "memeCalendar.overview.duration.hours"
      | "memeCalendar.overview.duration.minutes"
      | "memeCalendar.overview.duration.seconds"
  ) => `${formatInteger(locale, value)}${t(locale, unitKey)}`;

  if (parts.d > 0) {
    segments.push(
      segment(parts.d, "memeCalendar.overview.duration.days"),
      segment(parts.h, "memeCalendar.overview.duration.hours"),
      segment(parts.m, "memeCalendar.overview.duration.minutes"),
      segment(parts.s, "memeCalendar.overview.duration.seconds")
    );
  } else if (parts.h > 0) {
    segments.push(
      segment(parts.h, "memeCalendar.overview.duration.hours"),
      segment(parts.m, "memeCalendar.overview.duration.minutes"),
      segment(parts.s, "memeCalendar.overview.duration.seconds")
    );
  } else if (parts.m > 0) {
    segments.push(
      segment(parts.m, "memeCalendar.overview.duration.minutes"),
      segment(parts.s, "memeCalendar.overview.duration.seconds")
    );
  } else {
    segments.push(segment(parts.s, "memeCalendar.overview.duration.seconds"));
  }
  return segments.join(" : ");
}

function ScreenshotCard({
  onScreenshot,
  isCapturing,
  locale,
}: {
  readonly onScreenshot: () => void;
  readonly isCapturing: boolean;
  readonly locale: SupportedLocale;
}) {
  const label = t(locale, "memeCalendar.overview.controls.screenshot");

  return (
    <button
      data-ignore-screenshot
      type="button"
      onClick={onScreenshot}
      disabled={isCapturing}
      className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-[#d1d1d1] tw-bg-white tw-text-black tw-transition hover:tw-bg-[#e9e9e9] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
      aria-label={label}
      title={label}
    >
      <FontAwesomeIcon icon={faCamera} className="tw-h-4 tw-w-4" />
    </button>
  );
}
