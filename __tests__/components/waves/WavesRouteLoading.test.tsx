import { render, screen } from "@testing-library/react";
import WavesRouteLoading from "@/components/waves/WavesRouteLoading";

let mockPathname = "/waves/wave-1";
let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

it("uses the drop detail loader immediately when the URL names a drop", () => {
  mockSearchParams = new URLSearchParams("drop=submission-1");
  render(<WavesRouteLoading />);
  expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument();
  expect(
    screen.queryByTestId("stream-route-loading-shell")
  ).not.toBeInTheDocument();
});

it("keeps the wave loader for ordinary wave navigation", () => {
  mockSearchParams = new URLSearchParams();
  render(<WavesRouteLoading />);
  expect(screen.getByTestId("stream-route-loading-shell")).toBeInTheDocument();
  expect(screen.getByTestId("wave-chat-loading")).toBeInTheDocument();
  expect(screen.queryByTestId("single-drop-loading")).not.toBeInTheDocument();
});

it.each(["/waves", "/waves/create", "/waves/wave-1/competitions"])(
  "keeps %s on its own loading surface",
  (pathname) => {
    mockPathname = pathname;
    mockSearchParams = new URLSearchParams();
    render(<WavesRouteLoading />);
    expect(
      screen.getByTestId("stream-route-loading-shell")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wave-chat-loading")).not.toBeInTheDocument();
  }
);
