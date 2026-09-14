import { fireEvent, render, screen } from "@testing-library/react";

import StudioTemplateLibrary from "@/components/profile-cms-builder/studio/StudioTemplateLibrary";
import * as templates from "@/lib/profile-cms/studio/templates";

jest.mock("@/components/profile-cms/CmsSiteRenderer", () => ({
  __esModule: true,
  default: function TemplateRenderer() {
    return <div data-testid="template-renderer" />;
  },
}));

afterEach(() => jest.restoreAllMocks());

it.each(["x", "", "_invalid", "x".repeat(65)])(
  "does not instantiate thumbnails or expose use actions for an invalid handle: %s",
  (handle) => {
    const instantiate = jest.spyOn(templates, "instantiateCmsStudioTemplate");
    const onUse = jest.fn();
    render(
      <StudioTemplateLibrary handle={handle} locale="en-US" onUse={onUse} />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("2–64 characters");
    expect(screen.queryByTestId("template-renderer")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Use this template/ })
    ).not.toBeInTheDocument();
    expect(instantiate).not.toHaveBeenCalled();
    expect(onUse).not.toHaveBeenCalled();
  }
);

it("gives all use actions a unique accessible name and supports a two-character handle", () => {
  const onUse = jest.fn();
  render(<StudioTemplateLibrary handle="ab" locale="en-US" onUse={onUse} />);
  const buttons = screen.getAllByRole("button", {
    name: /^Use this template:/,
  });
  expect(buttons).toHaveLength(6);
  expect(
    new Set(buttons.map((button) => button.getAttribute("aria-label"))).size
  ).toBe(6);
  fireEvent.click(
    screen.getByRole("button", { name: "Use this template: Personal" })
  );
  expect(onUse).toHaveBeenCalledWith(
    expect.objectContaining({
      profile: expect.objectContaining({ handle: "ab" }),
    })
  );
});

it("uses the selected full preview and safely exits when its handle becomes invalid", () => {
  const onUse = jest.fn();
  const instantiate = jest.spyOn(templates, "instantiateCmsStudioTemplate");
  const view = render(
    <StudioTemplateLibrary handle="example" locale="en-US" onUse={onUse} />
  );
  fireEvent.click(screen.getByRole("button", { name: "Preview Artist" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Use this template: Artist" })
  );
  expect(onUse.mock.calls[0]?.[0].payload.pages).toHaveLength(17);
  instantiate.mockClear();
  view.rerender(
    <StudioTemplateLibrary handle="x" locale="en-US" onUse={onUse} />
  );
  expect(screen.getByRole("alert")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Use this template: Artist" })
  ).not.toBeInTheDocument();
  expect(instantiate).not.toHaveBeenCalled();
});
