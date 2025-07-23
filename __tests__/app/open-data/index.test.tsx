import React from "react";
import { render, screen } from "@testing-library/react";
import Downloads, { generateMetadata } from "@/app/open-data/page";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";

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
    title: "Open Data",
  }),
}));

describe("Open Data page", () => {
  it("renders downloads component and sets title", () => {
    render(
      <CookieConsentProvider>
        <Downloads />
      </CookieConsentProvider>
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Open Data");
  });

  it("exposes metadata", async () => {
    await expect(generateMetadata()).resolves.toEqual({ title: "Open Data" });
  });
});
