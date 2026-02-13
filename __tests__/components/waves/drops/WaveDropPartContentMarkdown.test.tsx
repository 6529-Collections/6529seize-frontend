import React from "react";
import { render, screen } from "@testing-library/react";
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
      marketplaceImageOnly={true}
    />
  );
  expect(screen.getByTestId("md")).toHaveTextContent("hello");
  expect(markdownProps.marketplaceImageOnly).toBe(true);
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
  expect(markdownProps.marketplaceImageOnly).toBe(false);
  expect(quoteProps.embedPath).toEqual(["root-drop"]);
  expect(quoteProps.quotePath).toEqual(["w:7"]);
  expect(quoteProps.marketplaceImageOnly).toBe(false);
  expect(quoteProps.embedDepth).toBe(1);
});
