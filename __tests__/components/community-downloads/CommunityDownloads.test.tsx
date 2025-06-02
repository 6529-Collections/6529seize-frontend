import React from "react";
import { render, screen } from "@testing-library/react";
import CommunityDownloads from "../../../components/community-downloads/CommunityDownloads";

// Mock the SCSS module
jest.mock(
  "../../../components/community-downloads/CommunityDownloads.module.scss",
  () => ({
    downloadLink: "downloadLink",
  })
);

// Mock useCapacitor
jest.mock("../../../hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock useCookieConsent
jest.mock("../../../components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(),
}));

import useCapacitor from "../../../hooks/useCapacitor";
import { useCookieConsent } from "../../../components/cookies/CookieConsentContext";

describe("CommunityDownloads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows 'Meme Subscriptions' if not iOS", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: false });
    (useCookieConsent as jest.Mock).mockReturnValue({ country: "DE" });

    render(<CommunityDownloads />);
    expect(screen.getByText("Meme Subscriptions")).toBeInTheDocument();
  });

  it("shows 'Meme Subscriptions' if iOS and country is US", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: true });
    (useCookieConsent as jest.Mock).mockReturnValue({ country: "US" });

    render(<CommunityDownloads />);
    expect(screen.getByText("Meme Subscriptions")).toBeInTheDocument();
  });

  it("hides 'Meme Subscriptions' if iOS and country is not US", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: true });
    (useCookieConsent as jest.Mock).mockReturnValue({ country: "FR" });

    render(<CommunityDownloads />);
    expect(screen.queryByText("Meme Subscriptions")).not.toBeInTheDocument();
  });

  it("shows all the static links", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isIos: false });
    (useCookieConsent as jest.Mock).mockReturnValue({ country: "US" });

    render(<CommunityDownloads />);
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
