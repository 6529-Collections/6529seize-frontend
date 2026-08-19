const CAPACITOR_CONNECT_MESSAGE_KEYS = [
  "capacitorConnect.title",
  "capacitorConnect.appWallets",
  "capacitorConnect.externalWallets",
  "capacitorConnect.scanConnectionQr",
  "capacitorConnect.appWallets.description",
  "capacitorConnect.appWallets.create",
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
  "App Wallets are encrypted wallets stored securely on this device. Choose one to connect, or create a new one.",
  "Create App Wallet",
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
  "Les portefeuilles de l'app sont des portefeuilles chiffres stockes de maniere securisee sur cet appareil. Choisissez-en un ou creez-en un nouveau.",
  "Creer un portefeuille de l'app",
  "Aucun portefeuille de l'app.",
  "Chargement des portefeuilles…",
  "Les portefeuilles de l'app ne sont pas disponibles sur cet appareil.",
  "Se connecter avec {walletName}, portefeuille {shortAddress}",
  "Scannez un QR code de connexion 6529",
  "Ce QR code de connexion 6529 n'est pas valide.",
  "La connexion au portefeuille a echoue. Veuillez reessayer.",
  "Impossible d'ouvrir la connexion partagee. Veuillez reessayer.",
]);

export const ES_ES_CAPACITOR_CONNECT_MESSAGES = buildCapacitorConnectMessages([
  "Conectar",
  "Billeteras de la app",
  "Billeteras externas",
  "Escanear QR de conexion",
  "Las billeteras de la app estan cifradas y se guardan de forma segura en este dispositivo. Elige una o crea una nueva.",
  "Crear billetera de la app",
  "Aun no hay billeteras de la app.",
  "Cargando billeteras…",
  "Las billeteras de la app no estan disponibles en este dispositivo.",
  "Conectar con {walletName}, billetera {shortAddress}",
  "Escanea un codigo QR de conexion de 6529",
  "Este codigo QR de conexion de 6529 no es valido.",
  "La conexion con la billetera fallo. Intentalo de nuevo.",
  "No se pudo abrir la conexion compartida. Intentalo de nuevo.",
]);

export const DE_DE_CAPACITOR_CONNECT_MESSAGES = buildCapacitorConnectMessages([
  "Verbinden",
  "App-Wallets",
  "Externe Wallets",
  "Verbindungs-QR scannen",
  "App-Wallets sind verschluesselte Wallets, die sicher auf diesem Geraet gespeichert sind. Waehle eine aus oder erstelle eine neue.",
  "App-Wallet erstellen",
  "Noch keine App-Wallets vorhanden.",
  "App-Wallets werden geladen…",
  "App-Wallets sind auf diesem Geraet nicht verfuegbar.",
  "Mit {walletName}, Wallet {shortAddress}, verbinden",
  "Scanne einen 6529-Verbindungs-QR-Code",
  "Dies ist kein gueltiger 6529-Verbindungs-QR-Code.",
  "Die Wallet-Verbindung ist fehlgeschlagen. Bitte versuche es erneut.",
  "Die geteilte Verbindung konnte nicht geoeffnet werden. Bitte versuche es erneut.",
]);
