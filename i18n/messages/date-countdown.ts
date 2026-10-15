type DateCountdownMessageName =
  | "days.one"
  | "days.other"
  | "hours.one"
  | "hours.other"
  | "minutes.one"
  | "minutes.other"
  | "seconds.one"
  | "seconds.other"
  | "timeLeft.seconds"
  | "timeLeft.minutesSeconds"
  | "timeLeft.hoursSeconds"
  | "timeLeft.hoursMinutesSeconds"
  | "timeLeft.daysSeconds"
  | "timeLeft.daysMinutesSeconds"
  | "timeLeft.daysHoursSeconds"
  | "timeLeft.daysHoursMinutesSeconds";

type DateCountdownMessageKey = `dateCountdown.${DateCountdownMessageName}`;
type DateCountdownLocaleIndex = 0 | 1 | 2 | 3 | 4;
type DateCountdownTranslations = readonly [
  enUS: string,
  enGB: string,
  frFR: string,
  esES: string,
  deDE: string,
];

const sameInEveryLocale = (value: string): DateCountdownTranslations => [
  value,
  value,
  value,
  value,
  value,
];

// Units are chosen with the locale's plural rules, so every supported locale
// carries its own forms. The time-left sentences list only the units shown;
// minutes and seconds are joined with "and", larger units with commas.
const DATE_COUNTDOWN_MESSAGE_VALUES = {
  "days.one": [
    "{count} day",
    "{count} day",
    "{count} jour",
    "{count} día",
    "{count} Tag",
  ],
  "days.other": [
    "{count} days",
    "{count} days",
    "{count} jours",
    "{count} días",
    "{count} Tage",
  ],
  "hours.one": [
    "{count} hour",
    "{count} hour",
    "{count} heure",
    "{count} hora",
    "{count} Stunde",
  ],
  "hours.other": [
    "{count} hours",
    "{count} hours",
    "{count} heures",
    "{count} horas",
    "{count} Stunden",
  ],
  "minutes.one": [
    "{count} minute",
    "{count} minute",
    "{count} minute",
    "{count} minuto",
    "{count} Minute",
  ],
  "minutes.other": [
    "{count} minutes",
    "{count} minutes",
    "{count} minutes",
    "{count} minutos",
    "{count} Minuten",
  ],
  "seconds.one": [
    "{count} second",
    "{count} second",
    "{count} seconde",
    "{count} segundo",
    "{count} Sekunde",
  ],
  "seconds.other": [
    "{count} seconds",
    "{count} seconds",
    "{count} secondes",
    "{count} segundos",
    "{count} Sekunden",
  ],
  "timeLeft.seconds": sameInEveryLocale("{seconds}"),
  "timeLeft.minutesSeconds": [
    "{minutes} and {seconds}",
    "{minutes} and {seconds}",
    "{minutes} et {seconds}",
    "{minutes} y {seconds}",
    "{minutes} und {seconds}",
  ],
  "timeLeft.hoursSeconds": sameInEveryLocale("{hours}, {seconds}"),
  "timeLeft.hoursMinutesSeconds": [
    "{hours}, {minutes} and {seconds}",
    "{hours}, {minutes} and {seconds}",
    "{hours}, {minutes} et {seconds}",
    "{hours}, {minutes} y {seconds}",
    "{hours}, {minutes} und {seconds}",
  ],
  "timeLeft.daysSeconds": sameInEveryLocale("{days}, {seconds}"),
  "timeLeft.daysMinutesSeconds": [
    "{days}, {minutes} and {seconds}",
    "{days}, {minutes} and {seconds}",
    "{days}, {minutes} et {seconds}",
    "{days}, {minutes} y {seconds}",
    "{days}, {minutes} und {seconds}",
  ],
  "timeLeft.daysHoursSeconds": sameInEveryLocale("{days}, {hours}, {seconds}"),
  "timeLeft.daysHoursMinutesSeconds": [
    "{days}, {hours}, {minutes} and {seconds}",
    "{days}, {hours}, {minutes} and {seconds}",
    "{days}, {hours}, {minutes} et {seconds}",
    "{days}, {hours}, {minutes} y {seconds}",
    "{days}, {hours}, {minutes} und {seconds}",
  ],
} satisfies Record<DateCountdownMessageName, DateCountdownTranslations>;

function buildDateCountdownMessages(
  localeIndex: DateCountdownLocaleIndex
): Record<DateCountdownMessageKey, string> {
  return Object.fromEntries(
    Object.entries(DATE_COUNTDOWN_MESSAGE_VALUES).map(([name, values]) => [
      `dateCountdown.${name}`,
      values[localeIndex],
    ])
  ) as Record<DateCountdownMessageKey, string>;
}

export const EN_US_DATE_COUNTDOWN_MESSAGES = buildDateCountdownMessages(0);
export const EN_GB_DATE_COUNTDOWN_MESSAGES = buildDateCountdownMessages(1);
export const FR_FR_DATE_COUNTDOWN_MESSAGES = buildDateCountdownMessages(2);
export const ES_ES_DATE_COUNTDOWN_MESSAGES = buildDateCountdownMessages(3);
export const DE_DE_DATE_COUNTDOWN_MESSAGES = buildDateCountdownMessages(4);
