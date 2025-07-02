import React from "react";
import { render, screen } from "@testing-library/react";
import TheMemesMintPage, { generateMetadata } from "@/app/the-memes/mint/page";
import { AuthContext } from "@/components/auth/Auth";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("next/dynamic", () => () => (props: any) => (
  <div data-testid="dynamic" {...props} />
));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/styles/Home.module.scss", () => ({ main: "main-class" }));

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const nft = { id: 1, name: "Meme", mint_date: "2020-01-01" } as any;

describe("TheMemesMintPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASE_ENDPOINT = "https://test.6529.io";
  });

  it("renders minting component and calls API", async () => {
    (getAppCommonHeaders as jest.Mock).mockResolvedValue({ h: "1" });
    (commonApiFetch as jest.Mock).mockResolvedValue(nft);

    const jsx = await TheMemesMintPage();

    render(
      <AuthContext.Provider value={{} as any}>{jsx}</AuthContext.Provider>
    );

    const dynamic = await screen.findByTestId("dynamic");

    expect(dynamic).toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "memes_latest",
      headers: { h: "1" },
    });
  });

  it("exports metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata).toEqual({
      title: "Mint | The Memes",
      description: "Collections | 6529.io",
      icons: { icon: "/favicon.ico" },
      openGraph: {
        images: ["https://test.6529.io/memes-preview.png"],
        title: "Mint | The Memes",
        description: "Collections | 6529.io",
      },
      twitter: {
        card: "summary_large_image",
      },
    });
  });
});
