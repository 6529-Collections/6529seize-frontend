import { DYNAMIC_ROUTE_CONFIGS } from "@/hooks/breadcrumbs.config";

// Mock the API functions
jest.mock("@/hooks/breadcrumbs.api", () => ({
  fetchGradientName: jest.fn(),
  fetchProfileHandle: jest.fn(),
  fetchWaveName: jest.fn(),
  fetchMemeName: jest.fn(),
  fetchNextgenName: jest.fn(),
  fetchRememeName: jest.fn(),
  fetchMemeLabName: jest.fn(),
  fetchCollectionName: jest.fn(),
}));

describe("breadcrumbs.config", () => {
  describe("DYNAMIC_ROUTE_CONFIGS", () => {
    it("should have all expected route configurations", () => {
      const configTypes = DYNAMIC_ROUTE_CONFIGS.map((config) => config.type);

      expect(configTypes).toEqual([
        "gradient",
        "profile",
        "meme",
        "nextgen",
        "rememe",
        "meme-lab",
        "collection",
        "wave",
      ]);
    });

    it("should have unique route types", () => {
      const configTypes = DYNAMIC_ROUTE_CONFIGS.map((config) => config.type);
      const uniqueTypes = Array.from(new Set(configTypes));

      expect(uniqueTypes.length).toBe(configTypes.length);
    });

    it("should have all required properties for each config", () => {
      DYNAMIC_ROUTE_CONFIGS.forEach((config) => {
        expect(config).toHaveProperty("type");
        expect(config).toHaveProperty("pathPattern");
        expect(config).toHaveProperty("paramExtractor");
        expect(config).toHaveProperty("fetcher");
        expect(config).toHaveProperty("queryKeyBuilder");
        expect(config).toHaveProperty("crumbBuilder");
      });
    });
  });

  describe("gradient config", () => {
    const gradientConfig = DYNAMIC_ROUTE_CONFIGS.find(
      (c) => c.type === "gradient"
    )!;

    it("should match gradient path pattern", () => {
      expect(gradientConfig.pathPattern.test("6529-gradient")).toBe(true);
      expect(gradientConfig.pathPattern.test("other-path")).toBe(false);
    });

    it("should extract gradient id parameter", () => {
      const result = gradientConfig.paramExtractor(
        ["6529-gradient", "123"],
        {}
      );
      expect(result).toEqual({ id: "123" });
    });

    it("should return undefined for invalid parameters", () => {
      const result = gradientConfig.paramExtractor(["6529-gradient"], {});
      expect(result).toBeUndefined();
    });

    it("should build correct query key", () => {
      const queryKey = gradientConfig.queryKeyBuilder({ id: "123" });
      expect(queryKey).toEqual(["breadcrumb", "gradient", "123"]);
    });

    it("should build correct crumbs when loading", () => {
      const crumbs = gradientConfig.crumbBuilder(
        { id: "123" },
        null,
        true,
        ["6529-gradient", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "6529 Gradient", href: "/6529-gradient" },
        { display: "Loading..." },
      ]);
    });

    it("should build correct crumbs with data", () => {
      const crumbs = gradientConfig.crumbBuilder(
        { id: "123" },
        { name: "Test Gradient" },
        false,
        ["6529-gradient", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "6529 Gradient", href: "/6529-gradient" },
        { display: "Test Gradient" },
      ]);
    });

    it("should build correct crumbs without data", () => {
      const crumbs = gradientConfig.crumbBuilder(
        { id: "123" },
        null,
        false,
        ["6529-gradient", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "6529 Gradient", href: "/6529-gradient" },
        { display: "Gradient #123" },
      ]);
    });
  });

  describe("profile config", () => {
    const profileConfig = DYNAMIC_ROUTE_CONFIGS.find(
      (c) => c.type === "profile"
    )!;

    it("should match profile path pattern", () => {
      expect(profileConfig.pathPattern.test("profile")).toBe(true);
      expect(profileConfig.pathPattern.test("other-path")).toBe(false);
    });

    it("should extract profile handle parameter", () => {
      const result = profileConfig.paramExtractor(["profile", "testuser"], {});
      expect(result).toEqual({ handle: "testuser" });
    });

    it("should build correct query key", () => {
      const queryKey = profileConfig.queryKeyBuilder({ handle: "testuser" });
      expect(queryKey).toEqual(["breadcrumb", "profile", "testuser"]);
    });

    it("should build correct crumbs with data", () => {
      const crumbs = profileConfig.crumbBuilder(
        { handle: "testuser" },
        { handle: "TestUser" },
        false,
        ["profile", "testuser"],
        {}
      );
      expect(crumbs).toEqual([{ display: "TestUser" }]);
    });

    it("should build correct crumbs without data", () => {
      const crumbs = profileConfig.crumbBuilder(
        { handle: "testuser" },
        null,
        false,
        ["profile", "testuser"],
        {}
      );
      expect(crumbs).toEqual([{ display: "testuser" }]);
    });
  });

  describe("meme config", () => {
    const memeConfig = DYNAMIC_ROUTE_CONFIGS.find((c) => c.type === "meme")!;

    it("should match meme path pattern", () => {
      expect(memeConfig.pathPattern.test("the-memes")).toBe(true);
      expect(memeConfig.pathPattern.test("other-path")).toBe(false);
    });

    it("should extract meme id parameter", () => {
      const result = memeConfig.paramExtractor(["the-memes", "123"], {});
      expect(result).toEqual({ id: "123" });
    });

    it("should build correct query key", () => {
      const queryKey = memeConfig.queryKeyBuilder({ id: "123" });
      expect(queryKey).toEqual(["breadcrumb", "meme", "123"]);
    });

    it("should build correct crumbs for mint page", () => {
      const crumbs = memeConfig.crumbBuilder(
        { id: "mint" },
        null,
        false,
        ["the-memes", "mint"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "The Memes", href: "/the-memes" },
        { display: "Mint" },
      ]);
    });

    it("should build correct crumbs with data", () => {
      const crumbs = memeConfig.crumbBuilder(
        { id: "123" },
        { name: "Test Meme" },
        false,
        ["the-memes", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "The Memes", href: "/the-memes" },
        { display: "Test Meme" },
      ]);
    });

    it("should build correct crumbs without data", () => {
      const crumbs = memeConfig.crumbBuilder(
        { id: "123" },
        null,
        false,
        ["the-memes", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "The Memes", href: "/the-memes" },
        { display: "Meme #123" },
      ]);
    });
  });

  describe("nextgen config", () => {
    const nextgenConfig = DYNAMIC_ROUTE_CONFIGS.find(
      (c) => c.type === "nextgen"
    )!;

    it("should match nextgen path pattern", () => {
      expect(nextgenConfig.pathPattern.test("nextgen")).toBe(true);
      expect(nextgenConfig.pathPattern.test("other-path")).toBe(false);
    });

    it("should extract nextgen id parameter from third segment", () => {
      const result = nextgenConfig.paramExtractor(
        ["nextgen", "collection", "123"],
        {}
      );
      expect(result).toEqual({ id: "123", isCollection: true });
    });

    it("should build correct query key", () => {
      const queryKey = nextgenConfig.queryKeyBuilder({ id: "123" });
      expect(queryKey).toEqual(["breadcrumb", "nextgen", "123"]);
    });

    it("should build correct crumbs with data", () => {
      const crumbs = nextgenConfig.crumbBuilder(
        { id: "123" },
        { name: "Test Collection" },
        false,
        ["nextgen", "collection", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "Nextgen", href: "/nextgen" },
        { display: "Test Collection" },
      ]);
    });
  });

  describe("rememe config", () => {
    const rememeConfig = DYNAMIC_ROUTE_CONFIGS.find(
      (c) => c.type === "rememe"
    )!;

    it("should match rememe path pattern", () => {
      expect(rememeConfig.pathPattern.test("rememes")).toBe(true);
      expect(rememeConfig.pathPattern.test("other-path")).toBe(false);
    });

    it("should extract rememe contract and id parameters", () => {
      const result = rememeConfig.paramExtractor(
        ["rememes", "0x123", "456"],
        {}
      );
      expect(result).toEqual({ contract: "0x123", id: "456" });
    });

    it("should return undefined for incomplete parameters", () => {
      const result = rememeConfig.paramExtractor(["rememes", "0x123"], {});
      expect(result).toBeUndefined();
    });

    it("should build correct query key", () => {
      const queryKey = rememeConfig.queryKeyBuilder({
        contract: "0x123",
        id: "456",
      });
      expect(queryKey).toEqual(["breadcrumb", "rememe", "0x123", "456"]);
    });

    it("should build correct crumbs with data", () => {
      const crumbs = rememeConfig.crumbBuilder(
        { contract: "0x123", id: "456" },
        { name: "Test Rememe" },
        false,
        ["rememes", "0x123", "456"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "Rememes", href: "/rememes" },
        { display: "Test Rememe" },
      ]);
    });
  });

  describe("meme-lab config", () => {
    const memeLabConfig = DYNAMIC_ROUTE_CONFIGS.find(
      (c) => c.type === "meme-lab"
    )!;

    it("should match meme-lab path pattern", () => {
      expect(memeLabConfig.pathPattern.test("meme-lab")).toBe(true);
      expect(memeLabConfig.pathPattern.test("other-path")).toBe(false);
    });

    it("should extract meme-lab id parameter", () => {
      const result = memeLabConfig.paramExtractor(["meme-lab", "123"], {});
      expect(result).toEqual({ id: "123" });
    });

    it("should build correct crumbs with data", () => {
      const crumbs = memeLabConfig.crumbBuilder(
        { id: "123" },
        { name: "Test Lab" },
        false,
        ["meme-lab", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "Meme Lab", href: "/meme-lab" },
        { display: "Card #123 - Test Lab" },
      ]);
    });

    it("should build correct crumbs without data", () => {
      const crumbs = memeLabConfig.crumbBuilder(
        { id: "123" },
        null,
        false,
        ["meme-lab", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "Meme Lab", href: "/meme-lab" },
        { display: "Card #123" },
      ]);
    });
  });

  describe("collection config", () => {
    const collectionConfig = DYNAMIC_ROUTE_CONFIGS.find(
      (c) => c.type === "collection"
    )!;

    it("should match collection path pattern", () => {
      expect(collectionConfig.pathPattern.test("collections")).toBe(true);
      expect(collectionConfig.pathPattern.test("other-path")).toBe(false);
    });

    it("should extract collection id parameter", () => {
      const result = collectionConfig.paramExtractor(
        ["collections", "123"],
        {}
      );
      expect(result).toEqual({ id: "123" });
    });

    it("should build correct crumbs with data", () => {
      const crumbs = collectionConfig.crumbBuilder(
        { id: "123" },
        { name: "Test Collection" },
        false,
        ["collections", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "Collections", href: "/collections" },
        { display: "Test Collection" },
      ]);
    });
  });

  describe("wave config", () => {
    const waveConfig = DYNAMIC_ROUTE_CONFIGS.find((c) => c.type === "wave")!;

    it("should match wave path pattern", () => {
      expect(waveConfig.pathPattern.test("waves")).toBe(true);
      expect(waveConfig.pathPattern.test("other-path")).toBe(false);
    });

    it("should extract wave id from query parameter", () => {
      const result = waveConfig.paramExtractor(["waves"], { wave: "123" });
      expect(result).toEqual({ id: "123" });
    });

    it("should extract wave id from path parameter", () => {
      const result = waveConfig.paramExtractor(["waves", "123"], {});
      expect(result).toEqual({ id: "123" });
    });

    it("should build correct crumbs for waves", () => {
      const crumbs = waveConfig.crumbBuilder(
        { id: "123" },
        { name: "Test Wave" },
        false,
        ["waves", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "Waves", href: "/waves" },
        { display: "Test Wave" },
      ]);
    });

    it("should build correct crumbs for my-stream", () => {
      const crumbs = waveConfig.crumbBuilder(
        { id: "123" },
        { name: "Test Wave" },
        false,
        ["my-stream", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "My Stream", href: "/my-stream" },
        { display: "Test Wave" },
      ]);
    });

    it("should build correct crumbs without data", () => {
      const crumbs = waveConfig.crumbBuilder(
        { id: "123" },
        null,
        false,
        ["waves", "123"],
        {}
      );
      expect(crumbs).toEqual([
        { display: "Waves", href: "/waves" },
        { display: "Wave 123" },
      ]);
    });
  });
});
