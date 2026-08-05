import {
  formatFullDateTime,
  formatMint,
  isMintEligibleUtcDay,
  mintEndInstantUtcForMintDay,
  mintStartInstantUtcForMintDay,
  startOfUtcDay,
} from "./meme-calendar.helpers";

const ICS_ESCAPED_SEMICOLON = String.raw`\;`;
const ICS_ESCAPED_COMMA = String.raw`\,`;

function ymdHmsUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${da}T${hh}${mm}${ss}Z`;
}
function createGoogleCalendarUrl(
  startInstantUtc: Date,
  endInstantUtc: Date,
  title: string,
  details: string
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${title} Minting`,
    dates: `${ymdHmsUtc(startInstantUtc)}/${ymdHmsUtc(endInstantUtc)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", ICS_ESCAPED_SEMICOLON)
    .replaceAll(",", ICS_ESCAPED_COMMA)
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", String.raw`\n`);
}

function createIcsDataUrl(
  startInstantUtc: Date,
  endInstantUtc: Date,
  title: string,
  description: string
): string {
  const dtStart = ymdHmsUtc(startInstantUtc);
  const dtEnd = ymdHmsUtc(endInstantUtc);
  const uid = `meme-${dtStart}@6529.io`;
  const summary = escapeIcsText(`${title} Minting`);
  const escapedDescription = escapeIcsText(description);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//6529.io//Meme Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${ymdHmsUtc(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${escapedDescription}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

type CalendarInviteLabels = {
  readonly addToCalendar: string;
  readonly addToGoogleCalendar: string;
  readonly tooltipId?: string | undefined;
};

const DEFAULT_CALENDAR_INVITE_LABELS: CalendarInviteLabels = {
  addToCalendar: "Add to Calendar",
  addToGoogleCalendar: "Add to Google Calendar",
};

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Accept either a UTC day (mint day) or an instant; always emit timed links at the correct mint instant
export function printCalendarInvites(
  dateOrInstant: Date,
  mintNumber: number,
  fontColor: string = "currentColor",
  size: number = 22,
  labels: CalendarInviteLabels = DEFAULT_CALENDAR_INVITE_LABELS,
  locale = "en-US"
): string {
  // Normalize to mint instant in UTC
  const utcDay = startOfUtcDay(dateOrInstant);
  const isEligibleMintDay = isMintEligibleUtcDay(utcDay);
  const mintStartUtc = isEligibleMintDay
    ? mintStartInstantUtcForMintDay(utcDay)
    : new Date(dateOrInstant);
  const mintEndUtc = mintEndInstantUtcForMintDay(utcDay);

  const title = `Meme ${formatMint(mintNumber, locale)}`;
  const fullLocal = formatFullDateTime(mintStartUtc, "local", locale);
  const fullUtc = formatFullDateTime(mintStartUtc, "utc", locale);
  const desc = `${title} — ${fullLocal} / ${fullUtc}\n\nhttps://6529.io/the-memes/mint`;

  const gUrl = createGoogleCalendarUrl(mintStartUtc, mintEndUtc, title, desc);
  const icsUrl = createIcsDataUrl(mintStartUtc, mintEndUtc, title, desc);
  const addToCalendarLabel = escapeHtmlAttribute(labels.addToCalendar);
  const addToGoogleCalendarLabel = escapeHtmlAttribute(
    labels.addToGoogleCalendar
  );
  const safeFontColor = escapeHtmlAttribute(fontColor);
  const iconStyle = `width:${size}px;height:${size}px`;
  const tooltipId = labels.tooltipId
    ? escapeHtmlAttribute(labels.tooltipId)
    : null;
  const addToCalendarTooltipAttributes = tooltipId
    ? `data-tooltip-id="${tooltipId}" data-tooltip-content="${addToCalendarLabel}"`
    : `title="${addToCalendarLabel}"`;
  const addToGoogleCalendarTooltipAttributes = tooltipId
    ? `data-tooltip-id="${tooltipId}" data-tooltip-content="${addToGoogleCalendarLabel}"`
    : `title="${addToGoogleCalendarLabel}"`;

  return `
    <div style="display:flex; gap:4px; align-items:center;">
      <a href="${icsUrl}" download="meme-${mintNumber}-minting.ics" aria-label="${addToCalendarLabel}" ${addToCalendarTooltipAttributes} class="tw-text-iron-300 tw-transition-colors desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400" style="display:inline-flex; min-width:32px; min-height:32px; align-items:center; justify-content:center; border-radius:7px; text-decoration:none; color:${safeFontColor};">
        <img src="/calendar-ics.png" alt="" aria-hidden="true" style="${iconStyle}" />
      </a>
      <a href="${gUrl}" target="_blank" rel="noopener noreferrer" aria-label="${addToGoogleCalendarLabel}" ${addToGoogleCalendarTooltipAttributes} class="tw-text-iron-300 tw-transition-colors desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400" style="display:inline-flex; min-width:32px; min-height:32px; align-items:center; justify-content:center; border-radius:7px; text-decoration:none; color:${safeFontColor};">
        <img src="/calendar-google.png" alt="" aria-hidden="true" style="${iconStyle}" />
      </a>
    </div>`;
}
