import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CmsThreeDViewer from "@/components/profile-cms/CmsThreeDViewer";
import type { CmsThreeDViewerConfig } from "@/components/profile-cms/CmsThreeDTypes";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const roomConfig: CmsThreeDViewerConfig = {
  description: "A small room.",
  fallbackHref: "/punk6529/rooms/work-1/index.html",
  kind: "room",
  placements: [
    {
      asset: {
        alt: "Square artwork",
        height: 1200,
        id: "asset-room-work",
        url: "data:image/png;base64,iVBORw0KGgo=",
        width: 1200,
      },
      detailHref: "/punk6529/nfts/ethereum/contract/1/index.html",
      displayMode: "faithful",
      id: "placement-work",
      label: "Square artwork",
      size: [1.2, 1.2],
    },
  ],
  poster: {
    alt: "Room poster",
    height: 900,
    id: "poster",
    url: "data:image/png;base64,iVBORw0KGgo=",
    width: 1600,
  },
  preset: "wall",
  requiresActivation: true,
  title: "Simple room",
};

describe("CmsThreeDViewer", () => {
  const originalMatchMedia = globalThis.matchMedia;
  const originalRequestFullscreen = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "requestFullscreen"
  );

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
    if (originalRequestFullscreen) {
      Object.defineProperty(
        HTMLElement.prototype,
        "requestFullscreen",
        originalRequestFullscreen
      );
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
    }
  });

  it("renders a deferred room canvas with canonical artwork links", () => {
    mockMatchMedia(false);

    render(<CmsThreeDViewer config={roomConfig} />);

    expect(screen.getByTestId("cms-3d-canvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter room" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Square artwork" })
    ).toHaveAttribute("href", "/punk6529/nfts/ethereum/contract/1/index.html");
  });

  it("keeps the 3D viewer embedded until fullscreen is requested", () => {
    mockMatchMedia(false);

    render(<CmsThreeDViewer config={roomConfig} />);

    const viewer = screen.getByLabelText("Simple room");
    expect(viewer).toHaveAttribute("data-cms-3d-fullscreen", "false");
    expect(viewer).toHaveClass("tw-w-full");
    expect(viewer).not.toHaveClass("tw-w-screen");
    expect(
      screen.getByRole("button", { name: "Full screen" })
    ).toBeVisible();
  });

  it("requests fullscreen on the viewer frame", () => {
    mockMatchMedia(false);
    const requestFullscreen = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    render(<CmsThreeDViewer config={roomConfig} />);

    const viewer = screen.getByLabelText("Simple room");
    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(requestFullscreen.mock.contexts[0]).toBe(viewer);
  });

  it("uses poster and 2D links on mobile", async () => {
    mockMatchMedia(true);

    render(<CmsThreeDViewer config={roomConfig} />);

    await waitFor(() =>
      expect(
        screen.getByText(
          "This mobile view uses the static poster and 2D links for a lighter, more reliable experience."
        )
      ).toBeInTheDocument()
    );
    expect(screen.queryByRole("button", { name: "Enter room" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Open 2D fallback" })
    ).toHaveAttribute("href", "/punk6529/rooms/work-1/index.html");
  });

  it("surfaces room asset budget warnings", () => {
    mockMatchMedia(false);

    render(
      <CmsThreeDViewer
        config={{
          ...roomConfig,
          budgetBytes: 1,
          placements: [
            {
              ...roomConfig.placements[0],
              asset: {
                ...roomConfig.placements[0].asset,
                fileSizeBytes: 2,
              },
            },
          ],
        }}
      />
    );

    expect(
      screen.getByText(
        "This 3D asset is above the declared performance budget, so loading may be slow."
      )
    ).toBeInTheDocument();
  });
});

function mockMatchMedia(isMobile: boolean): void {
  globalThis.matchMedia = jest.fn((query: string) => ({
    addEventListener: jest.fn(),
    matches: query === "(max-width: 767px)" ? isMobile : false,
    media: query,
    removeEventListener: jest.fn(),
  })) as typeof globalThis.matchMedia;
}
