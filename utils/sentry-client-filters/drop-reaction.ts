import { getAwsRumPageId } from "@/utils/monitoring/mobileLaunchTimingSanitizers";
import {
  URL_IS_FIRST_PARTY_API_KEY,
  URL_IS_FIRST_PARTY_KEY,
} from "./constants";
import type { SentryBreadcrumb, SentryClientEvent } from "./types";
import {
  getBooleanValue,
  getBreadcrumbValues,
  getNumericValue,
  getRequestPathname,
  getStringValue,
  isRecord,
} from "./value-utils";

const dropReactionRequestFailedMessage = "Drop reaction request failed";
const dropReactionFeature = "drop-reaction";
const dropReactionRequestOperation = "reaction-request";
const dropReactionEndpointFamily = "drop_reaction";
const reactionBreadcrumbCategory = "reactions";
const reactionRequestSentMessage = "reaction.request_sent";
const reactionRequestFailedBreadcrumbMessage = "reaction.request_failed";
const reactionRequestSucceededMessage = "reaction.request_succeeded";
const dropReactionRequestMethods = new Set(["DELETE", "POST"]);
const dropReactionActions = new Set(["add", "remove", "replace"]);
const dropReactionSources = new Set(["chip", "picker", "quick-react"]);
const dropReactionRequestPath = /^\/api\/drops\/[^/]+\/reaction\/?$/;
const redactedUrlValue = "[Filtered]";
const breadcrumbUrlKeys = ["from", "to", "url"] as const;
const uuidPattern =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const walletAddressPattern = /\b0x[a-f0-9]{40}\b/i;
const longHexIdentifierPattern = /\b[a-f0-9]{32,}\b/i;
const relativeIdentifierPathPrefixes = [
  "api/drop/",
  "api/drops/",
  "api/profile/",
  "api/profiles/",
  "api/user/",
  "api/users/",
  "api/v2/drop/",
  "api/v2/drops/",
  "api/v2/profile/",
  "api/v2/profiles/",
  "api/v2/user/",
  "api/v2/users/",
  "api/v2/wave/",
  "api/v2/waves/",
  "api/wave/",
  "api/waves/",
  "drop/",
  "drops/",
  "profile/",
  "profiles/",
  "user/",
  "users/",
  "v2/drop/",
  "v2/drops/",
  "v2/profile/",
  "v2/profiles/",
  "v2/user/",
  "v2/users/",
  "v2/wave/",
  "v2/waves/",
  "wave/",
  "waves/",
] as const;
const pathPrefixBoundaryCharacters = new Set([
  " ",
  "\t",
  "\n",
  "\r",
  '"',
  "'",
  "(",
  "[",
  "{",
  "=",
  ":",
  "`",
  ",",
  ";",
]);
const maxBreadcrumbRedactionDepth = 8;

type DropReactionRequestIdentity = {
  readonly action: string;
  readonly method: string;
  readonly mutationSequence: number;
  readonly source: string;
};

type DropReactionRequestWindow = {
  readonly completedRequestWindows: readonly BreadcrumbIndexWindow[];
  readonly endIndex: number;
  readonly method: string;
  readonly startIndex: number;
};

type BreadcrumbIndexWindow = {
  readonly endIndex: number;
  readonly startIndex: number;
};

type DropReactionFailedRequest = {
  readonly index: number;
  readonly request: DropReactionRequestIdentity;
};

type CompletedDropReactionRequests = Map<string, number[]>;

type DropReactionLifecycleScanResult =
  | { readonly action: "ambiguous" | "continue" | "sent" }
  | { readonly action: "completed"; readonly endIndex: number };

function isSyntheticDropReactionNetworkError(
  event: SentryClientEvent
): boolean {
  const exceptionValues = event.exception?.values;
  if (!Array.isArray(exceptionValues) || exceptionValues.length !== 1) {
    return false;
  }

  const [exception] = exceptionValues;
  const tags = event.tags;
  if (!tags) {
    return false;
  }

  return (
    event.level === "warning" &&
    exception?.type === "Error" &&
    exception.value === dropReactionRequestFailedMessage &&
    exception.mechanism?.handled === true &&
    tags["feature"] === dropReactionFeature &&
    tags["operation"] === dropReactionRequestOperation &&
    tags["error_kind"] === "network"
  );
}

function isDropReactionTransportFailure(
  breadcrumb: SentryBreadcrumb,
  expectedMethod: string
): boolean {
  if (
    breadcrumb.type !== "http" ||
    (breadcrumb.category !== "fetch" && breadcrumb.category !== "xhr")
  ) {
    return false;
  }

  const data = breadcrumb.data;
  const statusCode =
    getNumericValue(data?.["status_code"]) ??
    getNumericValue(data?.["http.response.status_code"]);
  const isTransportFailure =
    statusCode === 0 || (statusCode === null && breadcrumb.level === "error");
  const method = getStringValue(data?.["method"])?.toUpperCase();
  const pathname = getRequestPathname(getStringValue(data?.["url"]));

  return (
    isTransportFailure &&
    getBooleanValue(data?.[URL_IS_FIRST_PARTY_KEY]) === true &&
    getBooleanValue(data?.[URL_IS_FIRST_PARTY_API_KEY]) === true &&
    method === expectedMethod &&
    pathname !== null &&
    dropReactionRequestPath.test(pathname)
  );
}

function getDropReactionRequestIdentity(
  breadcrumb: SentryBreadcrumb
): DropReactionRequestIdentity | null {
  if (
    breadcrumb.category !== reactionBreadcrumbCategory ||
    getStringValue(breadcrumb.data?.["endpoint_family"]) !==
      dropReactionEndpointFamily
  ) {
    return null;
  }

  const method = getStringValue(breadcrumb.data?.["method"])?.toUpperCase();
  const action = getStringValue(breadcrumb.data?.["action"]);
  const source = getStringValue(breadcrumb.data?.["source"]);
  const mutationSequence = getNumericValue(
    breadcrumb.data?.["mutation_sequence"]
  );
  if (
    !method ||
    !dropReactionRequestMethods.has(method) ||
    !action ||
    !dropReactionActions.has(action) ||
    !source ||
    !dropReactionSources.has(source) ||
    mutationSequence === null ||
    !Number.isInteger(mutationSequence) ||
    mutationSequence < 1
  ) {
    return null;
  }

  return { action, method, mutationSequence, source };
}

function isSameDropReactionRequest(
  candidate: DropReactionRequestIdentity,
  expected: DropReactionRequestIdentity
): boolean {
  return (
    candidate.action === expected.action &&
    candidate.method === expected.method &&
    candidate.mutationSequence === expected.mutationSequence &&
    candidate.source === expected.source
  );
}

function getDropReactionRequestIdentityKey(
  request: DropReactionRequestIdentity
): string {
  return [
    request.action,
    request.method,
    request.mutationSequence,
    request.source,
  ].join(":");
}

function recordCompletedDropReactionRequest(
  completedRequests: CompletedDropReactionRequests,
  requestKey: string,
  endIndex: number
): void {
  const endIndexes = completedRequests.get(requestKey) ?? [];
  endIndexes.push(endIndex);
  completedRequests.set(requestKey, endIndexes);
}

function consumeCompletedDropReactionRequest(
  completedRequests: CompletedDropReactionRequests,
  requestKey: string
): number | null {
  const endIndexes = completedRequests.get(requestKey);
  const endIndex = endIndexes?.pop();
  if (endIndex === undefined) {
    return null;
  }

  if (endIndexes.length === 0) {
    completedRequests.delete(requestKey);
  }
  return endIndex;
}

function getSameMethodDropReactionRequest(
  breadcrumb: SentryBreadcrumb,
  expectedMethod: string
): DropReactionRequestIdentity | null {
  if (breadcrumb.category !== reactionBreadcrumbCategory) {
    return null;
  }

  const candidate = getDropReactionRequestIdentity(breadcrumb);
  return candidate?.method === expectedMethod ? candidate : null;
}

function scanDropReactionLifecycleBreadcrumb(
  breadcrumb: SentryBreadcrumb,
  breadcrumbIndex: number,
  candidate: DropReactionRequestIdentity,
  expected: DropReactionRequestIdentity,
  completedRequests: CompletedDropReactionRequests
): DropReactionLifecycleScanResult {
  const requestKey = getDropReactionRequestIdentityKey(candidate);
  if (isDropReactionRequestTerminal(breadcrumb.message)) {
    recordCompletedDropReactionRequest(
      completedRequests,
      requestKey,
      breadcrumbIndex
    );
    return { action: "continue" };
  }

  if (breadcrumb.message !== reactionRequestSentMessage) {
    return { action: "continue" };
  }

  const completedEndIndex = consumeCompletedDropReactionRequest(
    completedRequests,
    requestKey
  );
  if (completedEndIndex !== null) {
    return { action: "completed", endIndex: completedEndIndex };
  }

  return {
    action: isSameDropReactionRequest(candidate, expected)
      ? "sent"
      : "ambiguous",
  };
}

function getLatestDropReactionNetworkFailure(
  breadcrumbs: SentryBreadcrumb[]
): DropReactionFailedRequest | null {
  for (let index = breadcrumbs.length - 1; index >= 0; index -= 1) {
    const breadcrumb = breadcrumbs[index];
    if (
      breadcrumb?.category !== reactionBreadcrumbCategory ||
      breadcrumb.message !== reactionRequestFailedBreadcrumbMessage
    ) {
      continue;
    }

    const request = getDropReactionRequestIdentity(breadcrumb);
    if (
      request === null ||
      getStringValue(breadcrumb.data?.["error_kind"]) !== "network"
    ) {
      return null;
    }

    return { index, request };
  }

  return null;
}

function isDropReactionRequestTerminal(message: string | undefined): boolean {
  return (
    message === reactionRequestFailedBreadcrumbMessage ||
    message === reactionRequestSucceededMessage
  );
}

function getUnambiguousDropReactionRequestStart(
  breadcrumbs: SentryBreadcrumb[],
  failure: DropReactionFailedRequest
): Pick<
  DropReactionRequestWindow,
  "completedRequestWindows" | "startIndex"
> | null {
  const completedRequests: CompletedDropReactionRequests = new Map();
  const completedRequestWindows: BreadcrumbIndexWindow[] = [];
  let sentIndex: number | null = null;

  for (let index = failure.index - 1; index >= 0; index -= 1) {
    const breadcrumb = breadcrumbs[index];
    if (!breadcrumb) {
      continue;
    }

    const candidate = getSameMethodDropReactionRequest(
      breadcrumb,
      failure.request.method
    );
    if (!candidate) {
      continue;
    }

    const result = scanDropReactionLifecycleBreadcrumb(
      breadcrumb,
      index,
      candidate,
      failure.request,
      completedRequests
    );
    if (
      result.action === "ambiguous" ||
      (result.action === "sent" && sentIndex !== null)
    ) {
      return null;
    }
    if (result.action === "completed") {
      completedRequestWindows.push({
        endIndex: result.endIndex,
        startIndex: index + 1,
      });
    } else if (result.action === "sent") {
      sentIndex = index;
    }
  }

  return sentIndex === null
    ? null
    : { completedRequestWindows, startIndex: sentIndex + 1 };
}

function getCurrentDropReactionRequestWindow(
  breadcrumbs: SentryBreadcrumb[]
): DropReactionRequestWindow | null {
  const failure = getLatestDropReactionNetworkFailure(breadcrumbs);
  if (!failure) {
    return null;
  }

  const requestStart = getUnambiguousDropReactionRequestStart(
    breadcrumbs,
    failure
  );
  if (requestStart === null) {
    return null;
  }

  return {
    completedRequestWindows: requestStart.completedRequestWindows,
    endIndex: failure.index,
    method: failure.request.method,
    startIndex: requestStart.startIndex,
  };
}

function isInsideBreadcrumbWindow(
  index: number,
  window: BreadcrumbIndexWindow
): boolean {
  return index >= window.startIndex && index < window.endIndex;
}

export function hasDropReactionFailure(event: SentryClientEvent): boolean {
  if (!isSyntheticDropReactionNetworkError(event)) {
    return false;
  }

  const breadcrumbs = getBreadcrumbValues(event);
  const requestWindow = getCurrentDropReactionRequestWindow(breadcrumbs);
  if (!requestWindow) {
    return false;
  }

  for (
    let index = requestWindow.startIndex;
    index < requestWindow.endIndex;
    index += 1
  ) {
    const belongsToCompletedRequest =
      requestWindow.completedRequestWindows.some((window) =>
        isInsideBreadcrumbWindow(index, window)
      );
    const breadcrumb = breadcrumbs[index];
    if (
      !belongsToCompletedRequest &&
      breadcrumb &&
      isDropReactionTransportFailure(breadcrumb, requestWindow.method)
    ) {
      return true;
    }
  }

  return false;
}

function isBreadcrumbUrlKey(key: string): boolean {
  return breadcrumbUrlKeys.some((urlKey) => urlKey === key);
}

function isPathPrefixBoundary(character: string | undefined): boolean {
  return character === undefined || pathPrefixBoundaryCharacters.has(character);
}

function isBoundedRouteFamily(value: string): boolean {
  return getAwsRumPageId(value) === value;
}

function hasRelativeIdentifierPath(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  for (let index = 0; index < normalizedValue.length; index += 1) {
    if (!isPathPrefixBoundary(normalizedValue[index - 1])) {
      continue;
    }

    const candidate = normalizedValue.slice(index);
    if (
      relativeIdentifierPathPrefixes.some(
        (prefix) =>
          candidate.startsWith(prefix) && candidate.length > prefix.length
      )
    ) {
      return true;
    }
  }

  return false;
}

function hasIdentifierBearingBreadcrumbText(value: string): boolean {
  if (
    uuidPattern.test(value) ||
    walletAddressPattern.test(value) ||
    longHexIdentifierPattern.test(value) ||
    hasRelativeIdentifierPath(value)
  ) {
    return true;
  }

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== "/" || !isPathPrefixBoundary(value[index - 1])) {
      continue;
    }

    const nextIndex = value[index + 1] === "/" ? index + 2 : index + 1;
    const nextCharacter = value[nextIndex];
    if (nextCharacter && !isPathPrefixBoundary(nextCharacter)) {
      return true;
    }
  }

  return false;
}

function redactBreadcrumbValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
  parentKey?: string
): unknown {
  if (typeof value === "string") {
    if (parentKey === "route_family" && isBoundedRouteFamily(value)) {
      return value;
    }

    return hasIdentifierBearingBreadcrumbText(value) ? redactedUrlValue : value;
  }

  if (depth > maxBreadcrumbRedactionDepth) {
    return redactedUrlValue;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactBreadcrumbValue(item, depth + 1, seen));
  }

  if (!isRecord(value)) {
    return value;
  }

  if (seen.has(value)) {
    return redactedUrlValue;
  }
  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([nestedKey, nestedValue]) => [
      nestedKey,
      isBreadcrumbUrlKey(nestedKey)
        ? redactedUrlValue
        : redactBreadcrumbValue(nestedValue, depth + 1, seen, nestedKey),
    ])
  );
}

export function redactDropReactionFailureIdentifiers(
  event: SentryClientEvent
): void {
  if (!hasDropReactionFailure(event)) {
    return;
  }

  delete event.request;

  if (event.tags) {
    const tags = { ...event.tags };
    delete tags["url"];
    event.tags = tags;
  }

  for (const breadcrumb of getBreadcrumbValues(event)) {
    if (
      typeof breadcrumb.message === "string" &&
      hasIdentifierBearingBreadcrumbText(breadcrumb.message)
    ) {
      breadcrumb.message = redactedUrlValue;
    }

    if (breadcrumb.data) {
      breadcrumb.data = redactBreadcrumbValue(
        breadcrumb.data,
        0,
        new WeakSet<object>()
      ) as Record<string, unknown>;
    }
  }
}
