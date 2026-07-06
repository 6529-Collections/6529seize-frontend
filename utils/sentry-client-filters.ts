export type {
  LowValueNetworkErrorDecision,
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
  SentryTransactionSpan,
} from "./sentry-client-filters/types";
export { LOW_VALUE_NETWORK_ERROR_SAMPLE_RATE } from "./sentry-client-filters/constants";
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
  shouldFilterByFilenameExceptions,
  shouldFilterGifPickerTenorCategoriesError,
  shouldFilterInjectedWasmCspUnsafeEval,
  shouldFilterReactDomInsertBeforeNotFoundError,
  shouldFilterReactDomRemoveChildNotFoundError,
  shouldFilterSentryRouteParameterizationError,
  shouldFilterTwitterConfigReferenceError,
} from "./sentry-client-filters/errors";
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
