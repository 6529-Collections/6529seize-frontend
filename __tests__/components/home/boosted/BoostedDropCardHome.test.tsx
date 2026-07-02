import BoostedDropCardHome from "@/components/home/boosted/BoostedDropCardHome";
import { AuthContext } from "@/components/auth/Auth";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  createElement,
  type ImgHTMLAttributes,
  type ReactElement,
} from "react";

const mockToggleBoost = jest.fn();
const mockBoostedDropLinkPreview = jest.fn();
const mockDropListItemContentMedia = jest.fn();
type ResizeObserverHarness = {
  restore: () => void;
  trigger: () => void;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ImgHTMLAttributes<HTMLImageElement>) =>
    createElement("img", props),
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
    default: (props: {
      readonly media_mime_type: string;
      readonly media_url: string;
    }) => {
      mockDropListItemContentMedia(props);
      return <div data-testid="drop-media" />;
    },
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

const getBoostPill = (): HTMLElement => {
  const pill = screen.getByText("+2").parentElement;

  expect(pill).not.toBeNull();

  return pill as HTMLElement;
};

describe("BoostedDropCardHome", () => {
  beforeEach(() => {
    mockBoostedDropLinkPreview.mockClear();
    mockDropListItemContentMedia.mockClear();
    mockToggleBoost.mockReset();
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

  it("uses a quiet boosted header in the chat variant", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={jest.fn()}
        variant="chat"
        rank={2}
      />
    );

    expect(screen.queryByText("#2")).not.toBeInTheDocument();
    expect(screen.queryByText("1m")).not.toBeInTheDocument();
    expect(screen.queryByText("Spec Wave")).not.toBeInTheDocument();
    expect(screen.getByText("Boosted drop")).toBeInTheDocument();
    expect(screen.getByText("7 boosts")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Boost drop by alice" })
    ).toBeInTheDocument();
  });

  it("keeps the chat boost metadata out of the old overlay fade treatment", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={jest.fn()}
        variant="chat"
        rank={2}
      />
    );

    expect(screen.getByText("7 boosts")).not.toHaveClass(
      "desktop-hover:group-hover:tw-opacity-0",
      "tw-opacity-0",
      "tw-pointer-events-none"
    );
  });

  it("does not add chat-only boosted metadata to the home variant", () => {
    renderWithAuth(
      <BoostedDropCardHome drop={createDrop()} onClick={jest.fn()} />
    );

    const pill = getBoostPill();

    expect(screen.queryByText("Boosted drop")).not.toBeInTheDocument();
    expect(screen.queryByText("7 boosts")).not.toBeInTheDocument();
    expect(pill).toBeInTheDocument();
  });

  it("uses a capped auto-height text frame in the chat variant", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={jest.fn()}
        variant="chat"
        rank={2}
      />
    );

    expect(screen.getByTestId("boosted-drop-content-frame")).toHaveClass(
      "tw-max-h-[11rem]"
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

  it("caps the media frame height in the chat variant", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createMediaDrop("https://example.com/a.png")}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveClass(
      "tw-aspect-[2/1]"
    );
    expect(screen.getByTestId("boosted-drop-media-frame")).toHaveClass(
      "tw-max-h-[11rem]"
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

  it("uses the compact chat preview variant for standalone urls in chat boosted cards", () => {
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

    expect(screen.getByTestId("boosted-drop-content-frame")).toHaveClass(
      "tw-max-h-[15rem]",
      "tw-bg-black/20",
      "tw-p-3"
    );
    expect(screen.getByTestId("boosted-drop-content-frame")).not.toHaveClass(
      "tw-aspect-[2/1]"
    );
  });

  it("lets preview-only chat cards shrink below the old fixed frame", () => {
    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop({
          parts: [
            {
              content: "https://example.com/article",
              media: [],
            },
          ],
        })}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(screen.getByTestId("boosted-drop-content-frame")).toHaveClass(
      "tw-max-h-[15rem]"
    );
    expect(screen.getByTestId("boosted-drop-content-frame")).not.toHaveClass(
      "tw-aspect-[2/1]"
    );
  });

  it("matches the homepage media-only content in chat cards with lead media", () => {
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
    expect(screen.queryByTestId("content-display")).not.toBeInTheDocument();
  });

  it("renders standalone markdown images as boosted media instead of link previews", () => {
    const imageUrl =
      "https://img.transient.xyz/?n=-1&output=webp&url=https%3A%2F%2Fipfs.transientusercontent.xyz%2Fipfs%2FQmVsjJs2AfMZkdudRx1bUypA1pr5cDBcp8Y8qshdw74Civ%2Fnft.jpg&w=3072&we=";

    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop({
          parts: [
            {
              content: `![Seize](${imageUrl})`,
              media: [],
            },
          ],
        })}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(screen.getByTestId("drop-media")).toBeInTheDocument();
    expect(mockDropListItemContentMedia).toHaveBeenLastCalledWith(
      expect.objectContaining({
        media_mime_type: "image/webp",
        media_url: imageUrl,
      })
    );
    expect(mockBoostedDropLinkPreview).not.toHaveBeenCalled();
    expect(screen.queryByTestId("link-preview")).not.toBeInTheDocument();
    expect(screen.queryByText("!Seize")).not.toBeInTheDocument();
  });

  it("derives standalone markdown image mime type from the URL", () => {
    const imageUrl = "https://example.com/art.png";

    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop({
          parts: [
            {
              content: `![Art](${imageUrl})`,
              media: [],
            },
          ],
        })}
        onClick={jest.fn()}
        variant="chat"
        rank={1}
      />
    );

    expect(mockDropListItemContentMedia).toHaveBeenLastCalledWith(
      expect.objectContaining({
        media_mime_type: "image/png",
        media_url: imageUrl,
      })
    );
    expect(mockBoostedDropLinkPreview).not.toHaveBeenCalled();
  });

  it("does not render supplemental chat content after the lead media", () => {
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
    expect(screen.queryByTestId("content-display")).not.toBeInTheDocument();
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

    fireEvent.click(
      screen.getByRole("button", { name: "Boost drop by alice" })
    );

    expect(mockToggleBoost).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("opens the card from its semantic open control", () => {
    const onClick = jest.fn();

    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={onClick}
        variant="chat"
        rank={1}
      />
    );

    const openButton = screen.getByRole("button", {
      name: "Open boosted drop from alice",
    });

    fireEvent.click(openButton);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not trigger the outer card click from the author link", () => {
    const onClick = jest.fn();

    renderWithAuth(
      <BoostedDropCardHome
        drop={createDrop()}
        onClick={onClick}
        variant="chat"
        rank={1}
      />
    );

    fireEvent.click(screen.getByRole("link", { name: /alice/i }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
