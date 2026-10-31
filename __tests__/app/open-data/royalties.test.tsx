import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import React from "react";
import { screen } from "@testing-library/react";
import RoyaltiesDownloads, {
  generateMetadata,
} from "@/app/open-data/royalties/page";
import { renderWithQueryClient } from "../../utils/reactQuery";

// Mock TitleContext
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

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn().mockResolvedValue({ count: 0, data: [] }),
  fetchAllPages: jest.fn(),
}));

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn((customMetadata: unknown) => customMetadata),
}));

describe("Open Data royalties page", () => {
  it("renders royalties component and sets title", () => {
    renderWithQueryClient(<RoyaltiesDownloads />);
    expect(
      screen.getByRole("heading", { name: "Royalties Downloads" })
    ).toBeInTheDocument();
  });

  it("exposes metadata", async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: "Royalties | Open Data",
      description: t(
        DEFAULT_LOCALE,
        "pageMetadata.openDataRoyalties.description"
      ),
    });
  });
});
