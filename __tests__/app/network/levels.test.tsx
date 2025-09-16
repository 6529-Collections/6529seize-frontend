import React from "react";
import { render, screen } from "@testing-library/react";
import LevelsClient from "@/app/network/levels/page.client";
import { withMockedEnv } from "@/tests/utils/mock-env";

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
    await withMockedEnv(
      { BASE_ENDPOINT: "https://staging.6529.io" },
      async () => {
        jest.resetModules();

        const { generateMetadata } = await import("@/app/network/levels/page");

        const metadata = await generateMetadata();
        expect(metadata).toMatchObject({
          title: "Levels",
          description: expect.stringContaining("Network"),
          twitter: { card: "summary" },
          openGraph: {
            title: "Levels",
            description: expect.stringContaining("Network"),
            images: ["https://staging.6529.io/6529io.png"],
          },
        });
      }
    );

    jest.resetModules();
  });
});
