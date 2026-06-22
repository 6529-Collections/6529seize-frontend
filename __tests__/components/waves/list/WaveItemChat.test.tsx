import { render, screen } from "@testing-library/react";
import React from "react";
import WaveItemChat from "@/components/waves/list/WaveItemChat";

jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));
jest.mock("@/hooks/useCachedWavePreviewById", () => ({
  useCachedWavePreviewById: jest.fn(),
}));
jest.mock("@/components/waves/ChatItemHrefButtons", () => (p: any) => (
  <div data-testid="href-buttons">{p.relativeHref}</div>
));
jest.mock("@/components/waves/list/WaveItemWide", () => (p: any) => (
  <div data-testid="wave-item">
    {p.wave?.id ?? p.wavePreview?.id ?? "none"}
  </div>
));

const { useWaveById } = require("@/hooks/useWaveById");
const { useCachedWavePreviewById } = require("@/hooks/useCachedWavePreviewById");

describe("WaveItemChat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes wave data and relative link", () => {
    (useWaveById as jest.Mock).mockReturnValue({ wave: { id: "w1" } });
    (useCachedWavePreviewById as jest.Mock).mockReturnValue({
      wavePreview: undefined,
    });
    render(<WaveItemChat href="https://a" waveId="w1" />);
    expect(useWaveById).toHaveBeenCalledWith("w1", { enabled: false });
    expect(screen.getByTestId("wave-item")).toHaveTextContent("w1");
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/waves/w1");
  });

  it("uses cached preview data without fetching wave detail", () => {
    (useWaveById as jest.Mock).mockReturnValue({ wave: undefined });
    (useCachedWavePreviewById as jest.Mock).mockReturnValue({
      wavePreview: { id: "preview-wave" },
    });

    render(<WaveItemChat href="https://a" waveId="preview-wave" />);

    expect(useWaveById).toHaveBeenCalledWith("preview-wave", {
      enabled: false,
    });
    expect(useCachedWavePreviewById).toHaveBeenCalledWith("preview-wave");
    expect(screen.getByTestId("wave-item")).toHaveTextContent("preview-wave");
  });
});
