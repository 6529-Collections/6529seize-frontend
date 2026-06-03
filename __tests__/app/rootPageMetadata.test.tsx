import { generateMetadata } from "@/app/page";

describe("root page metadata", () => {
  it("uses the network state tagline for descriptions", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("6529.io");
    expect(metadata.description).toBe("Building a decentralized network state");
    expect(metadata.openGraph?.title).toBe("6529.io");
    expect(metadata.openGraph?.description).toBe(
      "Building a decentralized network state"
    );
  });
});
