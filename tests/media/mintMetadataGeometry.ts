import type { Locator } from "@playwright/test";

/** Read related geometry in one browser task, never across separate layouts. */
export async function readMintMetadataGeometry({
  date,
  price,
  edition,
  links,
}: {
  readonly date: Locator;
  readonly price: Locator;
  readonly edition: Locator;
  readonly links: Locator;
}) {
  const handles = await Promise.all([
    date.elementHandle(),
    price.elementHandle(),
    edition.elementHandle(),
  ]);
  const linkHandles = await links.elementHandles();
  try {
    const [dateElement, priceElement, editionElement] = handles;
    if (!dateElement || !priceElement || !editionElement) {
      throw new Error("All mint metadata labels must remain available");
    }
    return await dateElement.evaluate(
      (dateLabel, { priceLabel, editionLabel, mintLinks }) => {
        const bounds = (element: Node | null) => {
          if (!(element instanceof Element) || !element.isConnected) {
            throw new Error("Mint metadata changed during measurement");
          }
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        };
        return {
          date: bounds(dateLabel.parentElement),
          price: bounds(priceLabel.parentElement),
          edition: bounds(editionLabel),
          valueOffset:
            bounds(dateLabel.nextElementSibling).y -
            bounds(priceLabel.nextElementSibling).y,
          links: mintLinks.map(bounds),
        };
      },
      {
        priceLabel: priceElement,
        editionLabel: editionElement,
        mintLinks: linkHandles,
      }
    );
  } finally {
    await Promise.all(
      [...handles, ...linkHandles].map((handle) => handle?.dispose())
    );
  }
}
