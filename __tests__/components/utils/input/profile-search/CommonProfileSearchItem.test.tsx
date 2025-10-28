import { render, screen, fireEvent } from "@testing-library/react";
import CommonProfileSearchItem from "@/components/utils/input/profile-search/CommonProfileSearchItem";

const profile = { handle: "alice", wallet: "0x1", display: "Alice", pfp: "img.png" } as any;

it("calls on select and shows checkmark when selected", () => {
  const onSelect = jest.fn();
  render(
    <ul>
      <CommonProfileSearchItem
        profile={profile}
        selected="0x1"
        onProfileSelect={onSelect}
        id="profile-search-item-0x1"
      />
    </ul>
  );
  expect(screen.getByAltText(/Alice avatar/i)).toBeInTheDocument();
  const listItem = screen.getByText("Alice").closest("li");
  if (!listItem) {
    throw new Error("List item not found");
  }
  expect(listItem).toHaveAttribute("data-option-id", "profile-search-item-0x1");
  expect(listItem.id).toBe("profile-search-item-0x1-visual");
  expect(listItem.querySelector('[data-icon="check"]')).not.toBeNull();
  fireEvent.click(listItem);
  expect(onSelect).toHaveBeenCalledWith(profile);
});
