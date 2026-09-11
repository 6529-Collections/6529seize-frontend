import { render, screen } from "@testing-library/react";
import WaveGroupScope from "@/components/waves/specs/groups/group/WaveGroupScope";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type Link from "next/link";
import type { ComponentProps } from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: ComponentProps<typeof Link>) => (
    <a href={href.toString()} {...props}>
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
    const group = { is_hidden: true } satisfies ApiGroup;
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
    } satisfies ApiGroup;
    render(<WaveGroupScope group={group} />);
    expect(screen.getByText("Private group")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders link with image when visible", () => {
    const group = {
      id: "1",
      name: "Group",
      is_hidden: false,
      author: Object.assign(new ApiProfileMin(), {
        handle: "alice",
        pfp: "img.png",
      }),
    } satisfies ApiGroup;
    const { container } = render(<WaveGroupScope group={group} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/network?page=1&group=1");
    expect(link).toHaveAttribute(
      "aria-label",
      "Inspect Group group criteria and members"
    );
    expect(link).toHaveClass("tw-min-h-11");
    expect(link).toHaveClass("tw-inline-flex", "tw-w-fit", "tw-max-w-full");
    expect(link).toHaveClass("desktop-hover:hover:tw-text-primary-300");
    const image = container.querySelector("img");
    const name = screen.getByText("Group");
    expect(image).toHaveAttribute("src", "scaled-img.png");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveClass("tw-inline-block", "tw-align-middle", "tw-mr-2");
    expect(image?.nextElementSibling).toBe(name);
    expect(image?.parentElement).toHaveClass("tw-text-right");
  });

  it("does not reinterpret an incomplete visible group as public access", () => {
    render(
      <WaveGroupScope
        group={{ id: "stale-group-id", is_hidden: false } satisfies ApiGroup}
      />
    );
    expect(screen.getByText("Group unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("stale-group-id")).not.toBeInTheDocument();
  });
});
