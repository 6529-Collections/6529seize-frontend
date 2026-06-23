import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DefaultWinnerDrop from "@/components/waves/drops/winner/DefaultWinnerDrop";
import React from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock("@/components/waves/drops/WaveDropAuthorPfp", () => () => <div />);
jest.mock("@/components/waves/drops/WaveDropReply", () => () => <div />);
const mockWaveDropContent = jest.fn((props: any) => (
  <button data-testid="content" onClick={() => props.setActivePartIndex(0)} />
));
jest.mock("@/components/waves/drops/WaveDropContent", () => (props: any) => {
  mockWaveDropContent(props);
  return (
    <button data-testid="content" onClick={() => props.setActivePartIndex(0)} />
  );
});
jest.mock("@/components/waves/drops/WaveDropActions", () => (props: any) => (
  <button data-testid="reply" onClick={props.onReply} />
));
jest.mock("@/components/waves/drops/WaveDropRatings", () => (props: any) => (
  <button
    type="button"
    data-testid="ratings"
    aria-label={`View voters and vote log for ${props.drop.raters_count} voters`}
  />
));
const WaveDropMetadataMock = jest.fn(() => <div data-testid="metadata" />);
jest.mock("@/components/waves/drops/WaveDropMetadata", () => (props: any) => {
  WaveDropMetadataMock(props);
  return <div data-testid="metadata" />;
});
jest.mock("@/components/waves/winners/identity/WaveWinnerIdentity", () => ({
  WaveWinnerIdentity: () => <div data-testid="identity" />,
}));
let mobileMenuProps: any;
jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => (props: any) => {
  mobileMenuProps = props;
  return <div data-testid="mobile-menu" data-open={String(props.isOpen)} />;
});
jest.mock("@/hooks/isMobileDevice", () => () => false);
const mockUseHasTouchInput = jest.fn(() => false);
jest.mock("@/hooks/useHasTouchInput", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseHasTouchInput(...args),
}));
const mockUseIsTouchDevice = jest.fn(() => false);
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseIsTouchDevice(...args),
}));

const HOVER_INPUT_MEDIA_QUERIES = new Set([
  "(any-hover: hover)",
  "(hover: hover)",
]);

/** Sets the jsdom viewport width and notifies resize subscribers. */
const setViewportWidth = (width: number) => {
  Object.defineProperty(globalThis.window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  globalThis.window.dispatchEvent(new Event("resize"));
};

/** Mocks hover media queries used by drop action interaction mode. */
const setHoverSupport = (hasHover: boolean) => {
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn((query: string) => ({
      matches: hasHover && HOVER_INPUT_MEDIA_QUERIES.has(query),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe("DefaultWinnerDrop", () => {
  const drop: any = {
    id: "1",
    rank: 1,
    wave: { id: "w", name: "wave" },
    parts: [{ part_id: 1 }],
    metadata: [],
    author: { cic: "g" },
  };

  beforeEach(() => {
    WaveDropMetadataMock.mockClear();
    mockWaveDropContent.mockClear();
    mobileMenuProps = undefined;
    mockUseHasTouchInput.mockReturnValue(false);
    mockUseIsTouchDevice.mockReturnValue(false);
    setViewportWidth(1440);
    setHoverSupport(false);
  });

  it("calls reply handler", async () => {
    const user = userEvent.setup();
    const onReply = jest.fn();
    setHoverSupport(true);

    render(
      <DefaultWinnerDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        dropViewDropId={null}
        location={0 as any}
        onReply={onReply}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    await user.click(screen.getByTestId("reply"));
    expect(onReply).toHaveBeenCalled();
  });

  it("renders identity and filtered metadata when provided", () => {
    const { container } = render(
      <DefaultWinnerDrop
        drop={{
          ...drop,
          rank: 1,
          wave: {
            ...drop.wave,
            submission_type: "IDENTITY",
          },
          metadata: [
            { data_key: "identity", data_value: "0xabc" },
            { data_key: "k", data_value: "v" },
          ],
        }}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={{ drop } as any}
        showReplyAndQuote={false}
        dropViewDropId={null}
        location={0 as any}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    expect(screen.getByTestId("identity")).toBeInTheDocument();
    const meta = container.querySelector('[data-testid="metadata"]');
    expect(meta).toBeInTheDocument();
    expect(WaveDropMetadataMock.mock.calls.at(-1)?.[0]?.metadata).toEqual([
      { data_key: "k", data_value: "v" },
    ]);
  });

  it("renders vote details through the shared ratings row when there are raters", () => {
    render(
      <DefaultWinnerDrop
        drop={{ ...drop, raters_count: 4 }}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        dropViewDropId={null}
        location={0 as any}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 4 voters",
      })
    ).toBeInTheDocument();
  });

  it("passes embed guard props to content", () => {
    const guardProps = {
      embedPath: ["parent-drop"],
      quotePath: ["w:1"],
      embedDepth: 2,
      maxEmbedDepth: 4,
    };

    render(
      <DefaultWinnerDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        dropViewDropId={null}
        location={0 as any}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
        {...guardProps}
      />
    );

    expect(mockWaveDropContent).toHaveBeenLastCalledWith(
      expect.objectContaining(guardProps)
    );
  });

  it("opens mobile menu on wide touch-only viewports without hover", () => {
    mockUseHasTouchInput.mockReturnValue(true);
    mockUseIsTouchDevice.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(false);

    const { rerender } = render(
      <DefaultWinnerDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        dropViewDropId={null}
        location={0 as any}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("reply")).not.toBeInTheDocument();
    expect(mockWaveDropContent.mock.calls[0][0]?.hasTouch).toBe(true);

    const onLongPress = mockWaveDropContent.mock.calls[0][0]?.onLongPress;
    act(() => {
      onLongPress();
    });

    rerender(
      <DefaultWinnerDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        dropViewDropId={null}
        location={0 as any}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mobileMenuProps.isOpen).toBe(true);
  });

  it("clears an open touch sheet when the mode switches to desktop hover", () => {
    mockUseHasTouchInput.mockReturnValue(true);
    mockUseIsTouchDevice.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(false);

    const renderDrop = () => (
      <DefaultWinnerDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        dropViewDropId={null}
        location={0 as any}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    const { rerender } = render(renderDrop());
    const onLongPress = mockWaveDropContent.mock.calls.at(-1)?.[0]?.onLongPress;

    act(() => {
      onLongPress();
    });

    expect(mobileMenuProps.isOpen).toBe(true);

    setHoverSupport(true);
    rerender(renderDrop());

    expect(mobileMenuProps.isOpen).toBe(false);

    setHoverSupport(false);
    rerender(renderDrop());

    expect(mobileMenuProps.isOpen).toBe(false);
  });

  it("does not enable content touch handling when interactions are disabled", () => {
    mockUseHasTouchInput.mockReturnValue(true);
    mockUseIsTouchDevice.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(false);

    render(
      <DefaultWinnerDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        dropViewDropId={null}
        location={0 as any}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        showInteractions={false}
      />
    );

    expect(mockWaveDropContent.mock.calls.at(-1)?.[0]?.hasTouch).toBe(false);
    expect(mobileMenuProps).toBeUndefined();
  });
});
