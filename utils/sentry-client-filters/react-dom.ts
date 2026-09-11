import {
  REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE,
  REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE,
} from "./constants";
import type { SentryClientEvent } from "./types";
import {
  hasReactDomInsertBeforeRawRoute,
  hasReactDomRemoveChildRoute,
  hasWavesRoute,
} from "./value-utils";
import {
  hasReactDomInsertBeforeRawNotFoundErrorSignature,
  hasReactDomNotFoundErrorSignature,
} from "./app-frame-utils";

export function shouldFilterReactDomInsertBeforeNotFoundError(
  event: SentryClientEvent
): boolean {
  // Minified React runtime names are not translator-specific. Keep the raw
  // signature restricted to the observed route and capture-mechanism cohort.
  if (
    hasReactDomInsertBeforeRawRoute(event) &&
    hasReactDomInsertBeforeRawNotFoundErrorSignature(
      event,
      REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE
    )
  ) {
    return true;
  }

  if (!hasWavesRoute(event)) {
    return false;
  }

  return hasReactDomNotFoundErrorSignature(
    event,
    REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE
  );
}

export function shouldFilterReactDomRemoveChildNotFoundError(
  event: SentryClientEvent
): boolean {
  if (!hasReactDomRemoveChildRoute(event)) {
    return false;
  }

  return hasReactDomNotFoundErrorSignature(
    event,
    REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE
  );
}
