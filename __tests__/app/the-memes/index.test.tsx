import TheMemesPage, { generateMetadata } from "@/app/the-memes/page";
import { render, screen } from "@testing-library/react";

const mockTheMemesComponent = jest.fn(
  ({ locale }: { readonly locale?: string }) => (
    <div data-locale={locale} data-testid="the-memes-page" />
  )
);

jest.mock("@/components/the-memes/TheMemes", () => ({
  __esModule: true,
  default: (props: { readonly locale?: string }) => mockTheMemesComponent(props),
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
    expect(mockTheMemesComponent).toHaveBeenCalledWith({ locale: "de-DE" });
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

    expect(metadata.description).toContain("Sammlungen");
  });
});
