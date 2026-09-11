const THE_MEMES_COLLECTORS_MESSAGE_KEYS = [
  "leaderboardTitle",
  "downloadCsv",
  "downloadingCsv",
  "downloadCsvAriaLabel",
  "downloadCsvError",
  "downloadCsvStatusPreparing",
  "downloadCsvStatusReady",
] as const;

type TheMemesCollectorsMessageKey =
  (typeof THE_MEMES_COLLECTORS_MESSAGE_KEYS)[number];

type TheMemesCollectorsMessageMap = {
  readonly [Key in TheMemesCollectorsMessageKey as `theMemes.detail.collectors.${Key}`]: string;
};

type TheMemesCollectorsMessageValues = readonly [
  leaderboardTitle: string,
  downloadCsv: string,
  downloadingCsv: string,
  downloadCsvAriaLabel: string,
  downloadCsvError: string,
  downloadCsvStatusPreparing: string,
  downloadCsvStatusReady: string,
];

function buildTheMemesCollectorsMessages(
  values: TheMemesCollectorsMessageValues
): TheMemesCollectorsMessageMap {
  return Object.fromEntries(
    THE_MEMES_COLLECTORS_MESSAGE_KEYS.map((key, index) => [
      `theMemes.detail.collectors.${key}`,
      values[index],
    ])
  ) as TheMemesCollectorsMessageMap;
}

export const EN_US_THE_MEMES_COLLECTORS_MESSAGES =
  buildTheMemesCollectorsMessages([
    "Collectors leaderboard",
    "Download CSV",
    "Preparing CSV",
    "Download collectors leaderboard as CSV",
    "Couldn't download collectors CSV. Please try again.",
    "Preparing collectors CSV.",
    "Collectors CSV download ready.",
  ]);

export const DE_DE_THE_MEMES_COLLECTORS_MESSAGES =
  buildTheMemesCollectorsMessages([
    "Sammler-Bestenliste",
    "CSV herunterladen",
    "CSV wird vorbereitet",
    "Sammler-Bestenliste als CSV herunterladen",
    "CSV der Sammler konnte nicht heruntergeladen werden. Bitte erneut versuchen.",
    "CSV der Sammler wird vorbereitet.",
    "CSV-Download der Sammler ist bereit.",
  ]);

export const ES_ES_THE_MEMES_COLLECTORS_MESSAGES =
  buildTheMemesCollectorsMessages([
    "Clasificacion de coleccionistas",
    "Descargar CSV",
    "Preparando CSV",
    "Descargar la clasificacion de coleccionistas como CSV",
    "No se pudo descargar el CSV de coleccionistas. Intentalo de nuevo.",
    "Preparando el CSV de coleccionistas.",
    "La descarga del CSV de coleccionistas esta lista.",
  ]);

export const FR_FR_THE_MEMES_COLLECTORS_MESSAGES =
  buildTheMemesCollectorsMessages([
    "Classement des collectionneurs",
    "Telecharger le CSV",
    "Preparation du CSV",
    "Telecharger le classement des collectionneurs au format CSV",
    "Impossible de telecharger le CSV des collectionneurs. Reessayez.",
    "Preparation du CSV des collectionneurs.",
    "Telechargement du CSV des collectionneurs pret.",
  ]);
