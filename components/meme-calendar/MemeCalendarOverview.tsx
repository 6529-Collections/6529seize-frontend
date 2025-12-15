"use client";

import useCapacitor from "@/hooks/useCapacitor";
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
  readonly showViewAll?: boolean;
}

export default function MemeCalendarOverview({
  displayTz,
  showViewAll = false,
}: MemeCalendarOverviewProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-h-full tw-flex tw-items-center tw-gap-3">
        <h1 className="tw-mb-0">The Memes Minting Calendar</h1>
        {showViewAll && (
          <Link href="/meme-calendar">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium hover:tw-text-[#bbb] max-[800px]:tw-text-[12px]">
              View Full Calendar
            </span>
          </Link>
        )}
      </div>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        <div className="tw-h-full">
          <MemeCalendarOverviewNextMint displayTz={displayTz} />
        </div>
        <div className="tw-h-full">
          <MemeCalendarOverviewUpcomingMints displayTz={displayTz} />
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
  readonly id?: number;
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
  } = props;

  return (
    <div
      className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-mb-3"
      data-ignore-screenshot>
      <button
        disabled={canonicalNextMintNumber === selectedMintNumber}
        type="button"
        className="tw-inline-flex tw-items-center tw-justify-center tw-h-8 tw-rounded-md tw-bg-white tw-text-black tw-px-3 tw-text-sm tw-font-semibold tw-border tw-border-[#d1d1d1] hover:tw-bg-[#e9e9e9] disabled:tw-opacity-75 disabled:hover:tw-bg-white disabled:hover:tw-text-black disabled:hover:tw-border-[#d1d1d1]"
        onClick={() => onSelect(canonicalNextMintNumber)}>
        Next Mint
      </button>

      <form onSubmit={onMintInputSubmit}>
        <div className="tw-bg-[#e5e5e5] tw-h-8 tw-flex tw-items-center tw-rounded-md tw-text-black tw-font-semibold tw-pl-3 tw-border tw-border-[#d1d1d1]">
          <div className="tw-shrink-0 tw-select-none tw-pr-2">Meme #</div>
          <input
            id="meme-overview-mint-input"
            ref={mintInputRef}
            type="number"
            min={1}
            name="meme-overview-mint-input"
            placeholder="123"
            onChange={(event) => {
              const v = event.target.value.replace(/\D/g, "");
              onMintInputChange(v);
            }}
            className="tw-text-black placeholder:tw-text-gray-500 focus:tw-outline-none tw-border-none tw-h-8 tw-w-[8ch] tw-px-2 tw-rounded-r-md"
          />
        </div>
      </form>

      {!isCapacitor && (
        <>
          {/* spacer so the camera can sit on the same row but push to the right when space exists */}
          <div className="tw-flex-1" />

          <ScreenshotCard
            onScreenshot={onScreenshot}
            isCapturing={isCapturing}
          />
        </>
      )}
    </div>
  );
});

export function MemeCalendarOverviewNextMint({
  displayTz,
  id,
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
    () => printCalendarInvites(mintDetails.instantUtc, mintDetails.mintNumber),
    [mintDetails]
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
        ? "Next Mint"
        : "Upcoming Mint";
  } else if (isPast) {
    heading = "Past Mint";
  } else {
    heading = "Mint Live";
  }

  let countdownTitle = "Minting in";
  let countdownSuffix: string | null = null;
  let countdownParts: ReturnType<typeof msToParts>;
  if (isUpcoming) {
    countdownParts = msToParts(startMs - nowMs);
  } else if (isPast) {
    countdownTitle = "Minted";
    countdownSuffix = "ago";
    countdownParts = msToParts(nowMs - startMs);
  } else {
    countdownTitle = "Mint ends in";
    countdownParts = msToParts(endMs - nowMs);
  }

  const countdownText = formatDurationParts(countdownParts);
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
        className="tw-p-4 tw-flex tw-flex-col tw-justify-between tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#222222]">
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
            />
          )}
          <div className="tw-flex tw-items-center tw-gap-2 tw-justify-between">
            <div className="tw-text-sm tw-text-gray-400">{heading}</div>
            {id != null && (
              <ScreenshotCard
                onScreenshot={handleScreenshot}
                isCapturing={isCapturing}
              />
            )}
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="!tw-text-3xl md:!tw-text-4xl tw-font-bold">
              #{mintDetails.mintNumber.toLocaleString()}
            </div>
          </div>
          <div className="tw-text-lg tw-font-semibold">
            {formatFullDateTime(mintDetails.instantUtc, displayTz)}
          </div>
          <div className="tw-text-sm">
            {formatToFullDivision(mintDetails.instantUtc)}
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
}

function MemeCalendarOverviewUpcomingMints({
  displayTz,
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

  const emptyStateCopy = "No upcoming mints in this season.";

  return (
    <div className="tw-h-full tw-p-4 tw-flex tw-flex-col tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#222222]">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
        <div className="tw-font-semibold">
          {isNextSeason ? "Upcoming SZN" : "Upcoming Mints for SZN"}{" "}
          {displayedSeasonNumberFromIndex(seasonIndex)}
        </div>
        <div className="tw-text-sm tw-text-gray-400">
          {formatFullDate(seasonStart, displayTz)} -{" "}
          {formatFullDate(seasonEndInclusive, displayTz)}
        </div>
      </div>

      <div className="tw-overflow-x-auto tw-flex-1 tw-max-h-[390px] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 tw-transition-colors tw-duration-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        <table className="tw-w-full tw-text-sm">
          <thead></thead>
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
                    #{meme.toLocaleString()}
                  </td>
                  <td className="tw-py-2 tw-pr-4">
                    {formatFullDateTime(instantUtc, displayTz)}
                  </td>
                  <td
                    className="tw-py-2 tw-flex tw-items-center tw-justify-end tw-pr-6"
                    dangerouslySetInnerHTML={{
                      __html: printCalendarInvites(
                        instantUtc,
                        meme,
                        "#fff",
                        18
                      ),
                    }}></td>
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

function formatDurationParts(parts: DurationParts): string {
  const segments: string[] = [];
  if (parts.d > 0) {
    segments.push(
      `${parts.d.toLocaleString()}d`,
      `${parts.h}h`,
      `${parts.m}m`,
      `${parts.s}s`
    );
  } else if (parts.h > 0) {
    segments.push(`${parts.h}h`, `${parts.m}m`, `${parts.s}s`);
  } else if (parts.m > 0) {
    segments.push(`${parts.m}m`, `${parts.s}s`);
  } else {
    segments.push(`${parts.s}s`);
  }
  return segments.join(" : ");
}

function ScreenshotCard({
  onScreenshot,
  isCapturing,
}: {
  readonly onScreenshot: () => void;
  readonly isCapturing: boolean;
}) {
  return (
    <button
      data-ignore-screenshot
      type="button"
      onClick={onScreenshot}
      disabled={isCapturing}
      className="tw-inline-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-rounded-md tw-bg-white tw-text-black tw-transition hover:tw-bg-[#e9e9e9] focus:tw-outline-none disabled:tw-opacity-50 tw-border tw-border-[#d1d1d1]"
      aria-label="Screenshot"
      title="Screenshot">
      <FontAwesomeIcon icon={faCamera} className="tw-h-4 tw-w-4" />
    </button>
  );
}
