import { fireEvent, render, screen } from "@testing-library/react";
import DockedVersionUpdate from "@/components/version-update/DockedVersionUpdate";
import { useVersionStatus } from "@/contexts/VersionStatusContext";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";

jest.mock("@/contexts/VersionStatusContext", () => ({
  useVersionStatus: jest.fn(),
}));
jest.mock("@/helpers/version-refresh.helpers", () => ({
  refreshAppVersion: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useVersionStatus).mockReturnValue(true);
});

it("offers a separately labelled update action without replacing Home", () => {
  render(
    <nav>
      <DockedVersionUpdate />
      <a href="/">Home</a>
    </nav>
  );
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
    "href",
    "/"
  );
  const button = screen.getByRole("button", {
    name: "Update to the new version",
  });
  expect(button).toHaveTextContent("");
  fireEvent.click(button);
  expect(refreshAppVersion).toHaveBeenCalledTimes(1);
});

it("removes the entire attachment when there is no update", () => {
  const view = render(<DockedVersionUpdate />);
  jest.mocked(useVersionStatus).mockReturnValue(false);
  view.rerender(<DockedVersionUpdate />);
  expect(view.container).toBeEmptyDOMElement();
});

it("keeps the selection glow inside the update contour and preserves it without an update", () => {
  const selection = <div data-testid="selection">Selected item</div>;
  const view = render(<DockedVersionUpdate>{selection}</DockedVersionUpdate>);
  const contour = view.container.querySelector("clipPath");
  const clip = screen
    .getByTestId("selection")
    .closest<HTMLDivElement>("[data-dock-selection-clip]");
  expect(contour).not.toBeNull();
  expect(clip?.style.clipPath).toBe(
    `var(--dock-update-contour, url(#${contour?.id}))`
  );
  expect(screen.getAllByTestId("selection")).toHaveLength(1);

  jest.mocked(useVersionStatus).mockReturnValue(false);
  view.rerender(<DockedVersionUpdate>{selection}</DockedVersionUpdate>);
  expect(screen.getByTestId("selection").parentElement).toHaveClass(
    "tw-overflow-hidden",
    "tw-rounded-[inherit]"
  );
  expect(view.container.querySelector("[data-dock-update-surface]")).toBeNull();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
