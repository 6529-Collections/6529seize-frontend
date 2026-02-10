import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCreateIdentitiesSearchItem from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItem";

const item = { pfp: "img.png", handle: "bob", display: "Bob" } as any;

test("calls onProfileSelect when clicked", async () => {
  const user = userEvent.setup();
  const onSelect = jest.fn();
  render(<GroupCreateIdentitiesSearchItem item={item} selected={false} onProfileSelect={onSelect} />);
  await user.click(screen.getByRole("button"));
  expect(onSelect).toHaveBeenCalledWith(item);
});

test("shows checkmark when selected", () => {
  render(<GroupCreateIdentitiesSearchItem item={item} selected onProfileSelect={() => {}} />);
  expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
});
