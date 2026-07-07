export const filenameExceptions = [
  "inpage.js",
  "extensionServiceWorker.js",
  "extensionPageScript.js",
  "injectLeap.js",
  "inject.chrome",
];
export const injectedWasmCspAppUriPath = "app:///inject.js";
export const injectedWasmCspCollapsedPath = "///inject.js";
const injectedAppUriPath = "app:///injected/injected.js";
export const injectedWalletCollisionAppUriPaths = [
  injectedAppUriPath,
  "app:///requestProvider.js",
  "app:///inject-runtime.js",
];
export const walletCollisionPatterns = [
  "tronlinkparams",
  "cannot set property ethereum of #<window> which has only a getter",
  "cannot assign to read only property 'ethereum'",
  'cannot assign to read only property "ethereum"',
  "cannot redefine property: ethereum",
  "cannot assign to read only property 'keplr'",
  'cannot assign to read only property "keplr"',
];
export const coinbaseWalletSdkPathTokens = [
  "@coinbase/wallet-sdk",
  "@coinbase+wallet-sdk",
];
export const coinbaseWalletLinkWebSocketFile = "WalletLinkWebSocket.js";
export const coinbaseWalletLinkWebSocketCloseFunction = "webSocket.onclose";
export const browserUnhandledRejectionMechanism =
  "auto.browser.global_handlers.onunhandledrejection";
export const coinbaseWalletLinkWebSocket1006MessagePrefix =
  "websocket error 1006";
export const walletWebSocketBreadcrumbAppKitTokens = [
  "appkit",
  "reown",
  "wagmi",
  "w3m",
];
export const walletWebSocketBreadcrumbConnectorTokens = [
  "coinbase",
  "walletlink",
  "@coinbase/wallet-sdk",
  "@coinbase+wallet-sdk",
  "walletconnect",
];
export const appOwnedFramePathPrefixes = [
  "app/",
  "components/",
  "config/",
  "constants/",
  "contexts/",
  "entities/",
  "helpers/",
  "hooks/",
  "lib/",
  "services/",
  "src/",
  "store/",
  "types/",
  "utils/",
  "wagmiConfig/",
];
export const metaMaskMobileUpdateUrlFunction = "__mm__updateUrl";
export const jsonStringifyFunction = "JSON.stringify";
export const circularReactMetaElementMessagePatterns = [
  "Converting circular structure to JSON",
  "HTMLMetaElement",
  "__reactFiber",
  "stateNode",
];
export const noisyThirdPartyTelemetryTargets = new Set([
  "cca-lite.coinbase.com/amp",
  "cca-lite.coinbase.com/metrics",
  "region1.google-analytics.com/g/collect",
]);
// Coinbase wallet telemetry can arrive as a wrapped network error with only a
// bare path target; keep this exact so first-party API paths still survive.
export const noisyThirdPartyTelemetryNetworkPaths = new Set(["/metrics"]);
export const objectCapturedPromiseRejectionMessage =
  "Object captured as promise rejection with keys: code, message, stack";
export const objectCapturedPromiseRejectionMessages = new Set([
  objectCapturedPromiseRejectionMessage,
  "Object captured as promise rejection with keys: code, message",
]);
export const providerDisconnectedCode = 4900;
export const providerDisconnectedMessage =
  "The provider is disconnected from all chains.";
export const talismanExtensionOnboardingMessage =
  "Talisman extension has not been configured yet. Please continue with onboarding.";
export const browserExtensionUrlPrefixes = [
  "chrome-extension://",
  "moz-extension://",
  "safari-web-extension://",
];
export const nextStaticFramePathToken = "/_next/static/";
const appOwnedFrameBasePathTokens = [
  "webpack-internal:///(app-",
  nextStaticFramePathToken,
];
export const appOwnedFramePathTokens = [
  ...appOwnedFrameBasePathTokens,
  ...appOwnedFramePathPrefixes.map((prefix) => `app:///${prefix}`),
];
export const rabbyMobileUserRejectedCode = 4001;
export const rabbyMobileUserRejectedMessage = "Not Allowed";
export const rabbyMobileStackContextPattern = "rabbymobile";
export const rabbyMobileUserRejectedStackPattern = "userrejectedrequest";
export const appOwnedStackPatterns = [
  "webpack-internal:///(app-pages-browser)",
  "webpack://_n_e/./",
  nextStaticFramePathToken,
  "https://6529.io/",
  "https://www.6529.io/",
  "https://staging.6529.io/",
  "http://localhost:",
  "http://127.0.0.1:",
  "app:///",
  "app/",
  "components/",
  "contexts/",
  "helpers/",
  "hooks/",
  "lib/",
  "services/",
  "store/",
  "utils/",
];
export const LOW_VALUE_NETWORK_ERROR_SAMPLE_RATE = 0.1;
export const RABBY_MOBILE_USER_AGENT_TOKEN = "rabbymobile";
export const RABBY_MOBILE_RAINBOWKIT_NOT_FOUND_MESSAGE = "not found rainbowkit";

export const REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE =
  "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.";
export const REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE =
  "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.";
export const REACT_DOM_RUNTIME_FRAME_PATTERNS = [
  "next/dist/compiled/react-dom/",
  "react-dom/cjs/react-dom-client.production.js",
  "react-dom-client.production.js",
];
export const NEXT_STATIC_CHUNK_FRAME_PATTERNS = [
  `${nextStaticFramePathToken}chunks/`,
  `${nextStaticFramePathToken}webpack/`,
];
export const REACT_DOM_INSERT_BEFORE_RUNTIME_FUNCTIONS = new Set([
  "insertOrAppendPlacementNode",
  "commitReconciliationEffects",
  "commitMutationEffectsOnFiber",
  "recursivelyTraverseMutationEffects",
]);
export const WAVES_ROUTE_PATH = "/waves";
export const gifPickerTenorUndefinedTagsMessage =
  "undefined is not an object (evaluating 'e.tags')";
export const gifPickerReactPackageToken = "gif-picker-react";
export const gifPickerTenorManagerPathToken = "TenorManager.ts";
export const gifPickerTenorFailureMessage =
  "[gif-picker-react] Failed to fetch data from Tenor API";
export const tenorCategoriesPath = "/v2/categories";
export const THE_MEMES_MINT_ROUTE_PATH = "/the-memes/mint";

export const sentryRouteParameterizationMechanismType =
  "auto.browser.browserapierrors.setTimeout";
export const sentryRouteParameterizationMessage =
  "JSON.stringify cannot serialize cyclic structures.";
export const sentryRouteParameterizationPathToken =
  "client/routing/parameterization.ts";
export const sentryPackagePathTokens = ["@sentry/nextjs", "@sentry+nextjs"];
export const metaMaskMobileContextTokens = [
  "metamaskmobile",
  "metamask mobile",
];
export const mobileSafariWebViewContextTokens = [
  "mobile safari ui/wkwebview",
  "wkwebview",
];
export const webViewUserAgentTokens = ["webview", "wkwebview"];
export const routeParameterizationContextKeys = [
  "app",
  "browser",
  "device",
  "os",
];
export const routeParameterizationTagKeys = [
  "app",
  "app.name",
  "browser",
  "browser.name",
  "device",
  "device.family",
  "os",
  "os.name",
];
export const injectedProviderProxyPath =
  "app:///js/injected/proxy-injected-providers.js";
export const injectedProviderProxyStartsWithMessage =
  "t?.startsWith is not a function";
export const walletConnectStaleSessionTopicPrefix =
  "No matching key. session topic doesn't exist: ";
export const walletConnectStaleSessionFunctions = new Set([
  "isValidSessionTopic",
  "onRelayMessage",
]);
export const extensionMessagingConnectionFailureMessage =
  "Could not establish connection. Receiving end does not exist.";
export const injectedScriptBundlePathToken = "injectedscript.bundle.js";
export const URL_IS_FIRST_PARTY_KEY = "url.is_first_party";
export const URL_IS_FIRST_PARTY_API_KEY = "url.is_first_party_api";
export const FNV_OFFSET_BASIS = 2166136261;
export const FNV_PRIME = 16777619;
export const UINT_32_SIZE = 4294967296;
export const FILTERED_URL_TOKENS = new Set([
  "[filtered]",
  "[redacted]",
  "filtered",
]);
