import React from "react";
import { render, screen } from "@testing-library/react";
import MemeDropActions from "@/components/memes/drops/meme-participation-drop/MemeDropActions";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

type TestDrop = Pick<ExtendedDrop, "id">;

type MockWaveDropActionsProps = {
  readonly drop: TestDrop;
  readonly activePartIndex: number;
  readonly onReply: () => void;
};

jest.mock(
  "@/components/waves/drops/WaveDropActions",
  () => (props: MockWaveDropActionsProps) => (
    <div data-testid="wave-actions">{JSON.stringify(props)}</div>
  )
);

describe("MemeDropActions", () => {
  const drop: TestDrop = { id: "d1" };
  const dropForComponent = drop as ExtendedDrop;
  const callbacks = { onReply: jest.fn(), onQuote: jest.fn() };

  it("returns null when desktop hover actions are unavailable or hidden", () => {
    const { rerender } = render(
      <MemeDropActions
        drop={dropForComponent}
        canUseDesktopHoverActions={false}
        showReplyAndQuote={true}
        {...callbacks}
      />
    );
    expect(screen.queryByTestId("wave-actions")).toBeNull();
    rerender(
      <MemeDropActions
        drop={dropForComponent}
        canUseDesktopHoverActions={true}
        showReplyAndQuote={false}
        {...callbacks}
      />
    );
    expect(screen.queryByTestId("wave-actions")).toBeNull();
  });

  it("renders WaveDropActions when allowed", () => {
    render(
      <MemeDropActions
        drop={dropForComponent}
        canUseDesktopHoverActions={true}
        showReplyAndQuote
        {...callbacks}
      />
    );
    const element = screen.getByTestId("wave-actions");
    expect(element.textContent).toContain("d1");
  });
});
