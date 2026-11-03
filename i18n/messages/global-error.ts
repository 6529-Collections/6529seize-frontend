// Copy for app/global-error.tsx, which replaces the root layout and therefore
// renders without any provider. The en-US strings intentionally match
// components/error/Error.tsx (heading, title, retry) because the device-farm
// smoke and Playwright route readiness helpers recognise them. en-GB has its own
// partial dictionary that omits these keys, so t() falls back to this en-US
// copy, which is identical.
export const GLOBAL_ERROR_MESSAGES = {
  "globalError.documentTitle": "6529 Error",
  "globalError.title": "Welcome to the 6529 Page of Doom",
  "globalError.description":
    "Looks like something went wrong. Try again or reach out to us at {email}.",
  "globalError.retry": "Try Again",
  "globalError.home": "Go to the 6529 home page",
  "globalError.detailsSummary": "Error details",
  "globalError.errorId": "Error ID: {digest}",
} as const;

type GlobalErrorMessageKey = keyof typeof GLOBAL_ERROR_MESSAGES;

export const FR_FR_GLOBAL_ERROR_MESSAGES = {
  "globalError.documentTitle": "6529 Erreur",
  "globalError.title": "Bienvenue sur la Page de la Fatalité de 6529",
  "globalError.description":
    "Il semble que quelque chose ait mal tourné. Réessayez ou contactez-nous à {email}.",
  "globalError.retry": "Réessayer",
  "globalError.home": "Aller à la page d’accueil de 6529",
  "globalError.detailsSummary": "Détails de l’erreur",
  "globalError.errorId": "ID de l’erreur : {digest}",
} as const satisfies Record<GlobalErrorMessageKey, string>;

export const ES_ES_GLOBAL_ERROR_MESSAGES = {
  "globalError.documentTitle": "6529 Error",
  "globalError.title":
    "Te damos la bienvenida a la Página del Desastre de 6529",
  "globalError.description":
    "Parece que algo salió mal. Inténtalo de nuevo o escríbenos a {email}.",
  "globalError.retry": "Reintentar",
  "globalError.home": "Ir a la página de inicio de 6529",
  "globalError.detailsSummary": "Detalles del error",
  "globalError.errorId": "ID del error: {digest}",
} as const satisfies Record<GlobalErrorMessageKey, string>;

export const DE_DE_GLOBAL_ERROR_MESSAGES = {
  "globalError.documentTitle": "6529 Fehler",
  "globalError.title": "Willkommen auf der 6529-Seite des Verderbens",
  "globalError.description":
    "Etwas ist schiefgelaufen. Versuche es erneut oder schreib uns an {email}.",
  "globalError.retry": "Erneut versuchen",
  "globalError.home": "Zur 6529-Startseite",
  "globalError.detailsSummary": "Fehlerdetails",
  "globalError.errorId": "Fehler-ID: {digest}",
} as const satisfies Record<GlobalErrorMessageKey, string>;
