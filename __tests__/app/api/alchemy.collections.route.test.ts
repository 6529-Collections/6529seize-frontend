/** @jest-environment node */
import { GET } from "@/app/api/alchemy/collections/route";

it("retires collection search without contacting Alchemy", async () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
  try {
    const response = GET();
    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error:
        "Collection name search is no longer available. Use a contract address.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    globalThis.fetch = originalFetch;
  }
});
