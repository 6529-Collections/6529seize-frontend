const CAPACITOR_CONNECT_MESSAGE_KEYS = [
  "capacitorConnect.title",
  "capacitorConnect.appWallets",
  "capacitorConnect.externalWallets",
  "capacitorConnect.scanConnectionQr",
  "capacitorConnect.appWallets.description",
  "capacitorConnect.appWallets.create",
  "capacitorConnect.appWallets.import",
  "capacitorConnect.appWallets.viewAll",
  "capacitorConnect.appWallets.empty",
  "capacitorConnect.appWallets.loading",
  "capacitorConnect.appWallets.unavailable",
  "capacitorConnect.appWallets.connectAriaLabel",
  "capacitorConnect.connectionQr.instructions",
  "capacitorConnect.connectionQr.invalid",
  "capacitorConnect.error.connectionFailed",
  "capacitorConnect.error.navigationFailed",
] as const;

type CapacitorConnectMessageKey =
  (typeof CAPACITOR_CONNECT_MESSAGE_KEYS)[number];

type CapacitorConnectMessageValues = readonly string[] & {
  readonly length: typeof CAPACITOR_CONNECT_MESSAGE_KEYS.length;
};

const buildCapacitorConnectMessages = (
  values: CapacitorConnectMessageValues
): Record<CapacitorConnectMessageKey, string> =>
  Object.fromEntries(
    CAPACITOR_CONNECT_MESSAGE_KEYS.map((key, index) => [key, values[index]])
  ) as Record<CapacitorConnectMessageKey, string>;

export const CAPACITOR_CONNECT_MESSAGES = buildCapacitorConnectMessages([
  "Connect",
  "App Wallets",
  "External Wallets",
  "Scan Connection QR",
  "App Wallets are encrypted and stored securely on this device. Choose one to connect, create, or import.",
  "Create Wallet",
  "Import Wallet",
  "View All App Wallets",
  "No App Wallets yet.",
  "Loading App Wallets…",
  "App Wallets are unavailable on this device.",
  "Connect with {walletName}, wallet {shortAddress}",
  "Scan a 6529 connection QR code",
  "This isn't a valid 6529 connection QR code.",
  "Wallet connection failed. Please try again.",
  "Unable to open the shared connection. Please try again.",
]);

export const FR_FR_CAPACITOR_CONNECT_MESSAGES = buildCapacitorConnectMessages([
  "Connexion",
  "Portefeuilles de l'app",
  "Portefeuilles externes",
  "Scanner le QR de connexion",
  "Ces portefeuilles sont chiffrés et stockés sur cet appareil. Choisissez-en un, créez-en un ou importez-en un.",
  "Créer un portefeuille",
  "Importer un portefeuille",
  "Voir tous les portefeuilles de l'app",
  "Aucun portefeuille de l'app.",
  "Chargement des portefeuilles…",
  "Les portefeuilles de l'app ne sont pas disponibles sur cet appareil.",
  "Se connecter avec {walletName}, portefeuille {shortAddress}",
  "Scannez un QR code de connexion 6529",
  "Ce QR code de connexion 6529 n'est pas valide.",
  "La connexion au portefeuille a échoué. Veuillez réessayer.",
  "Impossible d'ouvrir la connexion partagée. Veuillez réessayer.",
]);

export const ES_ES_CAPACITOR_CONNECT_MESSAGES = buildCapacitorConnectMessages([
  "Conectar",
  "Billeteras de la app",
  "Billeteras externas",
  "Escanear QR de conexión",
  "Estas billeteras están cifradas y se guardan en este dispositivo. Elige una, crea una nueva o importa una.",
  "Crear billetera",
  "Importar billetera",
  "Ver todas las billeteras de la app",
  "Aún no hay billeteras de la app.",
  "Cargando billeteras…",
  "Las billeteras de la app no están disponibles en este dispositivo.",
  "Conectar con {walletName}, billetera {shortAddress}",
  "Escanea un código QR de conexión de 6529",
  "Este código QR de conexión de 6529 no es válido.",
  "La conexión con la billetera falló. Inténtalo de nuevo.",
  "No se pudo abrir la conexión compartida. Inténtalo de nuevo.",
]);

export const DE_DE_CAPACITOR_CONNECT_MESSAGES = buildCapacitorConnectMessages([
  "Verbinden",
  "App-Wallets",
  "Externe Wallets",
  "Verbindungs-QR scannen",
  "Diese Wallets sind verschlüsselt und auf diesem Gerät gespeichert. Wähle eine aus, erstelle eine neue oder importiere eine.",
  "Wallet erstellen",
  "Wallet importieren",
  "Alle App-Wallets anzeigen",
  "Noch keine App-Wallets vorhanden.",
  "App-Wallets werden geladen…",
  "App-Wallets sind auf diesem Gerät nicht verfügbar.",
  "Mit {walletName} ({shortAddress}) verbinden",
  "Scanne einen 6529-Verbindungs-QR-Code",
  "Dies ist kein gültiger 6529-Verbindungs-QR-Code.",
  "Die Wallet-Verbindung ist fehlgeschlagen. Bitte versuche es erneut.",
  "Die geteilte Verbindung konnte nicht geöffnet werden. Bitte versuche es erneut.",
]);
