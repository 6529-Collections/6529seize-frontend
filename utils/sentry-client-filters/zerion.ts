import type {
  SentryBreadcrumb,
  SentryClientEvent,
  SentryEventHint,
} from "./types";
import {
  getBreadcrumbValues,
  getHintExceptionStack,
  getSerializedObjectRejection,
} from "./value-utils";
import { hasBrowserUnhandledRejectionMechanism } from "./walletlink-websocket";

const zerionObjectRejectionMessage =
  "Object captured as promise rejection with keys: code, message, name";
const zerionUserRejectedCode = 4001;
const zerionUserRejectedMessage = "User Rejected the Request";
const zerionUserRejectedName = "Error";
const zerionWalletClickSelector =
  ' > wui-flex > w3m-list-wallet[name="Zerion"]';

function hasSingleFramelessBrowserUnhandledRejection(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const value = values[0];
  const frames = value?.stacktrace?.frames;
  const hasNoFrames =
    frames === undefined || (Array.isArray(frames) && frames.length === 0);

  return (
    value?.type === "UnhandledRejection" &&
    value.value === zerionObjectRejectionMessage &&
    hasBrowserUnhandledRejectionMechanism(value) &&
    hasNoFrames
  );
}

function hasExactZerionRejectionShape(
  serialized: Record<string, unknown>
): boolean {
  const keys = Object.keys(serialized);
  return (
    keys.length === 3 &&
    keys.includes("code") &&
    keys.includes("message") &&
    keys.includes("name")
  );
}

function isExactZerionWalletClick(breadcrumb: SentryBreadcrumb): boolean {
  return (
    breadcrumb.type === "default" &&
    breadcrumb.category === "ui.click" &&
    breadcrumb.level === "info" &&
    breadcrumb.message === zerionWalletClickSelector
  );
}

function hasLatestUiClickForZerion(event: SentryClientEvent): boolean {
  const breadcrumbs = getBreadcrumbValues(event);

  for (let index = breadcrumbs.length - 1; index >= 0; index -= 1) {
    const breadcrumb = breadcrumbs[index];
    if (breadcrumb?.category !== "ui.click") {
      continue;
    }

    return isExactZerionWalletClick(breadcrumb);
  }

  return false;
}

export function shouldFilterZerionUserRejectedRequest(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  if (!hasSingleFramelessBrowserUnhandledRejection(event)) {
    return false;
  }

  const serialized = getSerializedObjectRejection(event, hint);
  if (!serialized || !hasExactZerionRejectionShape(serialized)) {
    return false;
  }

  if (getHintExceptionStack(hint)) {
    return false;
  }

  return (
    serialized["code"] === zerionUserRejectedCode &&
    serialized["message"] === zerionUserRejectedMessage &&
    serialized["name"] === zerionUserRejectedName &&
    hasLatestUiClickForZerion(event)
  );
}
