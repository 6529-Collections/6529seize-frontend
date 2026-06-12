import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import MemeDistributionPage, {
  generateMetadata,
} from "@/app/meme-lab/[id]/distribution/page";
import { MEME_FOCUS } from "@/components/the-memes/MemeShared";
import { MEMELAB_CONTRACT } from "@/constants/constants";

jest.mock("@/components/distribution/Distribution", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="distribution" {...props} />,
}));

jest.mock("@/components/the-memes/MemeShared", () => ({
  getSharedAppServerSideProps: jest.fn(),
  MEME_FOCUS: {
    LIVE: "live",
  },
}));

const mockShared = require("@/components/the-memes/MemeShared")
  .getSharedAppServerSideProps as jest.Mock;

describe("Meme Lab Distribution Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes default locale to the distribution component", async () => {
    const page = await MemeDistributionPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByTestId("distribution")).toHaveAttribute(
      "locale",
      "en-US"
    );
  });

  it("passes supported locale to the distribution component", async () => {
    const page = await MemeDistributionPage({
      searchParams: Promise.resolve({ locale: "de-DE" }),
    });

    render(page);

    expect(screen.getByTestId("distribution")).toHaveAttribute(
      "locale",
      "de-DE"
    );
  });

  it("falls back to the default locale for unsupported locale values", async () => {
    const page = await MemeDistributionPage({
      searchParams: Promise.resolve({ locale: "unsupported-LC" }),
    });

    render(page);

    expect(screen.getByTestId("distribution")).toHaveAttribute(
      "locale",
      "en-US"
    );
  });

  it("delegates generateMetadata with locale", async () => {
    mockShared.mockResolvedValue({ title: "My Title" });

    const res = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({ locale: "de-DE" }),
    });

    expect(mockShared).toHaveBeenCalledWith(
      MEMELAB_CONTRACT,
      "123",
      MEME_FOCUS.LIVE,
      true,
      "de-DE"
    );

    expect(res).toEqual({ title: "My Title" });
  });
});
