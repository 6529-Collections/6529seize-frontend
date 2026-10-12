import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import WavesRouteLayout from "@/app/waves/layout";

let mockSuspended = true;
let mockResumeRoute: () => void;
const mockPendingRoute = new Promise<void>((resolve) => {
  mockResumeRoute = resolve;
});

jest.mock("@/contexts/CompetitionRouteContext", () => ({
  CompetitionRouteProvider: ({ children }: { children: ReactNode }) => {
    if (mockSuspended) throw mockPendingRoute;
    return children;
  },
}));
jest.mock("@/components/waves/layout/WavesLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <section aria-label="Loaded wave shell">{children}</section>
  ),
}));

it("shows a neutral wave skeleton until the shared route can render", async () => {
  render(<WavesRouteLayout>Connect to create a wave</WavesRouteLayout>);
  expect(screen.getByRole("status", { name: "Loading waves" })).toBeVisible();
  expect(
    screen.getByTestId("stream-route-loading-shell").querySelector("aside")
  ).toBeInTheDocument();
  expect(screen.queryByText("Connect to create a wave")).toBeNull();
  await act(async () => {
    mockSuspended = false;
    mockResumeRoute();
  });
  expect(screen.getByText("Connect to create a wave")).toBeVisible();
  expect(screen.queryByRole("status", { name: "Loading waves" })).toBeNull();
});
