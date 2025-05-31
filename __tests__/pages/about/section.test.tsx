import { getServerSideProps, AboutSection } from "../../../pages/about/[section]";

beforeEach(() => {
  global.fetch = jest.fn((url: string) =>
    Promise.resolve({ status: 200, text: () => Promise.resolve(url) })
  ) as any;
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("getServerSideProps", () => {
  it("redirects old tos path", async () => {
    const result = await getServerSideProps({ query: { section: "tos" } } as any, {} as any, {} as any);
    expect(result).toEqual({
      redirect: { destination: "/about/terms-of-service", permanent: false },
    });
  });

  it("redirects invalid section", async () => {
    const result = await getServerSideProps({ query: { section: "unknown" } } as any, {} as any, {} as any);
    expect(result).toEqual({
      redirect: { permanent: false, destination: "/404" },
      props: {},
    });
  });

  it("returns content for valid section", async () => {
    const result: any = await getServerSideProps({ query: { section: AboutSection.MEMES } } as any, {} as any, {} as any);
    expect(result.props.section).toBe(AboutSection.MEMES);
    expect(result.props.sectionTitle).toBe("THE MEMES");
    expect(result.props.gdrc1Text).toContain("gdrc1.html");
  });
});
