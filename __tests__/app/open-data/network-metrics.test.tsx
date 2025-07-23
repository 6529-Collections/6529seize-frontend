import React from "react";
import { render, screen } from "@testing-library/react";
import NetworkMetrics, {
  generateMetadata,
} from "@/app/open-data/network-metrics/page";

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
    title: "Network Metrics",
    description: "Open Data",
  }),
}));

describe("Open Data network metrics page", () => {
  it("renders metrics component and sets title", () => {
    render(<NetworkMetrics />);
    expect(screen.getByText("Network Metrics")).toBeInTheDocument();
  });

  it("exposes metadata", async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: "Network Metrics",
      description: "Open Data",
    });
  });
});
