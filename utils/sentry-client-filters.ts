export type {
  LowValueNetworkErrorDecision,
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
  SentryTransactionSpan,
} from "./sentry-client-filters/types";
export { LOW_VALUE_NETWORK_ERROR_SAMPLE_RATE } from "./sentry-client-filters/constants";
export { redactDropReactionFailureIdentifiers } from "./sentry-client-filters/drop-reaction";
export { shouldFilterChromeMobileIosInjectedGaError } from "./sentry-client-filters/chrome-ios";
export {
  getLowValueNetworkErrorDecision,
  getLowValueNetworkErrorTargetUrl,
  getNetworkErrorMessageTargetUrl,
  getThirdPartyTelemetrySpanTargetKey,
  shouldFilterThirdPartyTelemetryNetworkError,
  shouldFilterThirdPartyTelemetrySpan,
  tagSampledLowValueNetworkError,
} from "./sentry-client-filters/network";
export {
  shouldFilterAnonymousUnsafeEvalCspError,
  shouldFilterAppleWebKitSortedTrackListTypeError,
  shouldFilterByFilenameExceptions,
  shouldFilterGifPickerTenorCategoriesError,
  shouldFilterInjectedWasmCspUnsafeEval,
  shouldFilterSentryRouteParameterizationError,
  shouldFilterTwitterCurrentInsetReferenceError,
  shouldFilterTwitterConfigReferenceError,
} from "./sentry-client-filters/errors";
export { shouldFilterInjectedIosAutoplayNotAllowedError } from "./sentry-client-filters/media";
export {
  shouldFilterReactDomInsertBeforeNotFoundError,
  shouldFilterReactDomRemoveChildNotFoundError,
} from "./sentry-client-filters/react-dom";
export { shouldFilterInstagramPageHideBridgeError } from "./sentry-client-filters/instagram-page-hide-bridge";
export {
  shouldFilterBrowserExtensionMessagingConnectionError,
  shouldFilterBrowserExtensionSendMessageError,
  shouldFilterBrowserExtensionWalletRejection,
} from "./sentry-client-filters/extension-messaging";
export { shouldFilterPoperBlockerOrphanFetchRejection } from "./sentry-client-filters/extension-fetch";
export { shouldFilterExpectedWaveRequestReplacementAbort } from "./sentry-client-filters/wave-abort";
export {
  shouldFilterBraveWalletPageEvaluationError,
} from "./sentry-client-filters/brave-wallet";
export {
  shouldFilterCoinbaseWalletLinkWebSocket1006,
  shouldFilterDisconnectedWalletProviderRejection,
  shouldFilterInjectedProviderProxyStartsWithError,
  shouldFilterInjectedWalletCollision,
  shouldFilterKnownWalletProviderObjectRejection,
  shouldFilterTalismanExtensionOnboardingError,
  shouldFilterWalletConnectStaleSessionTopic,
} from "./sentry-client-filters/wallets";
export {
  shouldFilterRabbyChromeUserRejectedRequest,
  shouldFilterRabbyMobileRainbowKitNotFoundError,
  shouldFilterRabbyMobileUserRejectedRequest,
} from "./sentry-client-filters/rabby";
export { shouldFilterZerionUserRejectedRequest } from "./sentry-client-filters/zerion";
export { __testing } from "./sentry-client-filters/testing";
