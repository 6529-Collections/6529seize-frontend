"use client";

import { getRouteHrefWithLocale } from "@/components/rememes/rememesRouteParams";
import Button from "@/components/utils/button/Button";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { toPng } from "html-to-image";
import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Tooltip } from "react-tooltip";
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
import {
  ScreenshotCard,
  ScreenshotFeedback,
  type ScreenshotStatus,
} from "./MemeCalendarScreenshotControls";
import MemeNumberSearch from "./MemeNumberSearch";

const MAX_MINT_NUMBER = 100_000;
const CALENDAR_INVITE_ICON_SIZE = 18;
const OVERVIEW_CARD_CLASS =
  "tw-rounded-2xl tw-bg-iron-950 tw-shadow-lg tw-ring-1 tw-ring-iron-800";

/**
 * Layout wrapper: global Local/UTC toggle + two cards
 */
interface MemeCalendarOverviewProps {
  readonly displayTz: DisplayTz;
  readonly locale?: SupportedLocale | undefined;
  readonly showViewAll?: boolean | undefined;
  readonly headerAction?: ReactNode | undefined;
}

export default function MemeCalendarOverview({
  displayTz,
  locale = DEFAULT_LOCALE,
  showViewAll = false,
  headerAction,
}: MemeCalendarOverviewProps) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-5 sm:tw-gap-6">
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
        <div className="tw-min-w-0">
          <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
            {t(locale, "memeCalendar.title")}
          </h1>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3">
          {headerAction}
          {showViewAll && (
            <Link
              href={getRouteHrefWithLocale({ href: "/meme-calendar", locale })}
              aria-label={t(locale, "memeCalendar.viewFullCalendarAriaLabel")}
              className="tw-rounded-sm tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300"
            >
              <span className="tw-whitespace-nowrap">
                {t(locale, "memeCalendar.viewFullCalendar")}
              </span>
            </Link>
          )}
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
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

interface TopControlsProps {
  readonly canonicalNextMintNumber: number;
  readonly selectedMintNumber: number;
  readonly onSelect: (n: number) => void;
  readonly mintInputRef: React.RefObject<HTMLInputElement | null>;
  readonly mintInputValue: string;
  readonly mintInputError: string;
  readonly onMintInputChange: (v: string) => void;
  readonly onMintInputSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onScreenshot: () => void;
  readonly isCapturing: boolean;
  readonly screenshotStatus: ScreenshotStatus;
  readonly screenshotStatusId: string;
  readonly locale: SupportedLocale;
}

const TopControls = memo((props: TopControlsProps) => {
  const { isCapacitor } = useCapacitor();
  const {
    canonicalNextMintNumber,
    selectedMintNumber,
    onSelect,
    mintInputRef,
    mintInputValue,
    mintInputError,
    onMintInputChange,
    onMintInputSubmit,
    onScreenshot,
    isCapturing,
    screenshotStatus,
    screenshotStatusId,
    locale,
  } = props;
  const mintInputId = "meme-overview-mint-input";

  return (
    <div
      className="tw-mb-4 tw-flex tw-flex-wrap tw-items-start tw-gap-2"
      data-ignore-screenshot
    >
      <Button
        disabled={canonicalNextMintNumber === selectedMintNumber}
        type="button"
        aria-label={t(locale, "memeCalendar.overview.controls.nextMint")}
        variant="primary"
        size="sm"
        className="disabled:!tw-cursor-default disabled:!tw-opacity-100"
        onClick={() => onSelect(canonicalNextMintNumber)}
      >
        {t(locale, "memeCalendar.overview.controls.nextMint")}
      </Button>

      <MemeNumberSearch
        id={mintInputId}
        inputRef={mintInputRef}
        value={mintInputValue}
        error={mintInputError}
        label={t(locale, "memeCalendar.overview.controls.memeNumber")}
        submitLabel={t(locale, "memeCalendar.numberInput.submit")}
        max={MAX_MINT_NUMBER}
        className="!tw-w-[140px] !tw-flex-none sm:!tw-w-44"
        onChange={onMintInputChange}
        onSubmit={onMintInputSubmit}
      />

      {!isCapacitor && (
        <>
          {/* spacer so the camera can sit on the same row but push to the right when space exists */}
          <div className="tw-flex-1" />

          <ScreenshotCard
            onScreenshot={onScreenshot}
            isCapturing={isCapturing}
            statusId={
              screenshotStatus === "idle" ? undefined : screenshotStatusId
            }
            locale={locale}
          />
        </>
      )}
    </div>
  );
});
TopControls.displayName = "TopControls";

export function MemeCalendarOverviewNextMint({
  displayTz,
  id,
  locale = DEFAULT_LOCALE,
}: MemeCalendarOverviewNextMintProps) {
  const overviewInstanceId = useId();
  const calendarInviteTooltipId = buildTooltipId(
    overviewInstanceId,
    "meme-calendar-next-mint-invites"
  );
  const screenshotStatusId = buildTooltipId(
    overviewInstanceId,
    "meme-overview-screenshot-status"
  );
  const [now, setNow] = useState(new Date());
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [selectedMintNumber, setSelectedMintNumber] = useState(() => {
    if (id !== undefined) return id;
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
  const [mintInputError, setMintInputError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotStatus, setScreenshotStatus] =
    useState<ScreenshotStatus>("idle");

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
      setMintInputError("");
    },
    [canonicalNextMintNumber]
  );

  const handleMintInputChange = useCallback((v: string) => {
    setMintInputValue(v);
    setMintInputError("");
  }, []);

  const handleMintInputSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = parseInt(mintInputValue, 10);
      if (
        !Number.isSafeInteger(parsed) ||
        parsed < 1 ||
        parsed > MAX_MINT_NUMBER
      ) {
        setMintInputError(t(locale, "memeCalendar.validation.memeNumber"));
        return;
      }
      handleMintSelection(parsed);
      setMintInputValue("");
      mintInputRef.current?.blur();
    },
    [mintInputValue, handleMintSelection, locale]
  );

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect, react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-chain-state-updates, react-you-might-not-need-an-effect/no-derived-state, react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-pass-data-to-parent, react-you-might-not-need-an-effect/no-pass-live-state-to-parent -- Preserve the existing synchronization between the optional controlled mint, manual selection, and the live canonical mint rollover. */
  useEffect(() => {
    if (id !== undefined) {
      setSelectedMintNumber(id);
      setIsManualSelection(true);
    }
  }, [id]);

  useEffect(() => {
    if (
      id === undefined &&
      !isManualSelection &&
      selectedMintNumber !== canonicalNextMintNumber
    ) {
      setSelectedMintNumber(canonicalNextMintNumber);
    }
  }, [id, canonicalNextMintNumber, isManualSelection, selectedMintNumber]);

  useEffect(() => {
    if (
      id === undefined &&
      isManualSelection &&
      selectedMintNumber === canonicalNextMintNumber
    ) {
      setIsManualSelection(false);
    }
  }, [id, canonicalNextMintNumber, isManualSelection, selectedMintNumber]);
  /* eslint-enable react-hooks/set-state-in-effect, react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-chain-state-updates, react-you-might-not-need-an-effect/no-derived-state, react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-pass-data-to-parent, react-you-might-not-need-an-effect/no-pass-live-state-to-parent */

  const mintDetails = useMemo(
    () => getMintTimelineDetails(selectedMintNumber),
    [selectedMintNumber]
  );

  const invitesHtml = useMemo(
    () =>
      printCalendarInvites(
        mintDetails.instantUtc,
        mintDetails.mintNumber,
        "currentColor",
        CALENDAR_INVITE_ICON_SIZE,
        {
          addToCalendar: t(locale, "memeCalendar.invites.addToCalendar"),
          addToGoogleCalendar: t(
            locale,
            "memeCalendar.invites.addToGoogleCalendar"
          ),
          tooltipId: calendarInviteTooltipId,
        },
        locale
      ),
    [calendarInviteTooltipId, locale, mintDetails]
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
      <span className="tw-text-sm tw-font-normal tw-leading-5">
        {countdownSuffix}
      </span>
    </>
  ) : (
    countdownText
  );
  const handleScreenshot = useCallback(async () => {
    if (!cardRef.current) {
      setScreenshotStatus("error");
      return;
    }
    let mount: HTMLDivElement | null = null;
    try {
      setIsCapturing(true);
      setScreenshotStatus("loading");

      // Clone the card and strip ignored elements
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll("[data-ignore-screenshot]")
        .forEach((el) => el.remove());

      // Create a tight, offscreen wrapper so there is no outside gap
      mount = document.createElement("div");
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
        backgroundColor: getComputedStyle(cardRef.current).backgroundColor,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `meme-${mintDetails.mintNumber}-mint.png`;
      link.click();
      setScreenshotStatus("success");
    } catch (error) {
      console.error("Failed to capture meme calendar panel", error);
      setScreenshotStatus("error");
    } finally {
      mount?.remove();
      setIsCapturing(false);
    }
  }, [mintDetails]);

  return (
    <div className="tw-relative tw-h-full">
      <div
        ref={cardRef}
        className={`${OVERVIEW_CARD_CLASS} tw-relative tw-flex tw-h-full tw-flex-col tw-justify-between tw-overflow-hidden tw-p-5 sm:tw-p-6`}
      >
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-right-0 tw-top-24 tw-size-64 tw-rounded-full tw-bg-primary-500/[0.06] tw-blur-3xl sm:-tw-right-20 sm:tw-top-20 sm:tw-size-96"
        />
        <div className="tw-relative tw-z-10">
          {id === undefined && (
            <TopControls
              canonicalNextMintNumber={canonicalNextMintNumber}
              selectedMintNumber={selectedMintNumber}
              onSelect={handleMintSelection}
              mintInputRef={mintInputRef}
              mintInputValue={mintInputValue}
              mintInputError={mintInputError}
              onMintInputChange={handleMintInputChange}
              onMintInputSubmit={handleMintInputSubmit}
              onScreenshot={handleScreenshot}
              isCapturing={isCapturing}
              screenshotStatus={screenshotStatus}
              screenshotStatusId={screenshotStatusId}
              locale={locale}
            />
          )}
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.16em] tw-text-primary-400">
              {heading}
            </div>
            {id !== undefined && (
              <ScreenshotCard
                onScreenshot={handleScreenshot}
                isCapturing={isCapturing}
                statusId={
                  screenshotStatus === "idle" ? undefined : screenshotStatusId
                }
                locale={locale}
              />
            )}
          </div>
          <div className="tw-grid tw-min-w-0 tw-gap-4 tw-pt-1.5 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-end sm:tw-gap-6">
            <div className="tw-min-w-0">
              <div className="!tw-text-3xl tw-font-semibold tw-tracking-[-0.035em] tw-text-iron-50 sm:!tw-text-4xl">
                #{formatInteger(locale, mintDetails.mintNumber)}
              </div>
              <div className="tw-mt-1.5 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300">
                {formatFullDateTime(mintDetails.instantUtc, displayTz, locale)}
              </div>
            </div>
            <div className="tw-min-w-0 sm:tw-pb-0.5 sm:tw-text-right">
              <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.16em] tw-text-iron-500">
                {countdownTitle}
              </div>
              <div className="tw-mt-1 tw-break-words tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-100 sm:tw-whitespace-nowrap">
                {finalCountdown}
              </div>
            </div>
          </div>

          <div className="tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2 tw-text-sm tw-leading-5 tw-text-iron-300">
            {formatToFullDivision(mintDetails.instantUtc, locale)}
          </div>
          <ScreenshotFeedback
            locale={locale}
            statusId={screenshotStatusId}
            status={screenshotStatus}
          />
        </div>

        <div
          data-ignore-screenshot
          className="tw-relative tw-z-10 tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3"
          dangerouslySetInnerHTML={{ __html: invitesHtml }}
        />
      </div>
      <Tooltip
        id={calendarInviteTooltipId}
        place="top"
        positionStrategy="fixed"
        offset={8}
        delayShow={250}
        opacity={1}
        style={TOOLTIP_STYLES}
      />
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
  const calendarInviteTooltipId = buildTooltipId(
    useId(),
    "meme-calendar-upcoming-invites"
  );
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
    <div
      className={`${OVERVIEW_CARD_CLASS} tw-flex tw-h-full tw-flex-col tw-p-5 sm:tw-p-6`}
    >
      <div className="tw-mb-5 tw-flex tw-min-w-0 tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between sm:tw-gap-4">
        <div className="tw-min-w-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
          {upcomingHeading}
        </div>
        <div className="tw-min-w-0 tw-text-sm tw-leading-5 tw-text-iron-400 sm:tw-max-w-[15rem] sm:tw-text-right">
          {formatFullDate(seasonStart, displayTz, locale)} -{" "}
          {formatFullDate(seasonEndInclusive, displayTz, locale)}
        </div>
      </div>

      <div className="tw-max-h-96 tw-flex-1 tw-overflow-x-auto tw-overflow-y-auto tw-pr-1 tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 sm:tw-pr-3">
        <table className="tw-w-full tw-min-w-0 tw-border-collapse tw-text-sm tw-leading-5 sm:tw-min-w-[22rem]">
          <caption className="tw-sr-only">{upcomingHeading}</caption>
          <thead className="tw-sr-only">
            <tr>
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
                <td className="tw-py-3 tw-text-iron-500" colSpan={3}>
                  {emptyStateCopy}
                </td>
              </tr>
            ) : (
              filteredRows.map(({ utcDay, instantUtc, meme }) => {
                const mintTime = formatFullDateTime(
                  instantUtc,
                  displayTz,
                  locale
                );
                return (
                  <tr
                    key={ymd(utcDay)}
                    className="tw-h-12 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800/80 last:tw-border-b-0"
                  >
                    <td className="tw-py-3 tw-pr-3 sm:tw-hidden" colSpan={2}>
                      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
                        <span className="tw-font-medium tw-text-primary-300">
                          #{formatInteger(locale, meme)}
                        </span>
                        <span className="tw-text-iron-300">{mintTime}</span>
                      </div>
                    </td>
                    <td className="tw-hidden tw-py-3 tw-font-medium tw-text-primary-300 sm:tw-table-cell">
                      #{formatInteger(locale, meme)}
                    </td>
                    <td className="tw-hidden tw-py-3 tw-pr-4 tw-text-iron-300 sm:tw-table-cell">
                      {mintTime}
                    </td>
                    <td
                      className="tw-flex tw-items-center tw-justify-end tw-py-1.5 tw-pr-1"
                      dangerouslySetInnerHTML={{
                        __html: printCalendarInvites(
                          instantUtc,
                          meme,
                          "currentColor",
                          CALENDAR_INVITE_ICON_SIZE,
                          {
                            addToCalendar: t(
                              locale,
                              "memeCalendar.invites.addToCalendar"
                            ),
                            addToGoogleCalendar: t(
                              locale,
                              "memeCalendar.invites.addToGoogleCalendar"
                            ),
                            tooltipId: calendarInviteTooltipId,
                          },
                          locale
                        ),
                      }}
                    ></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Tooltip
        id={calendarInviteTooltipId}
        place="top"
        positionStrategy="fixed"
        offset={8}
        delayShow={250}
        opacity={1}
        style={TOOLTIP_STYLES}
      />
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
  const secondsUnitKey = "memeCalendar.overview.duration.seconds";
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
      segment(parts.s, secondsUnitKey)
    );
  } else if (parts.h > 0) {
    segments.push(
      segment(parts.h, "memeCalendar.overview.duration.hours"),
      segment(parts.m, "memeCalendar.overview.duration.minutes"),
      segment(parts.s, secondsUnitKey)
    );
  } else if (parts.m > 0) {
    segments.push(
      segment(parts.m, "memeCalendar.overview.duration.minutes"),
      segment(parts.s, secondsUnitKey)
    );
  } else {
    segments.push(segment(parts.s, secondsUnitKey));
  }
  return segments.join(" : ");
}
