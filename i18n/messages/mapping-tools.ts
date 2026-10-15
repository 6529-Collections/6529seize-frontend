// Copy for the delegation and consolidation mapping tool pages: the status
// messages shown when their remote data or the uploaded CSV cannot be loaded.
export const MAPPING_TOOL_MESSAGES = {
  "mappingTools.instructions.loadFailed":
    "The instructions could not be loaded. Please try again later.",
  "mappingTools.error.dataLoadFailed":
    "The data needed to map your file could not be loaded. Please try again.",
  "mappingTools.error.fileReadFailed":
    "Your CSV file could not be read. Check the file and try again.",
} as const;

type MappingToolMessageKey = keyof typeof MAPPING_TOOL_MESSAGES;

export const FR_FR_MAPPING_TOOL_MESSAGES = {
  "mappingTools.instructions.loadFailed":
    "Les instructions n’ont pas pu être chargées. Réessayez plus tard.",
  "mappingTools.error.dataLoadFailed":
    "Les données nécessaires au mappage de votre fichier n’ont pas pu être chargées. Réessayez.",
  "mappingTools.error.fileReadFailed":
    "Votre fichier CSV n’a pas pu être lu. Vérifiez le fichier, puis réessayez.",
} as const satisfies Record<MappingToolMessageKey, string>;

export const ES_ES_MAPPING_TOOL_MESSAGES = {
  "mappingTools.instructions.loadFailed":
    "No se pudieron cargar las instrucciones. Inténtalo de nuevo más tarde.",
  "mappingTools.error.dataLoadFailed":
    "No se pudieron cargar los datos necesarios para mapear tu archivo. Inténtalo de nuevo.",
  "mappingTools.error.fileReadFailed":
    "No se pudo leer tu archivo CSV. Revisa el archivo e inténtalo de nuevo.",
} as const satisfies Record<MappingToolMessageKey, string>;

export const DE_DE_MAPPING_TOOL_MESSAGES = {
  "mappingTools.instructions.loadFailed":
    "Die Anleitung konnte nicht geladen werden. Versuche es später erneut.",
  "mappingTools.error.dataLoadFailed":
    "Die zum Zuordnen deiner Datei benötigten Daten konnten nicht geladen werden. Versuche es erneut.",
  "mappingTools.error.fileReadFailed":
    "Deine CSV-Datei konnte nicht gelesen werden. Prüfe die Datei und versuche es erneut.",
} as const satisfies Record<MappingToolMessageKey, string>;
