import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import DropListItemContentMention from "@/components/drops/view/item/content/DropListItemContentMention";

jest.mock(
  "@/components/utils/tooltip/UserProfileTooltipWrapper",
  () =>
    ({ user, children }: any) => (
      <div data-testid="tooltip-wrapper" data-user={user}>
        {children}
      </div>
    )
);
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mention = (handle: string): any => ({
  mentioned_profile_id: "1",
  handle_in_content: handle,
  current_handle: handle,
});

describe("DropListItemContentMention", () => {
  it("renders link and stops propagation", () => {
    const user: any = { mentioned_profile_id: "1", handle_in_content: "bob" };
    const { container } = render(<DropListItemContentMention user={user} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/bob");
    expect(link).toHaveTextContent("@bob");
    fireEvent.click(link);
    expect(
      container.querySelector('[data-testid="tooltip-wrapper"]')
    ).toBeInTheDocument();
  });

  it.each(["punk6529", "vitalik.eth", "some_user-1"])(
    "keeps the profile URL of the ordinary handle %s",
    (handle) => {
      render(<DropListItemContentMention user={mention(handle)} />);
      expect(screen.getByRole("link")).toHaveAttribute("href", `/${handle}`);
    }
  );

  it.each([
    ["bob/../../waves", "/bob%2F..%2F..%2Fwaves"],
    ["/other.example", "/%2Fother.example"],
    ["bob?tab=x#y", "/bob%3Ftab%3Dx%23y"],
    ["bob\\x", "/bob%5Cx"],
  ])("keeps the handle %j inside one profile segment", (handle, expected) => {
    render(<DropListItemContentMention user={mention(handle)} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expected);
    expect(link).toHaveTextContent(`@${handle}`);
    expect(
      new URL(expected, "https://6529.io").pathname.split("/")
    ).toHaveLength(2);
  });

  it.each(["", ".", ".."])("renders the handle %j without a link", (handle) => {
    render(<DropListItemContentMention user={mention(handle)} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(`@${handle}`)).toBeInTheDocument();
  });
});
