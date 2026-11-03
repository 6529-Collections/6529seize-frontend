import DelegationPage, {
  generateMetadata,
} from "@/app/delegation/[...section]/page";
import { MEMES_CONTRACT } from "@/constants/constants";
import { DelegationCenterSection } from "@/types/enums";

describe("delegation page server", () => {
  it("returns props for known section", async () => {
    const params = Promise.resolve({ section: ["delegation-center"] });
    const searchParams = Promise.resolve({
      address: "0x1",
      collection: MEMES_CONTRACT.toLowerCase(),
      use_case: "2",
    });
    const element = await DelegationPage({ params, searchParams });
    expect(element.props).toMatchObject({
      section: DelegationCenterSection.CENTER,
      addressQuery: "0x1",
      collectionQuery: MEMES_CONTRACT,
      useCaseQuery: 2,
    });
    const metadata = await generateMetadata({ params });
    expect(metadata).toEqual(
      expect.objectContaining({ title: "Safe Collecting | 6529.io" })
    );
  });

  it.each([
    [{ collection: "c", use_case: "999" }],
    [{ collection: "0x1", use_case: "998" }],
    [{ collection: "MEMES", use_case: "2abc" }],
  ])("passes only listed delegation presets to the form: %j", async (query) => {
    const element = await DelegationPage({
      params: Promise.resolve({ section: ["register-delegation"] }),
      searchParams: Promise.resolve(query),
    });
    expect(element.props).toMatchObject({
      section: DelegationCenterSection.REGISTER_DELEGATION,
      collectionQuery: query.collection === "MEMES" ? MEMES_CONTRACT : "",
      useCaseQuery: 0,
    });
  });

  it.each([
    [["delegation-center"], DelegationCenterSection.CENTER],
    [["unknown", "path"], DelegationCenterSection.HTML],
  ])("parses presets the same way on %j", async (section, expectedSection) => {
    const listed = await DelegationPage({
      params: Promise.resolve({ section }),
      searchParams: Promise.resolve({ collection: "MEMES", use_case: "3" }),
    });
    expect(listed.props).toMatchObject({
      section: expectedSection,
      collectionQuery: MEMES_CONTRACT,
      useCaseQuery: 3,
    });

    const unlisted = await DelegationPage({
      params: Promise.resolve({ section }),
      searchParams: Promise.resolve({ collection: "c", use_case: "999" }),
    });
    expect(unlisted.props).toMatchObject({
      section: expectedSection,
      collectionQuery: "",
      useCaseQuery: 0,
    });
  });

  it("titles the wallet architecture route as the TAP guide", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ section: ["wallet-architecture"] }),
    });
    expect(metadata).toEqual(
      expect.objectContaining({
        title: "The Three Address Protocol (TAP) | 6529.io",
      })
    );
  });

  it("keeps the legacy wallet architecture article under the FAQ", async () => {
    const section = [
      "delegation-faq",
      "reference-overview-wallet-architecture",
    ];
    const element = await DelegationPage({
      params: Promise.resolve({ section }),
      searchParams: Promise.resolve({}),
    });
    expect(element.props).toMatchObject({
      section: DelegationCenterSection.HTML,
      path: section,
    });
    const metadata = await generateMetadata({
      params: Promise.resolve({ section }),
    });
    expect(metadata).toEqual(
      expect.objectContaining({ title: "Wallet Architecture | 6529.io" })
    );
  });

  it("returns html section for unknown path", async () => {
    const params = Promise.resolve({ section: ["unknown", "path"] });
    const element = await DelegationPage({
      params,
      searchParams: Promise.resolve({}),
    });
    expect(element.props).toMatchObject({
      section: DelegationCenterSection.HTML,
      path: ["unknown", "path"],
    });
  });
});

describe("Wallet Checker canonicals", () => {
  const wallet = "0xd73e55a3f739fbd783f7a2a307831afc31c6510b";
  it.each([
    [{}, ""],
    [{ address: wallet }, `?address=${wallet}`],
    [
      {
        address: `0x${wallet.slice(2).toUpperCase()}`,
        utm_source: "share",
        collection: "ignored",
        use_case: "2",
      },
      `?address=${wallet}`,
    ],
    [
      { address: "0x0000000000000000000000000000000000000529" },
      "?address=0x0000000000000000000000000000000000000529",
    ],
    [{ address: "not-a-wallet" }, ""],
    [{ address: "name.eth" }, "?address=name.eth"],
    [{ address: [wallet, "0x0000000000000000000000000000000000000529"] }, ""],
  ])(
    "preserves wallet identity and ignores non-result parameters: %j",
    async (searchParams, query) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ section: ["wallet-checker"] }),
        searchParams: Promise.resolve(searchParams),
      });
      const canonical = `https://test.6529.io/safe-collecting/wallet-checker${query}`;
      expect(metadata.alternates?.canonical).toBe(canonical);
      expect(metadata.openGraph?.url).toBe(canonical);
    }
  );

  it.each([["delegation-faq"], ["wallet-checker", "extra"]])(
    "does not assign the checker canonical to the article path %s",
    async (...section) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ section }),
        searchParams: Promise.resolve({ address: wallet }),
      });
      expect(metadata.alternates).toBeUndefined();
    }
  );
});
