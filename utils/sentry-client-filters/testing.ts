import {
  filenameExceptions,
  gifPickerTenorUndefinedTagsMessage,
  noisyThirdPartyTelemetryTargets,
  REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE,
  REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE,
  sentryRouteParameterizationMechanismType,
  sentryRouteParameterizationMessage,
} from "./constants";
import { hasInjectedAppUriFrame, hasOnlyAppUriFrames } from "./app-frame-utils";
import {
  hasMetaMaskMobileWebViewContext,
  hasRouteParameterizationRouteEvidence,
  isTwitterBrowser,
} from "./errors";
import { shouldFilterThirdPartyTelemetrySpan } from "./network";
import {
  hasCoinbaseWalletLinkWebSocketCloseFunction,
  hasCoinbaseWalletLinkWebSocketCloseStack,
  hasCoinbaseWalletLinkWebSocketFrame,
  isCoinbaseWalletLinkWebSocket1006Message,
  isCoinbaseWalletLinkWebSocketPath,
  matchesWalletCollisionPattern,
} from "./wallets";

export const __testing = {
  filenameExceptions,
  hasOnlyAppUriFrames,
  hasInjectedAppUriFrame,
  isTwitterBrowser,
  matchesWalletCollisionPattern,
  noisyThirdPartyTelemetryTargets,
  REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE,
  gifPickerTenorUndefinedTagsMessage,
  REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE,
  sentryRouteParameterizationMechanismType,
  sentryRouteParameterizationMessage,
  hasMetaMaskMobileWebViewContext,
  hasRouteParameterizationRouteEvidence,
  isCoinbaseWalletLinkWebSocket1006Message,
  isCoinbaseWalletLinkWebSocketPath,
  hasCoinbaseWalletLinkWebSocketFrame,
  hasCoinbaseWalletLinkWebSocketCloseFunction,
  hasCoinbaseWalletLinkWebSocketCloseStack,
  shouldFilterThirdPartyTelemetrySpan,
};
