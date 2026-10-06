import { expect, test } from "../testHelpers";
import { gotoReady } from "../social/profileReadonlyHelpers";

test("Additional Action draft is readable and preserved on desktop and phone @smoke @medium @large @readonly", async ({
  page,
  baseURL,
}) => {
  // This fixture exists only in development on loopback hosts, so deployed runs
  // cannot exercise it; local runs retain the full desktop and phone checks.
  test.skip(
    !baseURL ||
      !["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseURL).hostname),
    "The component preview is available only on a local development server."
  );
  const plan =
    "If selected, send prints to the top five voters.\nShipping is included, within two months.";
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await gotoReady(page, "/tools/additional-action-preview");
    const checkbox = page.getByRole("checkbox", {
      name: "Additional Action",
      exact: true,
    });
    const input = page.getByRole("textbox", { name: "Your plan (optional)" });
    const summary = page.getByRole("region", {
      name: "Additional Action",
      exact: true,
    });
    await expect(input).toHaveCount(0);
    await checkbox.check();
    await expect(input).toHaveAccessibleDescription(/who receives it/);
    await expect(input).toHaveAttribute("maxlength", "5000");
    await input.fill(plan);
    await expect(summary).toContainText(plan);
    await checkbox.uncheck();
    await expect(input).toHaveCount(0);
    await expect(summary).toContainText("No additional action marked.");
    await expect(summary).not.toContainText(plan);
    await checkbox.check();
    await expect(input).toHaveValue(plan);
    await input.focus();
    await page.keyboard.press("Tab");
    await expect(input).not.toBeFocused();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflows, `No horizontal overflow at ${width}px`).toBe(false);
  }
});
