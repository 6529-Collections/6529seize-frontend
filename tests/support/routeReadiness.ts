import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  waitForRouteReady,
} from "../testHelpers";

export const RESPONSE_TIMEOUT_MS = 20000;
const TRANSIENT_DOCUMENT_STATUS_CODES = new Set([502, 503, 504]);
// Keep these exact fixtures aligned with components/not-found/NotFound.tsx and
// components/error/Error.tsx. Staging has returned both as HTTP 200 documents
// for routes that passed on an immediate second navigation.
const NOT_FOUND_DOCUMENT_TITLE = "404 | PAGE NOT FOUND";
const ERROR_DOCUMENT_TITLE = "6529 Error";
const RETRYABLE_DOCUMENT_TITLES = new Set([
  NOT_FOUND_DOCUMENT_TITLE,
  ERROR_DOCUMENT_TITLE,
]);
const TRANSIENT_DOCUMENT_RETRY_DELAY_MS = 1000;

export type ApiResponseMatcher = (url: URL) => boolean;

export async function gotoReady(page: Page, path: string) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
  await expect(page).not.toHaveTitle("404 | PAGE NOT FOUND");
}

export async function gotoDocumentWithTransientRetry(page: Page, path: string) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    const transientStatus =
      response !== null &&
      TRANSIENT_DOCUMENT_STATUS_CODES.has(response.status())
        ? response.status()
        : null;
    const title = transientStatus === null ? await page.title() : "";
    const retryableTitle = RETRYABLE_DOCUMENT_TITLES.has(title) ? title : null;

    if (transientStatus === null && retryableTitle === null) {
      return response;
    }

    if (attempt === 1) {
      await page.waitForTimeout(TRANSIENT_DOCUMENT_RETRY_DELAY_MS);
      continue;
    }

    if (transientStatus !== null) {
      throw new Error(
        `Document navigation to ${path} returned transient HTTP ${transientStatus} after retry.`
      );
    }
    if (retryableTitle === NOT_FOUND_DOCUMENT_TITLE) {
      throw new Error(
        `Document navigation to ${path} remained on the application 404 page after retry.`
      );
    }
    throw new Error(
      `Document navigation to ${path} remained on the application error shell after retry.`
    );
  }

  return null;
}

export async function waitForApiResponse(
  page: Page,
  matches: ApiResponseMatcher
) {
  const response = await page.waitForResponse(
    (candidate) => {
      try {
        return matches(new URL(candidate.url()));
      } catch {
        return false;
      }
    },
    { timeout: RESPONSE_TIMEOUT_MS }
  );
  expect(response.ok(), `${response.url()} returned ${response.status()}`).toBe(
    true
  );
  return response;
}

export async function gotoReadyWithApiResponse(
  page: Page,
  path: string,
  matches: ApiResponseMatcher
) {
  const responsePromise = waitForApiResponse(page, matches);
  await gotoReady(page, path);
  return responsePromise;
}
