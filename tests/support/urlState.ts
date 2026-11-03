import { expect, type Page } from "@playwright/test";

/** Check route state independently of the load event and pending media. */
export async function expectUrlState(
  page: Pick<Page, "url">,
  matches: (url: URL) => boolean,
  options: { timeout?: number; message?: string } = {}
) {
  // Predicate-based toHaveURL waits for load, even when the URL already matches.
  // Callers assert the destination's rendered controls separately.
  await expect
    .poll(
      () => {
        const url = new URL(page.url());
        return matches(url) ? null : url.href;
      },
      {
        timeout: options.timeout ?? 20_000,
        message:
          options.message ??
          "Expected the current URL to satisfy the route-state predicate",
      }
    )
    .toBeNull();
}
