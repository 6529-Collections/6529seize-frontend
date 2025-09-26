import React from "react";
import { render, screen } from "@testing-library/react";
import BlockFinderPage, {
  generateMetadata,
} from "@/app/tools/block-finder/page";
import type { Metadata } from "next";

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn().mockResolvedValue({
    title: "Mock Title",
    description: "Mock Desc",
  } as Metadata),
}));

jest.mock("@/app/tools/block-finder/page.client", () => ({
  __esModule: true,
  default: function MockBlockPickerClient() {
    return <div data-testid="block-picker-client">ClientLoaded</div>;
  },
}));

describe("tools/block-finder/page.tsx (server)", () => {
  it("renders the client component", () => {
    render(<BlockFinderPage />);
    expect(screen.getByTestId("block-picker-client")).toBeInTheDocument();
  });

  it("generateMetadata delegates to getAppMetadata with correct args", async () => {
    const { getAppMetadata } = jest.requireMock(
      "@/components/providers/metadata"
    );
    const md = await generateMetadata();
    expect(getAppMetadata).toHaveBeenCalledWith({
      title: "Block Finder",
      description: "Tools",
    });
    expect(md).toEqual({
      title: "Mock Title",
      description: "Mock Desc",
    });
  });
});
