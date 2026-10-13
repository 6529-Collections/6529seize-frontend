import { expect, type Locator } from "@playwright/test";

/** Assert that submitting never replaces or blurs the original chat input. */
export async function observeComposerFocus(composer: Locator) {
  const originalEditor = await composer.elementHandle();
  if (!originalEditor) throw new Error("The chat editor must be mounted.");
  await originalEditor.evaluate((input) => {
    input.setAttribute("data-test-blur-count", "0");
    input.addEventListener("blur", () => {
      const count = Number(input.getAttribute("data-test-blur-count") ?? "0");
      input.setAttribute("data-test-blur-count", String(count + 1));
    });
  });
  return async () => {
    expect(
      await originalEditor.evaluate((input) => ({
        connected: input.isConnected,
        focused: document.activeElement === input,
        blurCount: input.getAttribute("data-test-blur-count"),
      }))
    ).toEqual({ connected: true, focused: true, blurCount: "0" });
    await originalEditor.dispose();
  };
}
