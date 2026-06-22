import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  waitForRouteReady,
} from "../testHelpers";

export const RESPONSE_TIMEOUT_MS = 20000;

export type ApiResponseMatcher = (url: URL) => boolean;

export async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
  await expect(page).not.toHaveTitle("404 | PAGE NOT FOUND");
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
