const mockConnection = jest.fn(async (): Promise<void> => undefined);
const mockStartHomeHeroData = jest.fn();

jest.mock("next/server", () => ({ connection: () => mockConnection() }));
jest.mock("@/app/(home)/home-hero-data.server", () => ({
  startHomeHeroData: () => mockStartHomeHeroData(),
}));

import Page, { generateMetadata } from "@/app/(home)/page";
import HomeHeroSeed from "@/components/home/now-minting/HomeHeroSeed";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { isValidElement, type ReactElement, type ReactNode } from "react";

describe("root page metadata", () => {
  it("uses the network state tagline for descriptions", () => {
    const metadata = generateMetadata();
    const expectedTitle = getAppEnvironment(publicEnv.BASE_ENDPOINT).title;
    const expectedDescription =
      "Building a decentralized network state: a decentralized, permissionless global network that funds, builds, and coordinates public-goods work across art, science, culture, and technology.";

    expect(metadata.title).toBe(expectedTitle);
    expect(metadata.description).toBe(expectedDescription);
    expect(metadata.openGraph?.title).toBe(expectedTitle);
    expect(metadata.openGraph?.description).toBe(expectedDescription);
  });
});

describe("root page", () => {
  it("starts the hero data only for a request and hands it to the seed", async () => {
    const heroData = { latestMeme: Promise.resolve(null) };
    const calls: string[] = [];
    mockConnection.mockImplementationOnce(async () => {
      calls.push("connection");
    });
    mockStartHomeHeroData.mockImplementationOnce(() => {
      calls.push("start");
      return heroData;
    });

    const page = await Page();
    const children = (page.props as { readonly children: ReactNode })
      .children as ReactNode[];
    const seed = children.find(
      (child): child is ReactElement<{ readonly data: unknown }> =>
        isValidElement(child) && child.type === HomeHeroSeed
    );

    expect(calls).toEqual(["connection", "start"]);
    expect(seed?.props.data).toBe(heroData);
  });
});
