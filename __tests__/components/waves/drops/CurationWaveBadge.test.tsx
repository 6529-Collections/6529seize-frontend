import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CurationWaveBadge } from "@/components/waves/drops/CurationWaveBadge";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ hasTouchScreen: false })),
}));

jest.mock("@/helpers/image.helpers", () => ({
  ImageScale: {
    W_AUTO_H_50: "AUTOx50",
  },
  getScaledImageUri: (url: string) => `scaled:${url}`,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, onError }: any) => (
    <img data-testid="wave-image" src={src} alt={alt} onError={onError} />
  ),
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <span data-testid="wave-fallback-icon" />,
}));

jest.mock("@/components/utils/tooltip/HoverCard", () => ({
  __esModule: true,
  default: ({ children, content, ariaLabel }: any) => (
    <div>
      <div data-testid="hover-card" aria-label={ariaLabel}>
        {content}
      </div>
      {children}
    </div>
  ),
}));
jest.mock("@/components/waves/drops/CurationWavePreviewCard", () => ({
  CurationWavePreviewCard: ({ fallbackName }: any) => (
    <div data-testid="preview-card">{fallbackName ?? "Featured wave"}</div>
  ),
}));

describe("CurationWaveBadge", () => {
  it("renders the wave image and tooltip copy from the wave name", () => {
    const onBadgeClick = jest.fn();

    render(
      <CurationWaveBadge
        waveId="wave-1"
        waveName="Profile Wave"
        wavePfp="https://example.com/wave.png"
        onBadgeClick={onBadgeClick}
      />
    );

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Open Profile Wave"
    );
    expect(screen.getByTestId("wave-image")).toHaveAttribute(
      "src",
      "scaled:https://example.com/wave.png"
    );
    expect(screen.getByTestId("hover-card")).toHaveAttribute(
      "aria-label",
      "Wave details for Profile Wave"
    );
    expect(screen.getByTestId("preview-card")).toHaveTextContent(
      "Profile Wave"
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onBadgeClick).toHaveBeenCalledTimes(1);
  });

  it("falls back to featured wave copy and a wave icon without an image", () => {
    render(<CurationWaveBadge waveId="wave-1" />);

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Open featured wave"
    );
    expect(screen.getByTestId("hover-card")).toHaveAttribute(
      "aria-label",
      "Wave details for Featured wave"
    );
    expect(screen.getByTestId("preview-card")).toHaveTextContent(
      "Featured wave"
    );
    expect(screen.queryByTestId("wave-image")).toBeNull();
    expect(screen.getByTestId("wave-fallback-icon")).toBeInTheDocument();
  });

  it("falls back to a wave icon when the image fails to load", () => {
    render(
      <CurationWaveBadge
        waveId="wave-1"
        waveName="Profile Wave"
        wavePfp="https://example.com/wave.png"
      />
    );

    fireEvent.error(screen.getByTestId("wave-image"));

    expect(screen.queryByTestId("wave-image")).toBeNull();
    expect(screen.getByTestId("wave-fallback-icon")).toBeInTheDocument();
    expect(screen.getByTestId("preview-card")).toHaveTextContent(
      "Profile Wave"
    );
  });
});
