import React from "react";
import { render, screen } from "@testing-library/react";
import CommunityDownloads from "@/components/community-downloads/CommunityDownloads";
import { TitleProvider } from "@/contexts/TitleContext";

// Mock the SCSS module
jest.mock(
  "@/components/community-downloads/CommunityDownloads.module.scss",
  () => ({
    downloadLink: "downloadLink",
  })
);

// Mock useCapacitor
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock useCookieConsent
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(),
}));

import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";

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
    (useCookieConsent as jest.Mock).mockReturnValue({ country: "DE" });

    renderComponent();
    expect(screen.getByText("Meme Subscriptions")).toBeInTheDocument();
  });

  it("shows 'Meme Subscriptions' if iOS and country is US", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: true });
    (useCookieConsent as jest.Mock).mockReturnValue({ country: "US" });

    renderComponent();
    expect(screen.getByText("Meme Subscriptions")).toBeInTheDocument();
  });

  it("hides 'Meme Subscriptions' if iOS and country is not US", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: true });
    (useCookieConsent as jest.Mock).mockReturnValue({ country: "FR" });

    renderComponent();
    expect(screen.queryByText("Meme Subscriptions")).not.toBeInTheDocument();
  });

  it("shows all the static links", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: false });
    (useCookieConsent as jest.Mock).mockReturnValue({ country: "US" });

    renderComponent();
    [
      "Network Metrics",
      "Consolidated Network Metrics",
      "Rememes",
      "Team",
      "Royalties",
    ].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });
});
