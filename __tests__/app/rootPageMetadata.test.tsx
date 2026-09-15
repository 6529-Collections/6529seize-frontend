import { generateMetadata } from "@/app/(home)/page";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";

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
