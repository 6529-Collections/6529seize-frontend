const QR_SCANNER_MESSAGE_KEYS = [
  "qrScanner.instructions",
  "qrScanner.error.scanFailed",
  "qrScanner.error.fallbackGuidance",
  "qrScanner.invalidCode",
  "qrScanner.sidebar.ariaLabel",
  "qrScanner.sidebar.label",
  "qrScanner.trigger.ariaLabel",
  "qrScanner.trigger.title",
  "qrScanner.iconAlt",
] as const;

type QRScannerMessageKey = (typeof QR_SCANNER_MESSAGE_KEYS)[number];

type QRScannerMessageValues = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const buildQRScannerMessages = (
  values: QRScannerMessageValues
): Record<QRScannerMessageKey, string> =>
  Object.fromEntries(
    QR_SCANNER_MESSAGE_KEYS.map((key, index) => [key, values[index]])
  ) as Record<QRScannerMessageKey, string>;

export const QR_SCANNER_MESSAGES = buildQRScannerMessages([
  "Point your camera at a valid QR code on 6529.io",
  "Scan failed.",
  "Make sure you're using the latest version of the 6529 Mobile app and that camera access is enabled in your device settings.",
  "This QR code is not valid.",
  "Scan QR Code",
  "Scan QR Code",
  "QR Code Scanner",
  "QR Code Scanner",
  "QR Scanner",
]);

export const EN_GB_QR_SCANNER_MESSAGES = buildQRScannerMessages([
  "Point your camera at a valid QR code on 6529.io",
  "Scan failed.",
  "Make sure you're using the latest version of the 6529 Mobile app and that camera access is enabled in your device settings.",
  "This QR code is not valid.",
  "Scan QR Code",
  "Scan QR Code",
  "QR Code Scanner",
  "QR Code Scanner",
  "QR Scanner",
]);

export const FR_FR_QR_SCANNER_MESSAGES = buildQRScannerMessages([
  "Pointez votre camera vers un QR code valide sur 6529.io",
  "Echec du scan.",
  "Assurez-vous d'utiliser la derniere version de l'app mobile 6529 et que l'acces a la camera est active dans les reglages de votre appareil.",
  "Ce QR code n'est pas valide.",
  "Scanner un QR code",
  "Scanner un QR code",
  "Scanner de QR code",
  "Scanner de QR code",
  "Scanner QR",
]);

export const ES_ES_QR_SCANNER_MESSAGES = buildQRScannerMessages([
  "Apunta la camara a un codigo QR valido en 6529.io",
  "El escaneo fallo.",
  "Asegurate de usar la ultima version de la app movil de 6529 y de que el acceso a la camara este activado en los ajustes del dispositivo.",
  "Este codigo QR no es valido.",
  "Escanear codigo QR",
  "Escanear codigo QR",
  "Escaner de codigo QR",
  "Escaner de codigo QR",
  "Escaner QR",
]);

export const DE_DE_QR_SCANNER_MESSAGES = buildQRScannerMessages([
  "Richte deine Kamera auf einen gueltigen QR-Code auf 6529.io",
  "Scan fehlgeschlagen.",
  "Stelle sicher, dass du die neueste Version der mobilen 6529-App verwendest und dass der Kamerazugriff in den Geraeteeinstellungen aktiviert ist.",
  "Dieser QR-Code ist nicht gueltig.",
  "QR-Code scannen",
  "QR-Code scannen",
  "QR-Code-Scanner",
  "QR-Code-Scanner",
  "QR-Scanner",
]);
