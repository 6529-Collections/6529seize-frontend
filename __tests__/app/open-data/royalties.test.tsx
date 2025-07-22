import React from "react";
import { render, screen } from "@testing-library/react";
import RoyaltiesDownloads, {
  generateMetadata,
} from "@/app/open-data/royalties/page";

// Mock TitleContext
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

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn().mockReturnValue({
    title: "Royalties",
    description: "Open Data",
  }),
}));

describe("Open Data royalties page", () => {
  it("renders royalties component and sets title", () => {
    render(<RoyaltiesDownloads />);
    expect(screen.getByText("Royalties")).toBeInTheDocument();
  });

  it("exposes metadata", async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: "Royalties",
      description: "Open Data",
    });
  });
});
