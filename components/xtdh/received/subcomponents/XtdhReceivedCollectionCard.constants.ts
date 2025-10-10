/**
 * Fixed message for the collection card empty state to keep layouts consistent.
 */
export const XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE =
  "No tokens found in this collection.";

/**
 * Generates the accessible toggle label for the collection card expander.
 */
export const getXtdhReceivedCollectionToggleLabel = (collectionName: string) =>
  `Toggle ${collectionName} collection`;
