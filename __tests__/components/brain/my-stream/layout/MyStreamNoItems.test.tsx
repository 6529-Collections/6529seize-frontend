import { render, screen } from "@testing-library/react";
import MyStreamNoItems from "@/components/brain/my-stream/layout/MyStreamNoItems";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

const { default: useDeviceInfo } = require("@/hooks/useDeviceInfo");

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

it("uses app routes when running in app", () => {
  (useDeviceInfo as jest.Mock).mockReturnValueOnce({ isApp: true });
  render(<MyStreamNoItems />);
  expect(screen.getByRole("link", { name: /Explore Waves/i })).toHaveAttribute(
    "href",
    "/waves"
  );
  expect(screen.getByRole("link", { name: /Create a Wave/i })).toHaveAttribute(
    "href",
    "/waves/create"
  );
});
