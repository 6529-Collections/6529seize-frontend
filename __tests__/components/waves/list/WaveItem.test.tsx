import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import WaveItem from "@/components/waves/list/WaveItem";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("@/components/waves/list/WaveItemDropped", () => () => (
  <a data-testid="dropped" href="#dropped">
    Dropped
  </a>
));

jest.mock("@/components/waves/list/WaveItemFollow", () => () => (
  <button
    data-testid="follow"
    data-wave-item-interactive="true"
    type="button"
  >
    Follow
  </button>
));

const wave = {
  id: "w1",
  name: "My Wave",
  picture: "pic.jpg",
  metrics: { subscribers_count: 10 },
  author: {
    handle: "alice",
    pfp: "pfp.jpg",
    level: 85,
    banner1_color: "#000",
    banner2_color: "#111",
  },
  chat: { scope: { group: { is_direct_message: false } } },
} as any;

beforeEach(() => {
  pushMock.mockClear();
});

describe("WaveItem", () => {
  it("renders basic wave information", () => {
    render(<WaveItem wave={wave} />);

    expect(screen.getByText("My Wave")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByTestId("dropped")).toBeInTheDocument();
    expect(screen.getByTestId("follow")).toBeInTheDocument();
  });

  it("renders placeholders when no wave is provided", () => {
    render(
      <WaveItem userPlaceholder="user-placeholder" titlePlaceholder="title-placeholder" />,
    );

    expect(screen.getByText("user-placeholder")).toBeInTheDocument();
    expect(screen.getByText("title-placeholder")).toBeInTheDocument();
  });

  it("navigates using the router when the card is clicked", () => {
    render(<WaveItem wave={wave} />);

    const card = screen.getByRole("link", { name: "View wave My Wave" });
    fireEvent.click(card);

    expect(pushMock).toHaveBeenCalledWith("/waves?wave=w1");
  });

  it("does not navigate when clicking an interactive child element", () => {
    render(<WaveItem wave={wave} />);

    fireEvent.click(screen.getByTestId("follow"));

    expect(pushMock).not.toHaveBeenCalled();
  });
});
