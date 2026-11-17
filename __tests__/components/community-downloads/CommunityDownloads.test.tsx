import React from "react";
import { render, screen } from "@testing-library/react";
import CommunityDownloads from "@/components/community-downloads/CommunityDownloads";
import { TitleProvider } from "@/contexts/TitleContext";

// Mock the SCSS module
jest.mock(
  "@/components/community-downloads/CommunityDownloads.module.css",
  () => ({
    downloadLink: "downloadLink",
  })
);

// Mock useCapacitor
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useCapacitor from "@/hooks/useCapacitor";

const renderComponent = () => {
  return render(
    <TitleProvider>
      <CommunityDownloads />
    </TitleProvider>
  );
};

describe("CommunityDownloads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows 'Meme Subscriptions' if not iOS", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: false });

    renderComponent();
    expect(screen.getByText("Meme Subscriptions")).toBeInTheDocument();
  });

  it("hides 'Meme Subscriptions' in the iOS app", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: true });

    renderComponent();
    expect(screen.queryByText("Meme Subscriptions")).not.toBeInTheDocument();
  });

  it("shows all the static links", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: false });

    renderComponent();
    ["Network Metrics", "Rememes", "Team", "Royalties"].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });
});
