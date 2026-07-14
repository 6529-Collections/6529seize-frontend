const PAGINATION_MESSAGE_KEYS = [
  "common.pagination.currentOfTotal",
  "common.pagination.goToLastPage",
  "common.pagination.next",
  "common.pagination.nextPage",
  "common.pagination.pageNumber",
  "common.pagination.pageOf",
  "common.pagination.previous",
  "common.pagination.previousPage",
] as const;

type PaginationMessageKey = (typeof PAGINATION_MESSAGE_KEYS)[number];
type PaginationMessageValues = readonly [
  currentOfTotal: string,
  goToLastPage: string,
  next: string,
  nextPage: string,
  pageNumber: string,
  pageOf: string,
  previous: string,
  previousPage: string,
];

function buildPaginationMessages(
  values: PaginationMessageValues
): Record<PaginationMessageKey, string> {
  return Object.fromEntries(
    PAGINATION_MESSAGE_KEYS.map((key, index) => [key, values[index]])
  ) as Record<PaginationMessageKey, string>;
}

export const EN_US_PAGINATION_MESSAGES = buildPaginationMessages([
  "{current} of {total}",
  "Go to last page",
  "Next",
  "Next page",
  "Page number",
  "Page {current} of {total}",
  "Previous",
  "Previous page",
]);

export const EN_GB_PAGINATION_MESSAGES = buildPaginationMessages([
  "{current} of {total}",
  "Go to last page",
  "Next",
  "Next page",
  "Page number",
  "Page {current} of {total}",
  "Previous",
  "Previous page",
]);

export const FR_FR_PAGINATION_MESSAGES = buildPaginationMessages([
  "{current} sur {total}",
  "Aller à la dernière page",
  "Suivant",
  "Page suivante",
  "Numéro de page",
  "Page {current} sur {total}",
  "Précédent",
  "Page précédente",
]);

export const ES_ES_PAGINATION_MESSAGES = buildPaginationMessages([
  "{current} de {total}",
  "Ir a la última página",
  "Siguiente",
  "Página siguiente",
  "Número de página",
  "Página {current} de {total}",
  "Anterior",
  "Página anterior",
]);

export const DE_DE_PAGINATION_MESSAGES = buildPaginationMessages([
  "{current} von {total}",
  "Zur letzten Seite",
  "Weiter",
  "Nächste Seite",
  "Seitenzahl",
  "Seite {current} von {total}",
  "Zurück",
  "Vorherige Seite",
]);
