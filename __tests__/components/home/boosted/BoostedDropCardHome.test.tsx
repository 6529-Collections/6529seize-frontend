import BoostedDropCardHome from "@/components/home/boosted/BoostedDropCardHome";
import { AuthContext } from "@/components/auth/Auth";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

const mockToggleBoost = jest.fn();
const mockUseInView = jest.fn();
const mockBoostedDropLinkPreview = jest.fn();
const originalImage = global.Image;

type MockImageInstance = {
  naturalHeight: number;
  naturalWidth: number;
  onload: null | (() => void);
  src: string;
};
type MockVideoInstance = {
  addEventListener: jest.Mock;
  dispatchLoadedMetadata: () => void;
  load: jest.Mock;
  preload: string;
  removeAttribute: jest.Mock;
  removeEventListener: jest.Mock;
  src: string;
  videoHeight: number;
  videoWidth: number;
};
type ResizeObserverHarness = {
  restore: () => void;
  trigger: () => void;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/common/profile/ProfileAvatar", () => ({
  __esModule: true,
  default: ({ alt }: { readonly alt: string }) => (
    <div data-testid="profile-avatar">{alt}</div>
  ),
  ProfileBadgeSize: {
    SMALL: "small",
  },
}));

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => ({
    __esModule: true,
    default: () => <div data-testid="drop-media" />,
  })
);

jest.mock("@/components/waves/drops/ContentDisplay", () => ({
  __esModule: true,
  default: ({ content }: { readonly content: unknown }) => (
    <div data-testid="content-display">{JSON.stringify(content)}</div>
  ),
}));

jest.mock("@/components/home/boosted/BoostedDropLinkPreview", () => ({
  __esModule: true,
  default: (props: { readonly href: string; readonly variant?: string }) => {
    mockBoostedDropLinkPreview(props);
    return <div data-testid="link-preview">{props.href}</div>;
  },
}));

jest.mock("@/hooks/useInView", () => ({
  useInView: (...args: any[]) => mockUseInView(...args),
}));

jest.mock("@/hooks/drops/useDropBoostMutation", () => ({
  useDropBoostMutation: () => ({
    toggleBoost: mockToggleBoost,
    isPending: false,
  }),
}));

jest.mock("@/helpers/waves/drop.helpers", () => ({
  convertApiDropToExtendedDrop: (drop: unknown) => ({
    ...(drop as Record<string, unknown>),
    type: "FULL",
  }),
}));

jest.mock("@/helpers/Helpers", () => ({
  getTimeAgoShort: () => "1m",
}));

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (value: string) => value,
  ImageScale: {
    AUTOx450: "AUTOx450",
    W_AUTO_H_50: "W_AUTO_H_50",
  },
}));

const createDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "drop-1",
    serial_no: 42,
    created_at: 1710000000000,
    boosts: 7,
    context_profile_context: { boosted: false },
    author: {
      handle: "alice",
      pfp: null,
      level: 1,
      primary_address: "0xabc",
    },
    wave: {
      id: "wave-1",
      name: "Spec Wave",
      picture: null,
    },
    parts: [
      {
        content: "Plain text content",
        media: [],
      },
    ],
    ...overrides,
  }) as any;

const renderWithAuth = (
  ui: ReactElement,
  {
    connectedProfile = { handle: "viewer" },
  }: {
    readonly connectedProfile?: unknown;
  } = {}
) =>
  render(
    <AuthContext.Provider value={{ connectedProfile } as any}>
      {ui}
    </AuthContext.Provider>
  );

const createInViewResult = (inView = true) =>
  [{ current: null }, inView] as const;

const installImageMock = () => {
  const imageInstances: MockImageInstance[] = [];
  const MockImage = jest.fn().mockImplementation(() => {
    const instance: MockImageInstance = {
      naturalHeight: 0,
      naturalWidth: 0,
      onload: null,
      src: "",
    };
    imageInstances.push(instance);
    return instance;
  });

  Object.defineProperty(global, "Image", {
    configurable: true,
    value: MockImage,
    writable: true,
  });

  return imageInstances;
};

const restoreImageMock = () => {
  Object.defineProperty(global, "Image", {
    configurable: true,
    value: originalImage,
    writable: true,
  });
};

const installVideoElementMock = () => {
  const videoInstances: MockVideoInstance[] = [];
  const originalCreateElement = document.createElement.bind(document);
  const createElementSpy = jest
    .spyOn(document, "createElement")
    .mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions
    ) => {
      if (tagName !== "video") {
        return originalCreateElement(tagName, options);
      }

      const listeners = new Map<string, Array<() => void>>();
      const instance: MockVideoInstance = {
        addEventListener: jest.fn((eventName: string, listener: () => void) => {
          listeners.set(eventName, [
            ...(listeners.get(eventName) ?? []),
            listener,
          ]);
        }),
        dispatchLoadedMetadata: () => {
          for (const listener of listeners.get("loadedmetadata") ?? []) {
            listener();
          }
        },
        load: jest.fn(),
        preload: "",
        removeAttribute: jest.fn(),
        removeEventListener: jest.fn(
          (eventName: string, listener: () => void) => {
            listeners.set(
              eventName,
              (listeners.get(eventName) ?? []).filter(
                (registeredListener) => registeredListener !== listener
              )
            );
          }
        ),
        src: "",
        videoHeight: 0,
        videoWidth: 0,
      };

      videoInstances.push(instance);
      return instance as any;
    }) as any);

  return {
    restore: () => createElementSpy.mockRestore(),
    videoInstances,
  };
};

const createMediaDrop = (url: string, mimeType = "image/png") =>
  createDrop({
    parts: [
      {
        content: null,
        media: [{ mime_type: mimeType, url }],
      },
    ],
  });

const installResizeObserverMock = (): ResizeObserverHarness => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const callbacks: ResizeObserverCallback[] = [];

  globalThis.ResizeObserver = jest
    .fn()
    .mockImplementation((callback: ResizeObserverCallback) => {
      callbacks.push(callback);
      return {
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
      };
    }) as unknown as typeof ResizeObserver;

  return {
    restore: () => {
      globalThis.ResizeObserver = originalResizeObserver;
    },
    trigger: () => {
      for (const callback of callbacks) {
        callback([], {} as ResizeObserver);
      }
    },
  };
};

const createDomRect = (height: number): DOMRect =>
  ({
    bottom: height,
    height,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top: 0,
    width: 0,
    x: 0,
    y: 0,
  }) as DOMRect;

const mockElementRect = (element: Element, height: number) =>
  jest
    .spyOn(element, "getBoundingClientRect")
    .mockReturnValue(createDomRect(height));

describe("BoostedDropCardHome", () => {
  beforeEach(() => {
    mockBoostedDropLinkPreview.mockClear();
    mockToggleBoost.mockReset();
    mockUseInView.mockImplementation(() => createInViewResult(true));
    restoreImageMock();
  });

  afterAll(() => {
    restoreImageMock();
  });

  it("renders the wave pill in the default home variant", () => {
    renderWithAuth(
      <BoostedDropCardHome drop={createDrop()} onClick={jest.fn()} />
    );

    expect(screen.getByText("Spec Wave")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Boost" })
    ).not.toBeInTheDocument();
  });

  it("keeps the fixed-height text frame in the home variant", () => {
    renderWithAuth(
      <BoostedDropCardHome drop={createDrop()} onClick={jest.fn()} />
    );

    expect(screen.getByTestId("boosted-drop-content-frame")).toHaveClass(
      "tw-aspect-[2/1]"
    );
  });

  it("renders chat variant rank and hides the wave pill", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={jest.fn()}
        variant="chat"
        rank={2}
      />
    );

    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.queryByText("Spec Wave")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Boost" })).toBeInTheDocument();
  });

  it("drops the fixed-height text frame in the chat variant", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={jest.fn()}
        variant="chat"
        rank={2}
      />
    );

    expect(screen.getByTestId("boosted-drop-content-frame")).not.toHaveClass(
      "tw-aspect-[2/1]"
    );
  });

  it("keeps the fixed-height media frame in the home variant", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop({
          parts: [
            {
              content: null,
              media: [
                { mime_type: "image/png", url: "https://example.com/a.png" },
              ],
            },
          ],
        })}
        onClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveClass(
      "tw-aspect-[2/1]"
    );
  });

  it("drops the homepage media ratio classes in the chat variant", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createMediaDrop("https://example.com/a.png")}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(screen.getByTestId("boosted-drop-media-frame")).not.toHaveClass(
      "tw-aspect-[2/1]"
    );
  });

  it("renders a preview card without duplicating the preview URL in text content", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop({
          parts: [
            {
              content: "Read this https://example.com/article",
              media: [],
            },
          ],
        })}
        onClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("link-preview")).toHaveTextContent(
      "https://example.com/article"
    );
    expect(screen.getAllByTestId("content-display")).toHaveLength(2);
    expect(screen.getAllByTestId("content-display")[0]).toHaveTextContent(
      "Read this"
    );
    expect(screen.getAllByTestId("content-display")[0]).not.toHaveTextContent(
      "https://example.com/article"
    );
    expect(mockBoostedDropLinkPreview).toHaveBeenLastCalledWith(
      expect.objectContaining({
        href: "https://example.com/article",
        variant: "home",
      })
    );
  });

  it("passes the chat preview variant for standalone urls in chat boosted cards", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop({
          parts: [
            {
              content: "Read this https://example.com/article",
              media: [],
            },
          ],
        })}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(mockBoostedDropLinkPreview).toHaveBeenLastCalledWith(
      expect.objectContaining({
        href: "https://example.com/article",
        variant: "chat",
      })
    );
  });

  it("keeps caption content for chat cards with lead media", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop({
          parts: [
            {
              content: "Caption context",
              media: [
                { mime_type: "image/png", url: "https://example.com/a.png" },
              ],
            },
          ],
        })}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(screen.getAllByTestId("drop-media")).toHaveLength(1);
    expect(screen.getByTestId("content-display")).toHaveTextContent(
      "Caption context"
    );
  });

  it("keeps only supplemental attachments in the chat content block after the lead media", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop({
          parts: [
            {
              content: "Caption context",
              media: [
                { mime_type: "image/png", url: "https://example.com/a.png" },
                { mime_type: "image/png", url: "https://example.com/b.png" },
              ],
            },
          ],
        })}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(screen.getAllByTestId("drop-media")).toHaveLength(1);
    expect(screen.getByTestId("content-display")).toHaveTextContent(
      "Caption context"
    );
    expect(screen.getByTestId("content-display")).toHaveTextContent(
      "https://example.com/b.png"
    );
    expect(screen.getByTestId("content-display")).not.toHaveTextContent(
      "https://example.com/a.png"
    );
  });

  it("hides the home preview text when the link preview overflows the frame", () => {
    const resizeObserver = installResizeObserverMock();
    const originalGetComputedStyle = window.getComputedStyle;
    let containerRectSpy: jest.SpyInstance | undefined;
    let previewRectSpy: jest.SpyInstance | undefined;
    let textRectSpy: jest.SpyInstance | undefined;
    let getComputedStyleSpy: jest.SpyInstance | undefined;

    try {
      renderWithAuth(
        <BoostedDropCardHome
          drop={createDrop({
            parts: [
              {
                content: "Read this https://example.com/article",
                media: [],
              },
            ],
          })}
          onClick={jest.fn()}
        />
      );

      const container = screen.getByTestId("boosted-drop-content-frame");
      const preview = screen.getByTestId("link-preview").parentElement;
      const textMeasure =
        screen.getAllByTestId("content-display")[0]?.parentElement;
      const wrapper = preview?.parentElement;

      expect(preview).not.toBeNull();
      expect(textMeasure).not.toBeNull();
      expect(wrapper).not.toBeNull();

      containerRectSpy = mockElementRect(container, 120);
      previewRectSpy = mockElementRect(preview!, 100);
      textRectSpy = mockElementRect(textMeasure!, 40);
      getComputedStyleSpy = jest
        .spyOn(window, "getComputedStyle")
        .mockImplementation((element: Element) => {
          if (element === wrapper) {
            return { rowGap: "12px" } as CSSStyleDeclaration;
          }

          return originalGetComputedStyle.call(window, element);
        });

      Object.defineProperty(preview!, "clientHeight", {
        configurable: true,
        value: 100,
      });
      Object.defineProperty(preview!, "scrollHeight", {
        configurable: true,
        value: 160,
      });

      act(() => {
        resizeObserver.trigger();
      });

      expect(screen.getByTestId("link-preview")).toBeInTheDocument();
      expect(screen.getAllByTestId("content-display")).toHaveLength(1);
    } finally {
      containerRectSpy?.mockRestore();
      previewRectSpy?.mockRestore();
      textRectSpy?.mockRestore();
      getComputedStyleSpy?.mockRestore();
      resizeObserver.restore();
    }
  });

  it("uses the fallback ratio until image metadata resolves in the chat variant", () => {
    const imageInstances = installImageMock();

    renderWithAuth(
      <BoostedDropCardHome
        drop={createMediaDrop("https://example.com/a.png")}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveStyle({
      aspectRatio: "8 / 5",
    });

    act(() => {
      const firstImage = imageInstances[0]!;
      firstImage.naturalWidth = 1200;
      firstImage.naturalHeight = 600;
      firstImage.onload?.();
    });

    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveStyle({
      aspectRatio: "1200 / 600",
    });
  });

  it("does not preload chat image metadata while the card is out of view", () => {
    const imageInstances = installImageMock();
    mockUseInView.mockImplementation(() => createInViewResult(false));

    renderWithAuth(
      <BoostedDropCardHome
        drop={createMediaDrop("https://example.com/a.png")}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(imageInstances).toHaveLength(0);
    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveStyle({
      aspectRatio: "8 / 5",
    });
  });

  it("does not keep the previous media ratio while a new chat image is loading", () => {
    const imageInstances = installImageMock();

    const { rerender } = renderWithAuth(
      <BoostedDropCardHome
        drop={createMediaDrop("https://example.com/a.png")}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    act(() => {
      const firstImage = imageInstances[0]!;
      firstImage.naturalWidth = 1200;
      firstImage.naturalHeight = 600;
      firstImage.onload?.();
    });

    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveStyle({
      aspectRatio: "1200 / 600",
    });

    rerender(
      <AuthContext.Provider
        value={{ connectedProfile: { handle: "viewer" } } as any}
      >
        <BoostedDropCardHome
          drop={createMediaDrop("https://example.com/b.png")}
          onClick={jest.fn()}
          variant="chat"
          rank={1}
        />
      </AuthContext.Provider>
    );

    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveStyle({
      aspectRatio: "8 / 5",
    });

    act(() => {
      const secondImage = imageInstances[1]!;
      secondImage.naturalWidth = 900;
      secondImage.naturalHeight = 1200;
      secondImage.onload?.();
    });

    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveStyle({
      aspectRatio: "900 / 1200",
    });
  });

  it("updates the chat media ratio after video metadata resolves", () => {
    const { restore, videoInstances } = installVideoElementMock();

    try {
      renderWithAuth(
        <BoostedDropCardHome
          drop={createMediaDrop("https://example.com/a.mp4", "video/mp4")}
          onClick={jest.fn()}
          variant="chat"
          rank={1}
        />
      );

      expect(screen.getByTestId("boosted-drop-media-frame")).toHaveStyle({
        aspectRatio: "8 / 5",
      });

      act(() => {
        const firstVideo = videoInstances[0]!;
        firstVideo.videoWidth = 1920;
        firstVideo.videoHeight = 1080;
        firstVideo.dispatchLoadedMetadata();
      });

      expect(screen.getByTestId("boosted-drop-media-frame")).toHaveStyle({
        aspectRatio: "1920 / 1080",
      });
    } finally {
      restore();
    }
  });

  it("keeps the chat boost button from triggering the outer card click", () => {
    const onClick = jest.fn();

    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={onClick}
        variant="chat"
        rank={1}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Boost" }));

    expect(mockToggleBoost).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not trigger the outer card keyboard handler from the author link", () => {
    const onClick = jest.fn();

    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={onClick}
        variant="chat"
        rank={1}
      />
    );

    fireEvent.keyDown(screen.getByRole("link", { name: /alice/i }), {
      key: "Enter",
    });

    expect(onClick).not.toHaveBeenCalled();
  });
});
