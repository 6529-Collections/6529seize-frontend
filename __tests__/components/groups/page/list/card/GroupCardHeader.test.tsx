import { fireEvent, render, screen } from "@testing-library/react";
import GroupCardHeader from "@/components/groups/page/list/card/GroupCardHeader";

const groupHref = "/network?page=1&group=group-1";

test("keeps the title as a native group link without a second tab stop", () => {
  render(<GroupCardHeader title="Network" href={groupHref} />);
  const title = screen.getByRole("link", { name: "Network" });

  expect(title).toHaveAttribute("href", groupHref);
  expect(title).toHaveAttribute("title", "Network");
  expect(title).toHaveAttribute("tabindex", "-1");
  expect(fireEvent.click(title, { ctrlKey: true })).toBe(true);
  expect(fireEvent.click(title, { metaKey: true })).toBe(true);
  expect(
    title.dispatchEvent(
      new MouseEvent("auxclick", {
        bubbles: true,
        cancelable: true,
        button: 1,
      })
    )
  ).toBe(true);
});

test("keeps the Network title and tooltip while loading", () => {
  render(<GroupCardHeader title="Network" />);

  expect(screen.getByText("Network")).toHaveAttribute("title", "Network");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
