import { render, screen } from "@testing-library/react";
import WaveGroupScope from "@/components/waves/specs/groups/group/WaveGroupScope";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (u: string) => "scaled-" + u,
  ImageScale: { W_AUTO_H_50: "50" },
}));

describe("WaveGroupScope", () => {
  it("shows a non-interactive private label for hidden groups", () => {
    const group = { is_hidden: true } as any;
    render(<WaveGroupScope group={group} />);
    expect(screen.getByText("Private group")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows a non-interactive private label for direct-message groups", () => {
    const group = {
      id: "dm-1",
      name: "Private conversation",
      is_hidden: false,
      is_direct_message: true,
    } as any;
    render(<WaveGroupScope group={group} />);
    expect(screen.getByText("Private group")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders link with image when visible", () => {
    const group = {
      id: "1",
      name: "Group",
      is_hidden: false,
      author: { handle: "alice", pfp: "img.png" },
    } as any;
    const { container } = render(<WaveGroupScope group={group} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/network?page=1&group=1");
    expect(link).toHaveAttribute(
      "aria-label",
      "Inspect Group group criteria and members"
    );
    expect(link).toHaveClass("tw-min-h-11");
    expect(link).toHaveClass("desktop-hover:hover:tw-text-primary-300");
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "scaled-img.png"
    );
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.getByText("Group")).toBeInTheDocument();
  });

  it("does not reinterpret an incomplete visible group as public access", () => {
    render(
      <WaveGroupScope
        group={{ id: "stale-group-id", is_hidden: false } as any}
      />
    );
    expect(screen.getByText("Group unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("stale-group-id")).not.toBeInTheDocument();
  });
});
