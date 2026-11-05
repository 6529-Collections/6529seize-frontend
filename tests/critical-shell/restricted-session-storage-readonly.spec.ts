import { expect, test } from "../testHelpers";
import { installLocalCountryCheck } from "../support/localCountryCheck";

for (const restriction of ["getter", "operations"] as const) {
  test(`hydrates notifications with blocked sessionStorage ${restriction} @critical-shell @readonly`, async ({
    page,
    baseURL,
  }) => {
    await installLocalCountryCheck(page, baseURL);
    await page.addInitScript((mode) => {
      const blocked = () => {
        throw new DOMException(
          "Access is denied for this document.",
          "SecurityError"
        );
      };
      if (mode === "getter") {
        Object.defineProperty(window, "sessionStorage", { get: blocked });
      } else {
        Object.defineProperty(window, "sessionStorage", {
          value: {
            getItem: blocked,
            setItem: blocked,
            removeItem: blocked,
            clear: blocked,
          },
        });
      }
    }, restriction);

    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "This content is only available to connected wallets.",
      })
    ).toBeVisible({ timeout: 15000 });
    // An interactive search proves the providers hydrated beyond the SSR shell.
    const search = page.getByRole("button", { name: /^Search(?: 6529)?$/ });
    await expect(search).toBeEnabled();
    await search.click();
    await expect(page.getByRole("dialog").getByRole("combobox")).toBeVisible();
    await page.keyboard.press("Escape");
  });
}
