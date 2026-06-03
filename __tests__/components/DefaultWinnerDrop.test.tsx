import { render, screen } from "@testing-library/react";
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
jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => () => <div />);
jest.mock("@/hooks/isMobileDevice", () => () => false);

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
  });

  it("calls reply handler", async () => {
    const user = userEvent.setup();
    const onReply = jest.fn();
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
});
