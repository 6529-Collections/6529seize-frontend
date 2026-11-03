// Kept apart from the connector so code that only needs to recognize an
// app-wallet connection does not pull viem account signing into the bundle.
export const APP_WALLET_CONNECTOR_TYPE = "app-wallet";
