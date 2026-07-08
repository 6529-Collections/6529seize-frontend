import type { Metadata } from "next";
import type { ComponentType } from "react";
import { render } from "@testing-library/react";

type MigratedWordPressPageTestCase = {
  readonly Component: ComponentType;
  readonly generateMetadata: () => Metadata | Promise<Metadata>;
  readonly heading: RegExp;
  readonly title: string;
};

export async function expectMigratedWordPressPageRenders({
  Component,
  generateMetadata,
  heading,
  title,
}: MigratedWordPressPageTestCase) {
  render(<Component />);

  const metadata = await generateMetadata();
  expect(metadata.title).toBe(title);
  expect(metadata.openGraph).toMatchObject({
    siteName: "6529.io",
    title,
  });

  expect(document.querySelector("main")).toHaveAttribute(
    "data-content-source",
    "migrated-wordpress"
  );
  expect(document.querySelector("h1")?.textContent).toMatch(heading);
}
