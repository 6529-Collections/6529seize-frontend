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

/** Renders the mention inside a clickable parent, like a drop row. */
const renderInClickableParent = (handle: string) => {
  const onParentClick = jest.fn();
  const result = render(
    <div onClick={onParentClick}>
      <DropListItemContentMention user={mention(handle)} />
    </div>
  );
  return { ...result, onParentClick };
};

describe("DropListItemContentMention", () => {
  it("renders link and stops propagation", () => {
    const { container, onParentClick } = renderInClickableParent("bob");
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/bob");
    expect(link).toHaveTextContent("@bob");
    fireEvent.click(link);
    expect(onParentClick).not.toHaveBeenCalled();
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

  it("shows the unlinked handle as mention text, not as a control", () => {
    const { onParentClick } = renderInClickableParent("..");

    const text = screen.getByText("@..");
    expect(text.tagName).toBe("SPAN");
    // Same colour and weight as a mention chip, without the link's hover
    // affordance: it opens nothing.
    expect(text).toHaveClass("tw-font-medium", "tw-text-primary-400");
    expect(text.className).not.toContain("hover:tw-underline");
    // Plain text has no click handling of its own.
    fireEvent.click(text);
    expect(onParentClick).toHaveBeenCalledTimes(1);
  });
});
