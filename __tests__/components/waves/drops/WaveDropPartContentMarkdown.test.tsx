import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";
import WaveDropPartContentMarkdown from "@/components/waves/drops/WaveDropPartContentMarkdown";

let markdownProps: any;
let quoteProps: any;

jest.mock(
  "@/components/drops/view/part/DropPartMarkdownWithPropLogger",
  () => (props: any) => {
    markdownProps = props;
    return <div data-testid="md">{props.partContent}</div>;
  }
);
jest.mock(
  "@/components/waves/drops/WaveDropQuoteWithDropId",
  () => (props: any) => {
    quoteProps = props;
    return (
      <div
        data-testid="quote"
        data-id={props.dropId}
        data-part={props.partId}
      />
    );
  }
);

const basePart: any = { content: "hello", quoted_drop: null };
const wave: any = { id: "w" };

beforeEach(() => {
  markdownProps = undefined;
  quoteProps = undefined;
});

it("renders markdown only", () => {
  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      referencedNfts={[]}
      part={basePart}
      wave={wave}
      onQuoteClick={jest.fn()}
    />
  );
  expect(screen.getByTestId("md")).toHaveTextContent("hello");
  expect(screen.queryByTestId("quote")).toBeNull();
});

it("renders quoted drop", () => {
  const part = {
    content: "c",
    quoted_drop: { drop_id: "d", drop_part_id: 1, drop: null },
  } as any;
  const drop = { id: "root-drop", serial_no: 7 } as any;
  render(
    <WaveDropPartContentMarkdown
      mentionedUsers={[]}
      referencedNfts={[]}
      part={part}
      wave={wave}
      drop={drop}
      onQuoteClick={jest.fn()}
    />
  );
  expect(screen.getByTestId("quote")).toHaveAttribute("data-id", "d");
  expect(markdownProps.quotePath).toEqual(["w:7"]);
  expect(quoteProps.embedPath).toEqual(["root-drop"]);
  expect(quoteProps.quotePath).toEqual(["w:7"]);
  expect(quoteProps.embedDepth).toBe(1);
});

it("passes link preview toggle control for author drops with links", () => {
  const drop = {
    id: "drop-1",
    serial_no: 1,
    hide_link_preview: false,
    author: { handle: "alice" },
    wave: { id: "w" },
    parts: [{ content: "https://example.com" }],
  } as any;

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropPartContentMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        part={basePart}
        wave={wave}
        drop={drop}
        onQuoteClick={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(markdownProps.linkPreviewToggleControl).toBeDefined();
  expect(markdownProps.linkPreviewToggleControl.label).toBe(
    "Hide link previews"
  );
});

it("keeps link preview toggle control stable across equivalent drop rerenders", () => {
  const drop = {
    id: "drop-1",
    serial_no: 1,
    hide_link_preview: false,
    author: { handle: "alice" },
    wave: { id: "w" },
    parts: [{ content: "https://example.com" }],
  } as any;

  const authContextValue = {
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
  } as any;

  const { rerender } = render(
    <AuthContext.Provider value={authContextValue}>
      <WaveDropPartContentMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        part={basePart}
        wave={wave}
        drop={drop}
        onQuoteClick={jest.fn()}
      />
    </AuthContext.Provider>
  );

  const firstControl = markdownProps.linkPreviewToggleControl;
  expect(firstControl).toBeDefined();

  const equivalentDrop = {
    ...drop,
    author: { ...drop.author },
    wave: { ...drop.wave },
    parts: [...drop.parts],
  } as any;

  rerender(
    <AuthContext.Provider value={authContextValue}>
      <WaveDropPartContentMarkdown
        mentionedUsers={[]}
        mentionedWaves={[]}
        referencedNfts={[]}
        part={basePart}
        wave={wave}
        drop={equivalentDrop}
        onQuoteClick={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(markdownProps.linkPreviewToggleControl).toBe(firstControl);
});
