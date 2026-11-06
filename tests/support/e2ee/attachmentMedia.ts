import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function dropEncryptedAttachment(
  page: Page,
  file: {
    readonly name: string;
    readonly base64: string;
    readonly mimeType: string;
  }
) {
  const dataTransfer = await page.evaluateHandle(
    ({ name, base64, mimeType }) => {
      const transfer = new DataTransfer();
      const bytes = Uint8Array.from(atob(base64), (character) =>
        character.codePointAt(0) ?? 0
      );
      transfer.items.add(new File([bytes], name, { type: mimeType }));
      return transfer;
    },
    file
  );
  try {
    const chat = page.getByRole("region", {
      name: "Encrypted chat file upload area",
    });
    await chat.dispatchEvent("dragenter", { dataTransfer });
    await expect(
      chat.getByText("Drop files here", { exact: true })
    ).toBeVisible();
    await chat.dispatchEvent("drop", { dataTransfer });
    await expect(
      chat.getByText("Drop files here", { exact: true })
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("list", { name: "Attachments" })
        .getByText(file.name, { exact: true })
    ).toBeVisible();
  } finally {
    await dataTransfer.dispose();
  }
}

/** Runs in desktop and mobile-browser packs; the native save path has separate unit coverage. */
export async function checkEncryptedImageActions(
  page: Page,
  image: Locator,
  filename: string
) {
  await image.click();
  const preview = page.getByRole("dialog", { name: "Expanded image preview" });
  await expect(preview.getByRole("img")).toBeVisible();
  await expect(preview.getByRole("img")).toHaveAttribute("src", /^blob:/u);
  const download = page.waitForEvent("download");
  await preview
    .getByRole("button", { name: "Download media", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(filename);
  await preview
    .getByRole("button", { name: "Close media", exact: true })
    .click();
  await expect(preview).toHaveCount(0);
  await image.click();
  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
  await expect(
    page
      .getByRole("button", { name: "Open image preview", exact: true })
      .filter({ has: image })
  ).toBeFocused();
}
