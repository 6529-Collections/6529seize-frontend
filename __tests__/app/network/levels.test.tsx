import React from "react";
import { render, screen } from "@testing-library/react";
import LevelsClient from "@/app/network/levels/page.client";
import { generateMetadata } from "@/app/network/levels/page";

// Mock child components
jest.mock("@/components/levels/ProgressChart", () => () => (
  <div data-testid="progress-chart" />
));
jest.mock("@/components/levels/TableOfLevels", () => () => (
  <div data-testid="table-of-levels" />
));

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

// Ensure BASE_ENDPOINT is available for metadata
process.env.BASE_ENDPOINT = "https://example.com";

describe("LevelsPage (App Router)", () => {
  it("sets title and renders components", () => {
    render(<LevelsClient />);

    expect(screen.getByText("Levels")).toBeInTheDocument();
    expect(screen.getByTestId("progress-chart")).toBeInTheDocument();
    expect(screen.getByTestId("table-of-levels")).toBeInTheDocument();

    // Ensure key explanatory text appears
    expect(
      screen.getByText(/Levels are our integrated metric/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/they may be adjusted to better meet their objectives/i)
    ).toBeInTheDocument();
  });

  it("exports correct metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata).toMatchObject({
      title: "Levels",
      description: expect.stringContaining("Network"),
      twitter: { card: "summary" },
      openGraph: {
        title: "Levels",
        description: expect.stringContaining("Network"),
        images: ["https://example.com/6529io.png"],
      },
    });
  });
});
