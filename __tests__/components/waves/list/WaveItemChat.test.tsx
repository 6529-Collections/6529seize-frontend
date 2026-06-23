import { render, screen } from "@testing-library/react";
import React from "react";
import WaveItemChat from "@/components/waves/list/WaveItemChat";

jest.mock("@/hooks/useWavePreviewById", () => ({
  useWavePreviewById: jest.fn(),
}));
jest.mock("@/components/waves/ChatItemHrefButtons", () => (p: any) => (
  <div data-testid="href-buttons">{p.relativeHref}</div>
));
jest.mock("@/components/waves/list/WaveItemWide", () => (p: any) => (
  <div data-testid="wave-item">{p.wave ? p.wave.id : "none"}</div>
));

const { useWavePreviewById } = require("@/hooks/useWavePreviewById");

describe("WaveItemChat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes wave data and relative link", () => {
    (useWavePreviewById as jest.Mock).mockReturnValue({ wave: { id: "w1" } });
    render(<WaveItemChat href="https://a" waveId="w1" />);
    expect(useWavePreviewById).toHaveBeenCalledWith("w1");
    expect(screen.getByTestId("wave-item")).toHaveTextContent("w1");
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/waves/w1");
  });

  it("passes through preview cache misses", () => {
    (useWavePreviewById as jest.Mock).mockReturnValue({ wave: undefined });

    render(<WaveItemChat href="https://a" waveId="missing-wave" />);

    expect(useWavePreviewById).toHaveBeenCalledWith("missing-wave");
    expect(screen.getByTestId("wave-item")).toHaveTextContent("none");
  });
});
