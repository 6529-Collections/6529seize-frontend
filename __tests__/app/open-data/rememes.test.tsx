import React from "react";
import { screen } from "@testing-library/react";
import RememesDownloads, {
  generateMetadata,
} from "@/app/open-data/rememes/page";
import { renderWithQueryClient } from "../../utils/reactQuery";

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

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn().mockResolvedValue({ count: 0, data: [] }),
  fetchAllPages: jest.fn(),
}));

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn().mockReturnValue({
    title: "Rememes",
    description: "Open Data",
  }),
}));

describe("Open Data rememes page", () => {
  it("renders metrics component and sets title", () => {
    renderWithQueryClient(<RememesDownloads />);
    expect(
      screen.getByRole("heading", { name: "Rememes Downloads" })
    ).toBeInTheDocument();
  });

  it("exposes metadata", async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: "Rememes",
      description: "Open Data",
    });
  });
});
