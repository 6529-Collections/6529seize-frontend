import { render, screen } from "@testing-library/react";

import WavesPageClient from "@/app/waves/page.client";

jest.mock("@/components/waves/layout/WavesLayout", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="waves-layout">{children}</div>
  ),
}));

jest.mock("@/components/waves/WavesView", () => ({
  __esModule: true,
  default: () => <div data-testid="waves-view" />,
}));

jest.mock("@/components/waves/PublicWaveFeedGate", () => ({
  __esModule: true,
  default: ({
    children,
    fallback,
    waveId,
  }: {
    readonly children: React.ReactNode;
    readonly fallback: React.ReactNode;
    readonly waveId: string;
  }) => (
    <div data-testid={`public-feed-gate-${waveId}`}>
      {fallback}
      {children}
    </div>
  ),
}));

describe("WavesPageClient", () => {
  it("preserves the existing interactive view when no public fallback is supplied", () => {
    render(<WavesPageClient />);

    expect(screen.getByTestId("waves-layout")).toBeInTheDocument();
    expect(screen.getByTestId("waves-view")).toBeInTheDocument();
    expect(screen.queryByText("Public server content")).not.toBeInTheDocument();
  });

  it("layers a matching public fallback alongside the interactive view", () => {
    render(
      <WavesPageClient
        publicFeedFallback={<div>Public server content</div>}
        publicFeedWaveId="wave-1"
      />
    );

    expect(screen.getByTestId("public-feed-gate-wave-1")).toHaveTextContent(
      "Public server content"
    );
    expect(screen.getByTestId("waves-view")).toBeInTheDocument();
  });
});
