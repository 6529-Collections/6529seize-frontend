import { render, screen } from "@testing-library/react";
import React from "react";
import DropItemChat from "@/components/waves/drops/DropItemChat";
import { ApiDropType } from "@/generated/models/ApiDropType";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("@/hooks/useDrop", () => ({ useDrop: jest.fn() }));
jest.mock("@/helpers/Helpers", () => ({
  removeBaseEndpoint: jest.fn((l: string) => l.replace("https://base.com", "")),
}));
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({ isMemesSubmission: () => false }),
}));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => (props: any) => (
    <div
      data-testid="media"
      data-media-url={props.media_url}
      data-fill-video-container={String(props.fillVideoContainer)}
    />
  )
);
jest.mock("@/components/waves/drop/SingleWaveDropPosition", () => ({
  SingleWaveDropPosition: (p: any) => (
    <div data-testid="position">{p.rank}</div>
  ),
}));
jest.mock("@/components/waves/drop/SingleWaveDropVotes", () => ({
  SingleWaveDropVotes: () => <div data-testid="votes" />,
}));
jest.mock("@/components/waves/ChatItemHrefButtons", () => (p: any) => (
  <div data-testid="href-buttons">{p.relativeHref}</div>
));

const { useDrop } = require("@/hooks/useDrop");
const { removeBaseEndpoint } = require("@/helpers/Helpers");

describe("DropItemChat", () => {
  it("reserves an artwork card while loading without showing the raw URL", () => {
    (useDrop as jest.Mock).mockReturnValue({ drop: undefined, isError: false });
    render(<DropItemChat href="https://base.com/path" dropId="d1" />);
    expect(
      screen.getByRole("status", { name: "Drop preview" })
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading drop preview")).toBeInTheDocument();
    expect(screen.queryByText("https://base.com/path")).not.toBeInTheDocument();
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/path");
    expect(removeBaseEndpoint).toHaveBeenCalledWith("https://base.com/path");
  });

  it("replaces loading with an unavailable state and preserves the link on error", () => {
    (useDrop as jest.Mock).mockReturnValue({ drop: undefined, isError: false });
    const { rerender } = render(
      <DropItemChat href="https://base.com/path" dropId="d1" />
    );
    (useDrop as jest.Mock).mockReturnValue({ drop: undefined, isError: true });
    rerender(<DropItemChat href="https://base.com/path" dropId="d1" />);
    expect(screen.getByText("Drop preview unavailable")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Drop preview" })
    ).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("link", { name: "Open drop" })).toHaveAttribute(
      "href",
      "/path"
    );
    expect(screen.queryByText("Loading drop preview")).not.toBeInTheDocument();
  });

  it("shows drop details when loaded", () => {
    (useDrop as jest.Mock).mockReturnValue({
      drop: {
        drop_type: ApiDropType.Participatory,
        parts: [{ media: [{ mime_type: "video/mp4", url: "video" }] }],
        metadata: [{ data_key: "title", data_value: "Title" }],
        title: "T",
        wave: { id: "w", name: "Wave" },
        rank: 2,
      },
    });
    render(<DropItemChat href="https://base.com/p" dropId="d1" />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/p");
    expect(screen.getByRole("heading", { name: "Title" })).toHaveClass(
      "tw-m-0"
    );
    expect(screen.getByTestId("position")).toHaveTextContent("2");
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-media-url",
      "video"
    );
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-fill-video-container",
      "true"
    );
    expect(screen.getByTestId("media").parentElement).toHaveClass(
      "tw-bg-iron-900/30"
    );
    expect(screen.getByTestId("href-buttons")).toHaveTextContent("/p");
  });

  it("renders chat drop title as plain text when loaded", () => {
    (useDrop as jest.Mock).mockReturnValue({
      drop: {
        drop_type: ApiDropType.Chat,
        parts: [{ media: [] }],
        metadata: [{ data_key: "title", data_value: "Chat Title" }],
        title: "Fallback",
        wave: { id: "w", name: "Wave" },
        rank: null,
      },
    });

    render(<DropItemChat href="https://base.com/p" dropId="d1" />);

    expect(screen.getByText("Chat Title").closest("a")).toBeNull();
    expect(screen.getByText("Chat Title").closest(".tw-border")).toHaveClass(
      "tw-min-h-[31.0625rem]",
      "sm:tw-min-h-[31.5625rem]"
    );
    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wave" })).toHaveAttribute(
      "href",
      "/p"
    );
  });
});
