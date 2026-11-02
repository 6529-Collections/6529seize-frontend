import type { BrowserContext } from "@playwright/test";
import type { ApiWaveOverviewPage } from "../../generated/models/ApiWaveOverviewPage";

export async function fetchWaveDiscoveryPage(
  context: Pick<BrowserContext, "cookies">,
  url: URL,
  stagingAccess: string | null
): Promise<ApiWaveOverviewPage> {
  const cookies = await context.cookies(url.toString());
  const cookieHeader = cookies
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  // Native fetch avoids Playwright API-step errors recording private headers
  // before our catch runs. Never follow redirects with those credentials.
  let response: Response;
  try {
    response = await globalThis.fetch(url, {
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...(stagingAccess ? { "x-6529-auth": stagingAccess } : {}),
      },
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error("Wave discovery pagination transport failed");
  }
  if (!response.ok) {
    throw new Error(
      `Wave discovery pagination failed (HTTP ${response.status})`
    );
  }
  try {
    return (await response.json()) as ApiWaveOverviewPage;
  } catch {
    throw new Error("Wave discovery pagination returned invalid JSON");
  }
}
