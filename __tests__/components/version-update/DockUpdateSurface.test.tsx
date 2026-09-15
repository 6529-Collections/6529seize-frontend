import { render } from "@testing-library/react";
import DockUpdateSurface from "@/components/version-update/DockUpdateSurface";

it("renders the complete surface without measuring the layout", () => {
  const bounds = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect");
  try {
    const view = render(<DockUpdateSurface />);
    expect(
      view.container.querySelector("[data-dock-update-surface]")
    ).not.toBeNull();
    expect(bounds).not.toHaveBeenCalled();
    const clip = view.container.querySelector("clipPath");
    const id = clip?.id;
    view.rerender(<DockUpdateSurface />);
    expect(view.container.querySelector("clipPath")?.id).toBe(id);
    expect(bounds).not.toHaveBeenCalled();
  } finally {
    bounds.mockRestore();
  }
});

it("keeps each mounted dock's shape references independent", () => {
  const view = render(
    <>
      <DockUpdateSurface />
      <DockUpdateSurface />
    </>
  );
  const clips = [...view.container.querySelectorAll("clipPath")];
  expect(clips).toHaveLength(2);
  expect(clips[0]?.id).not.toBe(clips[1]?.id);
});
