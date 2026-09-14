export const THE_MEMES_MINT_PROGRESS_MESSAGES = {
  "theMemes.mint.transaction.walletTitle": "Confirm in your wallet",
  "theMemes.mint.transaction.walletDescription":
    "Review the mint details and network fee before confirming.",
  "theMemes.mint.transaction.walletHelp": "Wallet not showing?",
  "theMemes.mint.transaction.walletHelpDescription":
    "Open your wallet app or browser extension to find the request. To stop, reject it in your wallet.",
  "theMemes.mint.transaction.submittedTitle": "Mint submitted",
  "theMemes.mint.transaction.submittedDescription":
    "Waiting for network confirmation.",
  "theMemes.mint.transaction.submittedHint":
    "This window updates automatically.",
  "theMemes.mint.transaction.recipientPending": "Recipient",
} as const;

type MintProgressMessages = Record<
  keyof typeof THE_MEMES_MINT_PROGRESS_MESSAGES,
  string
>;

export const FR_FR_THE_MEMES_MINT_PROGRESS_MESSAGES = {
  "theMemes.mint.transaction.walletTitle": "Confirmez dans votre portefeuille",
  "theMemes.mint.transaction.walletDescription":
    "Vérifiez les détails du mint et les frais de réseau avant de confirmer.",
  "theMemes.mint.transaction.walletHelp": "Le portefeuille ne s’affiche pas ?",
  "theMemes.mint.transaction.walletHelpDescription":
    "Ouvrez votre application de portefeuille ou votre extension de navigateur pour trouver la demande. Pour arrêter, rejetez-la dans votre portefeuille.",
  "theMemes.mint.transaction.submittedTitle": "Mint envoyé",
  "theMemes.mint.transaction.submittedDescription":
    "En attente de confirmation du réseau.",
  "theMemes.mint.transaction.submittedHint":
    "Cette fenêtre se met à jour automatiquement.",
  "theMemes.mint.transaction.recipientPending": "Destinataire",
} as const satisfies MintProgressMessages;

export const ES_ES_THE_MEMES_MINT_PROGRESS_MESSAGES = {
  "theMemes.mint.transaction.walletTitle": "Confirma en tu cartera",
  "theMemes.mint.transaction.walletDescription":
    "Revisa los detalles de la acuñación y la comisión de red antes de confirmar.",
  "theMemes.mint.transaction.walletHelp": "¿No aparece tu cartera?",
  "theMemes.mint.transaction.walletHelpDescription":
    "Abre la aplicación de tu cartera o la extensión del navegador para encontrar la solicitud. Para detenerla, recházala en tu cartera.",
  "theMemes.mint.transaction.submittedTitle": "Acuñación enviada",
  "theMemes.mint.transaction.submittedDescription":
    "Esperando la confirmación de la red.",
  "theMemes.mint.transaction.submittedHint":
    "Esta ventana se actualiza automáticamente.",
  "theMemes.mint.transaction.recipientPending": "Destinatario",
} as const satisfies MintProgressMessages;

export const DE_DE_THE_MEMES_MINT_PROGRESS_MESSAGES = {
  "theMemes.mint.transaction.walletTitle": "In deiner Wallet bestätigen",
  "theMemes.mint.transaction.walletDescription":
    "Prüfe die Mint-Details und die Netzwerkgebühr, bevor du bestätigst.",
  "theMemes.mint.transaction.walletHelp": "Deine Wallet wird nicht angezeigt?",
  "theMemes.mint.transaction.walletHelpDescription":
    "Öffne deine Wallet-App oder Browser-Erweiterung, um die Anfrage zu finden. Um abzubrechen, lehne sie in deiner Wallet ab.",
  "theMemes.mint.transaction.submittedTitle": "Mint gesendet",
  "theMemes.mint.transaction.submittedDescription":
    "Warten auf die Bestätigung durch das Netzwerk.",
  "theMemes.mint.transaction.submittedHint":
    "Dieses Fenster aktualisiert sich automatisch.",
  "theMemes.mint.transaction.recipientPending": "Empfänger",
} as const satisfies MintProgressMessages;
