const WALLET_STARTUP_MESSAGE_KEYS = [
  "wallet.startup.loadingStatus",
  "wallet.startup.errorStatus",
  "wallet.startup.errorDescription",
  "wallet.startup.refresh",
  "wallet.startup.loadFailedToast",
  "wallet.startup.loadingToast",
  "wallet.startup.pendingError",
] as const;

type WalletStartupMessageKey = (typeof WALLET_STARTUP_MESSAGE_KEYS)[number];
type WalletStartupMessages = Record<WalletStartupMessageKey, string>;
type WalletStartupMessageValues = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const buildWalletStartupMessages = (
  values: WalletStartupMessageValues
): WalletStartupMessages =>
  Object.fromEntries(
    WALLET_STARTUP_MESSAGE_KEYS.map((key, index) => [key, values[index]])
  ) as WalletStartupMessages;

export const EN_US_WALLET_STARTUP_MESSAGES = buildWalletStartupMessages([
  "Loading wallet services",
  "Wallet services failed to load",
  "Refresh to try loading wallet services again.",
  "Refresh",
  "Wallet services failed to load. Please refresh the page.",
  "Wallet services are still loading. Please try again.",
  "Wallet services are still loading.",
]);

export const EN_GB_WALLET_STARTUP_MESSAGES =
  EN_US_WALLET_STARTUP_MESSAGES;

export const FR_FR_WALLET_STARTUP_MESSAGES = buildWalletStartupMessages([
  "Chargement des services de portefeuille",
  "Les services de portefeuille n'ont pas pu se charger",
  "Actualisez la page pour relancer les services de portefeuille.",
  "Actualiser",
  "Les services de portefeuille n'ont pas pu se charger. Actualisez la page.",
  "Les services de portefeuille sont encore en cours de chargement. Reessayez.",
  "Les services de portefeuille sont encore en cours de chargement.",
]);

export const ES_ES_WALLET_STARTUP_MESSAGES = buildWalletStartupMessages([
  "Cargando servicios de monedero",
  "No se pudieron cargar los servicios de monedero",
  "Actualiza para intentar cargar de nuevo los servicios de monedero.",
  "Actualizar",
  "No se pudieron cargar los servicios de monedero. Actualiza la pagina.",
  "Los servicios de monedero aun se estan cargando. Intentalo de nuevo.",
  "Los servicios de monedero aun se estan cargando.",
]);

export const DE_DE_WALLET_STARTUP_MESSAGES = buildWalletStartupMessages([
  "Wallet-Dienste werden geladen",
  "Wallet-Dienste konnten nicht geladen werden",
  "Aktualisiere die Seite, um die Wallet-Dienste erneut zu laden.",
  "Aktualisieren",
  "Wallet-Dienste konnten nicht geladen werden. Bitte aktualisiere die Seite.",
  "Wallet-Dienste werden noch geladen. Bitte versuche es erneut.",
  "Wallet-Dienste werden noch geladen.",
]);
