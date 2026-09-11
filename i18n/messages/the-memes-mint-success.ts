const COLLECTION_NAME = "The Memes";
const COLLECTION_WITH_TOKEN_ID = "The Memes #{tokenId}";

export const THE_MEMES_MINT_SUCCESS_MESSAGES = {
  "theMemes.mint.transaction.successDescription": "Your mint is confirmed.",
  "theMemes.mint.transaction.quantity": "Quantity",
  "theMemes.mint.transaction.recipient": "Minted to",
  "theMemes.mint.transaction.done": "Done",
  "theMemes.mint.transaction.viewTransaction": "View transaction",
  "theMemes.mint.transaction.opensNewTab": "Opens in a new tab",
  "theMemes.mint.transaction.artworkFallback": "Artwork preview unavailable",
  "theMemes.mint.transaction.genericArtwork": "Minted artwork",
  "theMemes.mint.transaction.collectionWithTokenId": COLLECTION_WITH_TOKEN_ID,
  "theMemes.mint.transaction.collection": COLLECTION_NAME,
  "theMemes.mint.transaction.close": "Close mint confirmation",
} as const;

type MintSuccessMessages = Record<
  keyof typeof THE_MEMES_MINT_SUCCESS_MESSAGES,
  string
>;

export const FR_FR_THE_MEMES_MINT_SUCCESS_MESSAGES = {
  "theMemes.mint.transaction.successDescription": "Votre mint est confirmé.",
  "theMemes.mint.transaction.quantity": "Quantité",
  "theMemes.mint.transaction.recipient": "Minté pour",
  "theMemes.mint.transaction.done": "Terminé",
  "theMemes.mint.transaction.viewTransaction": "Voir la transaction",
  "theMemes.mint.transaction.opensNewTab": "S’ouvre dans un nouvel onglet",
  "theMemes.mint.transaction.artworkFallback": "Aperçu de l’œuvre indisponible",
  "theMemes.mint.transaction.genericArtwork": "Œuvre mintée",
  "theMemes.mint.transaction.collectionWithTokenId": COLLECTION_WITH_TOKEN_ID,
  "theMemes.mint.transaction.collection": COLLECTION_NAME,
  "theMemes.mint.transaction.close": "Fermer la confirmation du mint",
} as const satisfies MintSuccessMessages;

export const ES_ES_THE_MEMES_MINT_SUCCESS_MESSAGES = {
  "theMemes.mint.transaction.successDescription":
    "Tu acuñación está confirmada.",
  "theMemes.mint.transaction.quantity": "Cantidad",
  "theMemes.mint.transaction.recipient": "Acuñado para",
  "theMemes.mint.transaction.done": "Listo",
  "theMemes.mint.transaction.viewTransaction": "Ver transacción",
  "theMemes.mint.transaction.opensNewTab": "Se abre en una pestaña nueva",
  "theMemes.mint.transaction.artworkFallback":
    "Vista previa de la obra no disponible",
  "theMemes.mint.transaction.genericArtwork": "Obra acuñada",
  "theMemes.mint.transaction.collectionWithTokenId": COLLECTION_WITH_TOKEN_ID,
  "theMemes.mint.transaction.collection": COLLECTION_NAME,
  "theMemes.mint.transaction.close": "Cerrar la confirmación de acuñación",
} as const satisfies MintSuccessMessages;

export const DE_DE_THE_MEMES_MINT_SUCCESS_MESSAGES = {
  "theMemes.mint.transaction.successDescription": "Dein Mint ist bestätigt.",
  "theMemes.mint.transaction.quantity": "Anzahl",
  "theMemes.mint.transaction.recipient": "Geprägt für",
  "theMemes.mint.transaction.done": "Fertig",
  "theMemes.mint.transaction.viewTransaction": "Transaktion ansehen",
  "theMemes.mint.transaction.opensNewTab": "Öffnet in einem neuen Tab",
  "theMemes.mint.transaction.artworkFallback":
    "Kunstwerkvorschau nicht verfügbar",
  "theMemes.mint.transaction.genericArtwork": "Geprägtes Kunstwerk",
  "theMemes.mint.transaction.collectionWithTokenId": COLLECTION_WITH_TOKEN_ID,
  "theMemes.mint.transaction.collection": COLLECTION_NAME,
  "theMemes.mint.transaction.close": "Mint-Bestätigung schließen",
} as const satisfies MintSuccessMessages;
