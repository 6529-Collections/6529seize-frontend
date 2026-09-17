/** @jest-environment node */
import { expectMuseumPath } from "../../tests/support/museumNavigation";

describe("Museum route URL assertion", () => {
  it("accepts the exact pathname without requiring page-load APIs", async () => {
    const page = {
      url: () => "https://6529.io/museum/network/collection?view=all#holdings",
    };

    await expect(
      expectMuseumPath(page, "/museum/network/collection")
    ).resolves.toBeUndefined();
  });

  it("waits for the requested route to replace the previous URL", async () => {
    let currentUrl = "https://6529.io/museum/network/about";
    const update = setTimeout(() => {
      currentUrl = "https://6529.io/museum/network/collection";
    }, 10);
    try {
      await expect(
        expectMuseumPath(
          { url: () => currentUrl },
          "/museum/network/collection"
        )
      ).resolves.toBeUndefined();
    } finally {
      clearTimeout(update);
    }
  });

  it.each([
    "/museum/network/about",
    "/museum/network/collection-other",
    "/museum/network/collection/extra",
    "/museum/network/collection/",
  ])("rejects a different pathname: %s", async (pathname) => {
    await expect(
      expectMuseumPath(
        { url: () => `https://6529.io${pathname}` },
        "/museum/network/collection",
        { timeout: 25 }
      )
    ).rejects.toThrow("/museum/network/collection");
  });
});
