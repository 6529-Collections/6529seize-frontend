import { render, screen } from "@testing-library/react";
import React from "react";
import WaveDropReply from "@/components/waves/drops/WaveDropReply";

jest.mock("@/components/waves/drops/DropLoading", () => () => (
  <div data-testid="loading" />
));
jest.mock("@/components/waves/drops/DropNotFound", () => () => (
  <div data-testid="not-found" />
));
var lastContentDisplayProps: any = null;
jest.mock("@/components/waves/drops/ContentDisplay", () => (props: any) => {
  lastContentDisplayProps = props;
  return <span data-testid="content" />;
});

const hookData: any = {
  drop: null,
  content: { segments: [], apiMedia: [] },
  isLoading: false,
};

jest.mock("@/components/waves/drops/useDropContent", () => ({
  useDropContent: () => hookData,
}));

describe("WaveDropReply", () => {
  const baseProps = {
    dropId: "d",
    dropPartId: 1,
    maybeDrop: null,
    onReplyClick: jest.fn(),
  };

  beforeEach(() => {
    lastContentDisplayProps = null;
    hookData.isLoading = false;
    hookData.drop = { author: { handle: "alice", pfp: null }, serial_no: 1 };
    hookData.content = {
      segments: [{ type: "text", content: "hello" }],
      apiMedia: [],
    };
  });

  it("shows loader when loading", () => {
    hookData.isLoading = true;
    const { getByTestId } = render(<WaveDropReply {...baseProps} />);
    expect(getByTestId("loading")).toBeInTheDocument();
  });

  it("shows not found when author missing", () => {
    hookData.isLoading = false;
    hookData.drop = { author: { handle: null } } as any;
    const { getByTestId } = render(<WaveDropReply {...baseProps} />);
    expect(getByTestId("not-found")).toBeInTheDocument();
  });

  it("renders content when drop valid", () => {
    const { getByTestId } = render(<WaveDropReply {...baseProps} />);
    expect(getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("converts standalone gif URL text into thumbnail-only preview content", () => {
    hookData.content = {
      segments: [
        {
          type: "text",
          content: "https://media.tenor.com/abc/tenor.gif?itemid=1",
        },
      ],
      apiMedia: [],
    };

    render(<WaveDropReply {...baseProps} />);

    expect(lastContentDisplayProps.content).toEqual({
      segments: [],
      apiMedia: [
        {
          alt: "Media",
          url: "https://media.tenor.com/abc/tenor.gif?itemid=1",
          type: "image",
        },
      ],
    });
  });

  it("does not alter content that already has API media", () => {
    const existing = {
      segments: [{ type: "text", content: "caption" }],
      apiMedia: [
        { alt: "Media", url: "https://cdn.example.com/a.gif", type: "image" },
      ],
    };
    hookData.content = existing;

    render(<WaveDropReply {...baseProps} />);

    expect(lastContentDisplayProps.content).toBe(existing);
  });

  it("does not alter regular text content", () => {
    const existing = {
      segments: [{ type: "text", content: "just words" }],
      apiMedia: [],
    };
    hookData.content = existing;

    render(<WaveDropReply {...baseProps} />);

    expect(lastContentDisplayProps.content).toBe(existing);
  });
});
