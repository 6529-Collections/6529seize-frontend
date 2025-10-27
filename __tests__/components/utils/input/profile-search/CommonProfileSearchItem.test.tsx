import { render, screen, fireEvent } from "@testing-library/react";
import CommonProfileSearchItem from "@/components/utils/input/profile-search/CommonProfileSearchItem";

const profile = { handle: "alice", wallet: "0x1", display: "Alice", pfp: "img.png" } as any;

it("calls on select and shows checkmark when selected", () => {
  const onSelect = jest.fn();
  render(
    <CommonProfileSearchItem
      profile={profile}
      selected="0x1"
      onProfileSelect={onSelect}
      id="profile-search-item-0x1"
    />
  );
  expect(screen.getByAltText(/Community Table Profile Picture/)).toBeInTheDocument();
  expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("button"));
  expect(onSelect).toHaveBeenCalled();
});
