import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import MemeDistributionPage, {
  generateMetadata,
} from "@/app/the-memes/[id]/distribution/page";
import { MEMES_CONTRACT } from "@/constants";
import { MEME_FOCUS } from "@/components/the-memes/MemeShared";

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
    render(<MemeDistributionPage />);
    expect(screen.getByTestId("distribution")).toBeInTheDocument();
  });

  it("delegates generateMetadata", async () => {
    mockShared.mockResolvedValue({ title: "My Title" });

    const res = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
    });

    expect(mockShared).toHaveBeenCalledWith(
      MEMES_CONTRACT,
      "123",
      MEME_FOCUS.LIVE,
      true
    );

    expect(res).toEqual({ title: "My Title" });
  });
});
