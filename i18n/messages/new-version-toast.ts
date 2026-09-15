import type { MessageKey } from "@/i18n/messages/en-US";

export const VERSION_RELOAD_MESSAGES = {
  "en-US": "Updating to the latest version",
  "en-GB": "Updating to the latest version",
  "fr-FR": "Mise à jour vers la dernière version",
  "es-ES": "Actualizando a la última versión",
  "de-DE": "Aktualisierung auf die neueste Version",
} as const;

const NEW_VERSION_TOAST_MESSAGE_KEYS = [
  "newVersionToast.refreshAction",
  "newVersionToast.title",
  "newVersionToast.eyebrow",
  "newVersionToast.update",
  "newVersionToast.updateAction",
] as const satisfies readonly MessageKey[];

type NewVersionToastMessageKey =
  (typeof NEW_VERSION_TOAST_MESSAGE_KEYS)[number];

const buildNewVersionToastMessages = (
  values: readonly [string, string, string, string, string]
): Record<NewVersionToastMessageKey, string> =>
  Object.fromEntries(
    NEW_VERSION_TOAST_MESSAGE_KEYS.map((key, index) => [key, values[index]])
  ) as Record<NewVersionToastMessageKey, string>;

export const EN_GB_NEW_VERSION_TOAST_MESSAGES = buildNewVersionToastMessages([
  "Refresh page",
  "A new version is available",
  "Yes, again!",
  "Update",
  "Update to the new version",
]);

export const FR_FR_NEW_VERSION_TOAST_MESSAGES = buildNewVersionToastMessages([
  "Actualiser la page",
  "Une nouvelle version est disponible",
  "Oui, encore !",
  "Mettre à jour",
  "Mettre à jour vers la nouvelle version",
]);

export const ES_ES_NEW_VERSION_TOAST_MESSAGES = buildNewVersionToastMessages([
  "Actualizar la página",
  "Hay una nueva versión disponible",
  "¡Sí, otra vez!",
  "Actualizar",
  "Actualizar a la nueva versión",
]);

export const DE_DE_NEW_VERSION_TOAST_MESSAGES = buildNewVersionToastMessages([
  "Seite aktualisieren",
  "Eine neue Version ist verfügbar",
  "Ja, schon wieder!",
  "Aktualisieren",
  "Auf die neue Version aktualisieren",
]);
