import { expect, type Page } from "@playwright/test";

export async function expectMuseumPath(
  page: Pick<Page, "url">,
  path: string,
  options: { timeout?: number } = {}
) {
  // Predicate-based toHaveURL also waits for load. Museum callers already
  // check DOM readiness; a pending image must not turn a correct URL into a
  // misleading navigation failure. Media checks remain separate.
  await expect.poll(() => new URL(page.url()).pathname, options).toBe(path);
}
