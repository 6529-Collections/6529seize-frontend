import { render, screen } from "@testing-library/react";
import WavesRouteLoading from "@/components/waves/WavesRouteLoading";

let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

it("uses the drop detail loader immediately when the URL names a drop", () => {
  mockSearchParams = new URLSearchParams("drop=submission-1");
  render(<WavesRouteLoading />);
  expect(
    screen.getByRole("status", { name: "Loading drop" })
  ).toBeInTheDocument();
  expect(
    screen.queryByTestId("stream-route-loading-shell")
  ).not.toBeInTheDocument();
});

it("keeps the wave loader for ordinary wave navigation", () => {
  mockSearchParams = new URLSearchParams();
  render(<WavesRouteLoading />);
  expect(screen.getByTestId("stream-route-loading-shell")).toBeInTheDocument();
  expect(screen.queryByTestId("single-drop-loading")).not.toBeInTheDocument();
});
