import { render, screen, fireEvent } from "@testing-library/react";
import CommonProfileSearchItem from "@/components/utils/input/profile-search/CommonProfileSearchItem";

const profile = { handle: "alice", wallet: "0x1", display: "Alice", pfp: "img.png" } as any;

it("calls on select and shows checkmark when selected", () => {
  const onSelect = jest.fn();
  render(
    <CommonProfileSearchItem profile={profile} selected="alice" onProfileSelect={onSelect} />
  );
  expect(screen.getByAltText(/Community Table Profile Picture/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  expect(onSelect).toHaveBeenCalled();
});
