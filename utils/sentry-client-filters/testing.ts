import {
  filenameExceptions,
  gifPickerTenorUndefinedTagsMessage,
  noisyThirdPartyTelemetryTargets,
  nextStaticFramePathToken,
  REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE,
  REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE,
  sentryRouteParameterizationMechanismType,
  sentryRouteParameterizationMessage,
} from "./constants";
import {
  hasInjectedAppUriFrame,
  hasOnlyAppUriFrames,
  isFirstPartyFramePath,
} from "./app-frame-utils";
import { isTwitterBrowser } from "./errors";
import {
  hasMetaMaskMobileWebViewContext,
  hasRouteParameterizationRouteEvidence,
} from "./metamask-mobile";
import { shouldFilterThirdPartyTelemetrySpan } from "./network";
import {
  hasCoinbaseWalletLinkWebSocketCloseFunction,
  hasCoinbaseWalletLinkWebSocketCloseStack,
  hasCoinbaseWalletLinkWebSocketFrame,
  isCoinbaseWalletLinkWebSocket1006Message,
  isCoinbaseWalletLinkWebSocketPath,
} from "./walletlink-websocket";
import { matchesWalletCollisionPattern } from "./wallets";

export const __testing = {
  filenameExceptions,
  hasOnlyAppUriFrames,
  hasInjectedAppUriFrame,
  isTwitterBrowser,
  matchesWalletCollisionPattern,
  noisyThirdPartyTelemetryTargets,
  nextStaticFramePathToken,
  isFirstPartyFramePath,
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
