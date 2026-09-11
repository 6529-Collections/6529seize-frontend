import CreateDropComposerSurface from "@/components/waves/create-drop-content/CreateDropComposerSurface";
import { AnimatePresence, domAnimation, LazyMotion } from "framer-motion";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";

let mockPrefersReducedMotion = false;

jest.mock("framer-motion", () => ({
  ...jest.requireActual("framer-motion"),
  useReducedMotion: () => mockPrefersReducedMotion,
}));

function Subject({ show }: { readonly show: boolean }) {
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false}>
        {show && (
          <CreateDropComposerSurface testId="composer-surface">
            <button type="button">Surface action</button>
          </CreateDropComposerSurface>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}

describe("CreateDropComposerSurface", () => {
  beforeEach(() => {
    mockPrefersReducedMotion = false;
  });

  it("keeps closing content mounted but removes it from interaction", async () => {
    const { rerender } = render(<Subject show />);
    const surface = screen.getByTestId("composer-surface");

    rerender(<Subject show={false} />);

    expect(surface).toHaveAttribute("data-state", "closing");
    expect(surface).toHaveAttribute("aria-hidden", "true");
    expect(surface).toHaveAttribute("inert");
    await waitForElementToBeRemoved(surface);
  });

  it("removes the surface immediately when reduced motion is preferred", async () => {
    mockPrefersReducedMotion = true;
    const { rerender } = render(<Subject show />);

    rerender(<Subject show={false} />);

    await waitFor(() => {
      expect(screen.queryByTestId("composer-surface")).not.toBeInTheDocument();
    });
  });
});
