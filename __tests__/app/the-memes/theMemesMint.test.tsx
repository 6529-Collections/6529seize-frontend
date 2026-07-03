import TheMemesMintPage, { generateMetadata } from "@/app/the-memes/mint/page";
import { AuthContext } from "@/components/auth/Auth";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/dynamic", () => () => (props: any) => (
  <div data-testid="dynamic" {...props} />
));

jest.mock("@/components/the-memes/TheMemesMint", () => ({
  __esModule: true,
  default: ({ nft }: { nft: { id: number } }) => (
    <div data-testid="mint-component" data-nft-id={nft.id} />
  ),
}));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/styles/Home.module.css", () => ({ main: "main-class" }));

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const nft = { id: 1, name: "Meme", mint_date: "2020-01-01" } as any;

describe("TheMemesMintPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders minting component and calls API", async () => {
    (getAppCommonHeaders as jest.Mock).mockResolvedValue({ h: "1" });
    (commonApiFetch as jest.Mock).mockResolvedValue(nft);

    const jsx = await TheMemesMintPage();

    render(
      <AuthContext.Provider value={{} as any}>{jsx}</AuthContext.Provider>
    );

    const mint = await screen.findByTestId("mint-component");

    expect(mint).toBeInTheDocument();
    expect(mint).toHaveAttribute("data-nft-id", "1");
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "memes_latest",
      headers: { h: "1" },
    });
  });

  it("exports metadata", async () => {
    const metadata = await generateMetadata();
    const [image] = metadata.openGraph?.images as {
      alt: string;
      height: number;
      url: string;
      width: number;
    }[];
    const url = new URL(image.url);

    expect(metadata).toMatchObject({
      title: "Mint | The Memes",
      description: "Collections | 6529.io",
      icons: { icon: "/favicon.ico" },
      other: { version: "test-version" },
      twitter: {
        card: "summary_large_image",
        site: "@6529Collections",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "6529.io",
      title: "Mint | The Memes",
      description: "Collections | 6529.io",
    });
    expect(image).toMatchObject({
      alt: "The Memes mint social card",
      height: 630,
      width: 1200,
    });
    expect(url.pathname).toBe("/api/og-metadata/collections/the-memes");
    expect(url.searchParams.get("subtitle")).toBe(
      "Latest The Memes mint on 6529.io"
    );
    expect(url.searchParams.get("title")).toBe("Mint | The Memes");
  });
});
