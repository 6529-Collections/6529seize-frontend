import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import React from "react";
import { render, screen } from "@testing-library/react";
import TeamDownloads, { generateMetadata } from "@/app/open-data/team/page";

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

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn((customMetadata: unknown) => customMetadata),
}));

describe("Open Data team page", () => {
  it("renders component and sets title", () => {
    render(<TeamDownloads />);
    expect(
      screen.getByRole("heading", { name: "Team Downloads" })
    ).toBeInTheDocument();
  });

  it("exposes metadata", async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: "Team | Open Data",
      description: t(DEFAULT_LOCALE, "pageMetadata.openDataTeam.description"),
    });
  });
});
