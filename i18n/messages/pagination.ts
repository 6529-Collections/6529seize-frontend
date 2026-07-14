type PaginationMessageName =
  | "currentOfTotal"
  | "goToLastPage"
  | "next"
  | "nextPage"
  | "pageNumber"
  | "pageOf"
  | "previous"
  | "previousPage";

type PaginationMessageKey = `common.pagination.${PaginationMessageName}`;
type PaginationLocaleIndex = 0 | 1 | 2 | 3 | 4;
type PaginationTranslations = readonly [
  enUS: string,
  enGB: string,
  frFR: string,
  esES: string,
  deDE: string,
];

const PAGINATION_MESSAGE_VALUES = {
  currentOfTotal: [
    "{current} of {total}",
    "{current} of {total}",
    "{current} sur {total}",
    "{current} de {total}",
    "{current} von {total}",
  ],
  goToLastPage: [
    "Go to last page",
    "Go to last page",
    "Aller à la dernière page",
    "Ir a la última página",
    "Zur letzten Seite",
  ],
  next: ["Next", "Next", "Suivant", "Siguiente", "Weiter"],
  nextPage: [
    "Next page",
    "Next page",
    "Page suivante",
    "Página siguiente",
    "Nächste Seite",
  ],
  pageNumber: [
    "Page number",
    "Page number",
    "Numéro de page",
    "Número de página",
    "Seitenzahl",
  ],
  pageOf: [
    "Page {current} of {total}",
    "Page {current} of {total}",
    "Page {current} sur {total}",
    "Página {current} de {total}",
    "Seite {current} von {total}",
  ],
  previous: ["Previous", "Previous", "Précédent", "Anterior", "Zurück"],
  previousPage: [
    "Previous page",
    "Previous page",
    "Page précédente",
    "Página anterior",
    "Vorherige Seite",
  ],
} satisfies Record<PaginationMessageName, PaginationTranslations>;

function buildPaginationMessages(
  localeIndex: PaginationLocaleIndex
): Record<PaginationMessageKey, string> {
  return {
    "common.pagination.currentOfTotal":
      PAGINATION_MESSAGE_VALUES.currentOfTotal[localeIndex],
    "common.pagination.goToLastPage":
      PAGINATION_MESSAGE_VALUES.goToLastPage[localeIndex],
    "common.pagination.next": PAGINATION_MESSAGE_VALUES.next[localeIndex],
    "common.pagination.nextPage":
      PAGINATION_MESSAGE_VALUES.nextPage[localeIndex],
    "common.pagination.pageNumber":
      PAGINATION_MESSAGE_VALUES.pageNumber[localeIndex],
    "common.pagination.pageOf": PAGINATION_MESSAGE_VALUES.pageOf[localeIndex],
    "common.pagination.previous":
      PAGINATION_MESSAGE_VALUES.previous[localeIndex],
    "common.pagination.previousPage":
      PAGINATION_MESSAGE_VALUES.previousPage[localeIndex],
  };
}

export const EN_US_PAGINATION_MESSAGES = buildPaginationMessages(0);
export const EN_GB_PAGINATION_MESSAGES = buildPaginationMessages(1);
export const FR_FR_PAGINATION_MESSAGES = buildPaginationMessages(2);
export const ES_ES_PAGINATION_MESSAGES = buildPaginationMessages(3);
export const DE_DE_PAGINATION_MESSAGES = buildPaginationMessages(4);
