import TheMemesPage, { generateMetadata } from "@/app/the-memes/page";
import { getTheMemesInitialData } from "@/app/the-memes/theMemesInitialData";
import { render, screen } from "@testing-library/react";

const mockTheMemesComponent = jest.fn(
  ({
    initialData,
    locale,
  }: {
    readonly initialData?: unknown;
    readonly locale?: string;
  }) => (
    <div
      data-has-initial-data={initialData !== undefined}
      data-locale={locale}
      data-testid="the-memes-page"
    />
  )
);

jest.mock("@/components/the-memes/TheMemes", () => ({
  __esModule: true,
  default: (props: { readonly locale?: string }) =>
    mockTheMemesComponent(props),
}));

jest.mock("@/app/the-memes/theMemesInitialData", () => ({
  getTheMemesInitialData: jest.fn(),
}));

jest.mock("@/lib/structured-data/json-ld", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/lib/structured-data/nft", () => ({
  buildCollectionPageJsonLd: jest.fn(() => ({})),
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.io",
  },
}));

describe("The Memes page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getTheMemesInitialData).mockResolvedValue(undefined);
  });

  it("passes normalized locale search params to the client list page", async () => {
    const page = await TheMemesPage({
      searchParams: Promise.resolve({ locale: "DE-de" }),
    });

    render(page);

    expect(await screen.findByTestId("the-memes-page")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
    expect(mockTheMemesComponent).toHaveBeenCalledWith({
      initialData: undefined,
      locale: "de-DE",
    });
    expect(getTheMemesInitialData).toHaveBeenCalledWith({ locale: "DE-de" });
  });

  it("passes the public first-page seed to the rendered collection", async () => {
    const initialData = { nfts: [], nextPage: undefined };
    jest.mocked(getTheMemesInitialData).mockResolvedValue(initialData);

    const page = await TheMemesPage({
      searchParams: Promise.resolve({ locale: "de-DE" }),
    });

    render(page);

    expect(await screen.findByTestId("the-memes-page")).toHaveAttribute(
      "data-has-initial-data",
      "true"
    );
    expect(mockTheMemesComponent).toHaveBeenCalledWith({
      initialData,
      locale: "de-DE",
    });
  });

  it("passes the default locale when no supported locale is present", async () => {
    const page = await TheMemesPage({
      searchParams: Promise.resolve({ locale: "unsupported-LC" }),
    });

    render(page);

    expect(await screen.findByTestId("the-memes-page")).toHaveAttribute(
      "data-locale",
      "en-US"
    );
  });

  it("localizes metadata from supported locale search params", async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ locale: "de-DE" }),
    });

    expect(metadata.title).toContain("Sammlungen");
    expect(metadata.description).toContain("6529 NFT collection");
  });
});
