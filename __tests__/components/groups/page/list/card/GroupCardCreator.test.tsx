import { render, screen } from "@testing-library/react";
import GroupCardCreator from "@/components/groups/page/list/card/GroupCardCreator";

jest.mock("@/helpers/Helpers", () => ({
  getTimeAgo: jest.fn(() => "1d"),
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (uri: string) => `${uri}?s`,
  ImageScale: { W_AUTO_H_50: "scale" },
}));

const group: any = {
  created_by: { handle: "alice", pfp: "pic.png" },
  created_at: "2023-01-01",
};

describe("GroupCardCreator", () => {
  it("shows the compact creator identity and creation time", () => {
    render(<GroupCardCreator group={group} />);

    expect(screen.getByRole("img")).toHaveAttribute("src", "pic.png?s");
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(screen.getByText("·")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Created 1d")).toBeInTheDocument();
  });

  it("renders creator placeholders while loading", () => {
    render(<GroupCardCreator userPlaceholder="u" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link", { name: "u" })).toBeNull();
    expect(screen.getByText("u")).toBeInTheDocument();
  });
});
