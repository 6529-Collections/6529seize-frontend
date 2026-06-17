import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import MemeDistributionPage, {
  generateMetadata,
} from "@/app/the-memes/[id]/distribution/page";
import { MEME_FOCUS } from "@/components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "@/constants/constants";

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

describe("Meme Distribution Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders distribution component", () => {
    return MemeDistributionPage({
      searchParams: Promise.resolve({}),
    }).then((page) => {
      render(page);
      expect(screen.getByTestId("distribution")).toBeInTheDocument();
      expect(screen.getByTestId("distribution")).toHaveAttribute(
        "locale",
        "en-US"
      );
    });
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

  it("delegates generateMetadata", async () => {
    mockShared.mockResolvedValue({ title: "My Title" });

    const res = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({ locale: "de-DE" }),
    });

    expect(mockShared).toHaveBeenCalledWith(
      MEMES_CONTRACT,
      "123",
      MEME_FOCUS.LIVE,
      true,
      "de-DE"
    );

    expect(res).toEqual({ title: "My Title" });
  });
});
