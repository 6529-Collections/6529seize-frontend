import { generateMetadata } from "@/app/page";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";

describe("root page metadata", () => {
  it("uses the network state tagline for descriptions", () => {
    const metadata = generateMetadata();
    const expectedTitle = getAppEnvironment(publicEnv.BASE_ENDPOINT).title;

    expect(metadata.title).toBe(expectedTitle);
    expect(metadata.description).toBe("Building a decentralized network state");
    expect(metadata.openGraph?.title).toBe(expectedTitle);
    expect(metadata.openGraph?.description).toBe(
      "Building a decentralized network state"
    );
  });
});
