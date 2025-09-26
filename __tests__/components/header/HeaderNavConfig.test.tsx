import {
  getDesktopNavigation,
  toolsBottomItems,
  type NavContext,
} from "@/components/header/HeaderNavConfig";
import { AboutSection } from "@/enums";

describe("HeaderNavConfig", () => {
  const mockContext: NavContext = {
    showWaves: true,
    appWalletsSupported: true,
    capacitorIsIos: false,
    country: "US",
    pathname: "/",
  };

  describe("getDesktopNavigation", () => {
    it("returns all main navigation sections", () => {
      const navigation = getDesktopNavigation(mockContext);

      expect(navigation).toHaveLength(5);
      expect(navigation.map((item) => item.title)).toEqual([
        "Brain",
        "Collections",
        "Network",
        "Tools",
        "About",
      ]);
    });

    it("Brain section condition returns false when showWaves is false", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
        showWaves: false,
      });

      const brainSection = navigation.find((item) => item.title === "Brain");
      expect(brainSection).toBeDefined();
      expect(
        brainSection?.condition?.({
          ...mockContext,
          showWaves: false,
        })
      ).toBe(false);
    });

    it("Brain section condition returns true when showWaves is true", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
        showWaves: true,
      });

      const brainSection = navigation.find((item) => item.title === "Brain");
      expect(brainSection).toBeDefined();
      expect(brainSection?.condition?.(mockContext)).toBe(true);
      expect(brainSection?.items).toEqual([
        { name: "My Stream", path: "/my-stream" },
        { name: "Waves", path: "/waves" },
      ]);
    });

    it("filters App Wallets when appWalletsSupported is false", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
        appWalletsSupported: false,
      });

      const toolsSection = navigation.find((item) => item.title === "Tools");
      const appWalletsLink = toolsSection?.items?.find(
        (item) => item.name === "App Wallets"
      );
      expect(
        appWalletsLink?.condition?.({
          ...mockContext,
          appWalletsSupported: false,
        })
      ).toBe(false);
    });

    it("includes App Wallets when appWalletsSupported is true", () => {
      const navigation = getDesktopNavigation(mockContext);

      const toolsSection = navigation.find((item) => item.title === "Tools");
      const appWalletsLink = toolsSection?.items?.find(
        (item) => item.name === "App Wallets"
      );
      expect(appWalletsLink?.condition?.(mockContext)).toBe(true);
    });

    it("filters Memes Subscriptions on iOS for non-US countries", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
        capacitorIsIos: true,
        country: "CA",
      });

      const toolsSection = navigation.find((item) => item.title === "Tools");
      const memesToolsSection = toolsSection?.sections?.find(
        (section) => section.name === "The Memes Tools"
      );

      const subscriptionsLink = memesToolsSection?.items.find(
        (item) => item.name === "Memes Subscriptions"
      );

      expect(
        subscriptionsLink?.condition?.({
          ...mockContext,
          capacitorIsIos: true,
          country: "CA",
        })
      ).toBe(false);
    });

    it("includes Memes Subscriptions on iOS for US country", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
        capacitorIsIos: true,
        country: "US",
      });

      const toolsSection = navigation.find((item) => item.title === "Tools");
      const memesToolsSection = toolsSection?.sections?.find(
        (section) => section.name === "The Memes Tools"
      );
      const subscriptionsLink = memesToolsSection?.items.find(
        (item) => item.name === "Memes Subscriptions"
      );

      expect(
        subscriptionsLink?.condition?.({
          ...mockContext,
          capacitorIsIos: true,
          country: "US",
        })
      ).toBe(true);
    });

    it("includes Memes Subscriptions on non-iOS devices regardless of country", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
        capacitorIsIos: false,
        country: "CA",
      });

      const toolsSection = navigation.find((item) => item.title === "Tools");
      const memesToolsSection = toolsSection?.sections?.find(
        (section) => section.name === "The Memes Tools"
      );
      const subscriptionsLink = memesToolsSection?.items.find(
        (item) => item.name === "Memes Subscriptions"
      );

      expect(
        subscriptionsLink?.condition?.({
          ...mockContext,
          capacitorIsIos: false,
          country: "CA",
        })
      ).toBe(true);
    });

    it("applies About subscriptions filtering correctly", () => {
      // Test iOS + non-US country scenario for About section subscriptions
      const navigation = getDesktopNavigation({
        ...mockContext,
        capacitorIsIos: true,
        country: "DE",
      });

      const aboutSection = navigation.find((item) => item.title === "About");
      const nftsSection = aboutSection?.sections?.find(
        (section) => section.name === "NFTs"
      );
      const subscriptionsLink = nftsSection?.items.find(
        (item) => item.name === "Subscriptions"
      );

      expect(
        subscriptionsLink?.condition?.({
          ...mockContext,
          capacitorIsIos: true,
          country: "DE",
        })
      ).toBe(false);
    });

    it("checks Network section ", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
      });

      const networkSection = navigation.find(
        (item) => item.title === "Network"
      );

      // expect to include 'Memes Calendar'
      expect(
        networkSection?.items?.some((item) => item.name === "Memes Calendar")
      ).toBe(true);

      // expect to include 'Identities'
      expect(
        networkSection?.items?.some((item) => item.name === "Identities")
      ).toBe(true);

      // expect to include 'Activity'
      expect(
        networkSection?.items?.some((item) => item.name === "Activity")
      ).toBe(true);

      // expect to include 'Groups'
      expect(
        networkSection?.items?.some((item) => item.name === "Groups")
      ).toBe(true);

      // expect to include 'NFT Activity'
      expect(
        networkSection?.items?.some((item) => item.name === "NFT Activity")
      ).toBe(true);

      //'Metrics' section
      const metricsSection = networkSection?.sections?.find(
        (section) => section.name === "Metrics"
      );

      expect(metricsSection).toBeDefined();

      expect(
        metricsSection?.items?.some((item) => item.name === "Definitions")
      ).toBe(true);

      expect(
        metricsSection?.items?.some((item) => item.name === "Network Stats")
      ).toBe(true);

      expect(
        metricsSection?.items?.some((item) => item.name === "Levels")
      ).toBe(true);
    });

    it("checks The Memes Tools section ", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
      });

      const toolsSection = navigation.find((item) => item.title === "Tools");
      const memesToolsSection = toolsSection?.sections?.find(
        (section) => section.name === "The Memes Tools"
      );

      // expect to include 'Memes Gas'
      expect(
        memesToolsSection?.items.some((item) => item.name === "Memes Gas")
      ).toBe(true);

      // expect to include 'Memes Accounting'
      expect(
        memesToolsSection?.items.some(
          (item) => item.name === "Memes Accounting"
        )
      ).toBe(true);
    });

    it("returns About section with correct className function", () => {
      const navigation = getDesktopNavigation({
        ...mockContext,
        pathname: "/about/memes",
      });

      const aboutSection = navigation.find((item) => item.title === "About");
      expect(typeof aboutSection?.className).toBe("function");

      // Test the className function
      const classNameFn = aboutSection?.className as (
        context: NavContext
      ) => string;
      expect(
        classNameFn({
          ...mockContext,
          pathname: "/about/memes",
        })
      ).toBe("active");

      expect(
        classNameFn({
          ...mockContext,
          pathname: "/waves",
        })
      ).toBe("");
    });

    it("includes correct AboutSection enum values in paths", () => {
      const navigation = getDesktopNavigation(mockContext);
      const aboutSection = navigation.find((item) => item.title === "About");

      // Test main items
      expect(aboutSection?.items?.[0].path).toBe(
        `/about/${AboutSection.GDRC1}`
      );

      // Test NFTs section paths
      const nftsSection = aboutSection?.sections?.find(
        (section) => section.name === "NFTs"
      );
      expect(
        nftsSection?.items.some(
          (item) => item.path === `/about/${AboutSection.MEMES}`
        )
      ).toBe(true);
      expect(
        nftsSection?.items.some(
          (item) => item.path === `/about/${AboutSection.SUBSCRIPTIONS}`
        )
      ).toBe(true);
      expect(
        nftsSection?.items.some(
          (item) => item.path === `/about/${AboutSection.MINTING}`
        )
      ).toBe(true);
      expect(
        nftsSection?.items.some(
          (item) => item.path === `/about/${AboutSection.NAKAMOTO_THRESHOLD}`
        )
      ).toBe(true);
      expect(
        nftsSection?.items.some(
          (item) => item.path === `/about/${AboutSection.MEME_LAB}`
        )
      ).toBe(true);
      expect(
        nftsSection?.items.some(
          (item) => item.path === `/about/${AboutSection.GRADIENTS}`
        )
      ).toBe(true);
    });

    it("includes Tools section hasDividerAfter property", () => {
      const navigation = getDesktopNavigation(mockContext);
      const toolsSection = navigation.find((item) => item.title === "Tools");

      expect(toolsSection?.hasDividerAfter).toBe(true);
    });

    it("includes NFT Delegation section with no hasDivider property", () => {
      const navigation = getDesktopNavigation(mockContext);
      const toolsSection = navigation.find((item) => item.title === "Tools");
      const nftDelegationSection = toolsSection?.sections?.find(
        (section) => section.name === "NFT Delegation"
      );

      expect(nftDelegationSection).toBeDefined();

      expect(nftDelegationSection?.hasDivider).toBeUndefined();
    });
  });

  describe("toolsBottomItems", () => {
    it("includes all expected bottom items", () => {
      expect(toolsBottomItems).toHaveLength(4);
      expect(toolsBottomItems).toEqual([
        { name: "API", path: "/tools/api" },
        { name: "EMMA", path: "/emma" },
        { name: "Block Finder", path: "/tools/block-finder" },
        { name: "Open Data", path: "/open-data" },
      ]);
    });

    it("contains valid path formats", () => {
      toolsBottomItems.forEach((item) => {
        expect(item.path).toMatch(/^\//);
        expect(typeof item.name).toBe("string");
        expect(item.name.length).toBeGreaterThan(0);
      });
    });
  });
});
