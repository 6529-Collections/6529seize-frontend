import { render, screen } from "@testing-library/react";
import MyStreamNoItems from "../../../../../components/brain/my-stream/layout/MyStreamNoItems";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

it("renders text and links", () => {
  render(<MyStreamNoItems />);
  expect(screen.getByText("No notifications found")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Explore Waves/i })).toHaveAttribute(
    "href",
    "/waves"
  );
  expect(screen.getByRole("link", { name: /Create a Wave/i })).toHaveAttribute(
    "href",
    "/waves?create=wave"
  );
});
