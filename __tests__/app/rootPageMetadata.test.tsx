import { generateMetadata } from "@/app/(home)/page";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";

describe("root page metadata", () => {
  it("uses the hero tagline for descriptions", () => {
    const metadata = generateMetadata();
    const expectedTitle = getAppEnvironment(publicEnv.BASE_ENDPOINT).title;
    const expectedDescription =
      "A peer-to-peer protocol for network organizations. Decentralized, permissionless, and global. Anyone can fund, build, and coordinate network-scaled organizations or public goods.";

    expect(metadata.title).toBe(expectedTitle);
    expect(metadata.description).toBe(expectedDescription);
    expect(metadata.openGraph?.title).toBe(expectedTitle);
    expect(metadata.openGraph?.description).toBe(expectedDescription);
  });
});
