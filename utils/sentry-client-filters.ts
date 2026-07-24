export type {
  LowValueNetworkErrorDecision,
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
  SentryTransactionSpan,
} from "./sentry-client-filters/types";
export { LOW_VALUE_NETWORK_ERROR_SAMPLE_RATE } from "./sentry-client-filters/constants";
export { redactDropReactionFailureIdentifiers } from "./sentry-client-filters/drop-reaction";
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
  shouldFilterReactDomInsertBeforeNotFoundError,
  shouldFilterReactDomRemoveChildNotFoundError,
  shouldFilterSentryRouteParameterizationError,
  shouldFilterTwitterCurrentInsetReferenceError,
  shouldFilterTwitterConfigReferenceError,
} from "./sentry-client-filters/errors";
export {
  shouldFilterBrowserExtensionMessagingConnectionError,
  shouldFilterBrowserExtensionSendMessageError,
} from "./sentry-client-filters/extension-messaging";
export {
  shouldFilterPoperBlockerOrphanFetchRejection,
} from "./sentry-client-filters/extension-fetch";
export {
  shouldFilterCoinbaseWalletLinkWebSocket1006,
  shouldFilterDisconnectedWalletProviderRejection,
  shouldFilterInjectedProviderProxyStartsWithError,
  shouldFilterInjectedWalletCollision,
  shouldFilterRabbyMobileRainbowKitNotFoundError,
  shouldFilterRabbyMobileUserRejectedRequest,
  shouldFilterTalismanExtensionOnboardingError,
  shouldFilterWalletConnectStaleSessionTopic,
} from "./sentry-client-filters/wallets";
export { __testing } from "./sentry-client-filters/testing";
