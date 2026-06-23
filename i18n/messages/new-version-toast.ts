import type { MessageKey } from "@/i18n/messages/en-US";

const NEW_VERSION_TOAST_MESSAGE_KEYS = [
  "newVersionToast.refreshAction",
  "newVersionToast.title",
  "newVersionToast.eyebrow",
] as const satisfies readonly MessageKey[];

type NewVersionToastMessageKey =
  (typeof NEW_VERSION_TOAST_MESSAGE_KEYS)[number];

const buildNewVersionToastMessages = (
  values: readonly [string, string, string]
): Record<NewVersionToastMessageKey, string> =>
  Object.fromEntries(
    NEW_VERSION_TOAST_MESSAGE_KEYS.map((key, index) => [key, values[index]])
  ) as Record<NewVersionToastMessageKey, string>;

export const EN_GB_NEW_VERSION_TOAST_MESSAGES = buildNewVersionToastMessages([
  "Refresh page",
  "A new version is available",
  "Yes, again!",
]);

export const FR_FR_NEW_VERSION_TOAST_MESSAGES = buildNewVersionToastMessages([
  "Actualiser la page",
  "Une nouvelle version est disponible",
  "Oui, encore !",
]);

export const ES_ES_NEW_VERSION_TOAST_MESSAGES = buildNewVersionToastMessages([
  "Actualizar la página",
  "Hay una nueva versión disponible",
  "¡Sí, otra vez!",
]);

export const DE_DE_NEW_VERSION_TOAST_MESSAGES = buildNewVersionToastMessages([
  "Seite aktualisieren",
  "Eine neue Version ist verfügbar",
  "Ja, schon wieder!",
]);
