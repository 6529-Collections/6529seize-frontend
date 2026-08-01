import { act, fireEvent, render, screen } from "@testing-library/react";
import CreateWaveFlow from "@/components/waves/create-wave/CreateWaveFlow";

// Escape is handled by a window listener, so a keydown anywhere that bubbles to
// window exercises it; document.body stands in for "not a form field".
const pressEscapeOn = (target: Element = document.body) => {
  fireEvent.keyDown(target, { key: "Escape" });
};

const flowRoot = (): HTMLElement => {
  const root = document.querySelector<HTMLElement>("[data-flow-title]");
  if (!root) {
    throw new Error("flow root not found");
  }
  return root;
};

const scrollRegion = (): HTMLElement => {
  const region = flowRoot().querySelector<HTMLElement>(":scope > div");
  if (!region) {
    throw new Error("scroll region not found");
  }
  return region;
};

describe("CreateWaveFlow", () => {
  it("renders provided children", () => {
    render(
      <CreateWaveFlow title="Test" onBack={() => {}}>
        <div data-testid="child">content</div>
      </CreateWaveFlow>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("content");
  });

  it("does not render legacy back button", () => {
    render(
      <CreateWaveFlow title="Test" onBack={() => {}}>
        <span>child</span>
      </CreateWaveFlow>
    );

    expect(screen.queryByRole('button', { name: 'All Waves' })).toBeNull();
  });

  it("exposes the title for the shell to read", () => {
    render(
      <CreateWaveFlow title="Create Wave" onBack={() => {}}>
        <span>child</span>
      </CreateWaveFlow>
    );

    expect(
      document.querySelector('[data-flow-title="Create Wave"]')
    ).toBeInTheDocument();
  });

  it("applies the native bounded height to the scroll region only", () => {
    render(
      <CreateWaveFlow
        title="Test"
        onBack={() => {}}
        nativeBoundedStyle={{ height: "640px" }}>
        <span>child</span>
      </CreateWaveFlow>
    );

    expect(scrollRegion().style.height).toBe("640px");
    expect(flowRoot().style.height).toBe("");
  });

  describe("escape to go back", () => {
    it("calls onBack when Escape is pressed", () => {
      const onBack = jest.fn();
      render(
        <CreateWaveFlow title="Test" onBack={onBack}>
          <span>child</span>
        </CreateWaveFlow>
      );

      pressEscapeOn();

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("ignores other keys", () => {
      const onBack = jest.fn();
      render(
        <CreateWaveFlow title="Test" onBack={onBack}>
          <span>child</span>
        </CreateWaveFlow>
      );

      fireEvent.keyDown(window, { key: "Enter" });

      expect(onBack).not.toHaveBeenCalled();
    });

    it("does not listen while the flow is inactive", () => {
      const onBack = jest.fn();
      render(
        <CreateWaveFlow title="Test" onBack={onBack} isActive={false}>
          <span>child</span>
        </CreateWaveFlow>
      );

      pressEscapeOn();

      expect(onBack).not.toHaveBeenCalled();
    });

    it("starts listening once the flow becomes active", () => {
      const onBack = jest.fn();
      const { rerender } = render(
        <CreateWaveFlow title="Test" onBack={onBack} isActive={false}>
          <span>child</span>
        </CreateWaveFlow>
      );

      rerender(
        <CreateWaveFlow title="Test" onBack={onBack} isActive>
          <span>child</span>
        </CreateWaveFlow>
      );
      pressEscapeOn();

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it.each(["input", "textarea", "select"])(
      "leaves Escape to the focused %s so it can cancel its own editing",
      (tagName) => {
        const onBack = jest.fn();
        render(
          <CreateWaveFlow title="Test" onBack={onBack}>
            {tagName === "input" && <input aria-label="field" />}
            {tagName === "textarea" && <textarea aria-label="field" />}
            {tagName === "select" && (
              <select aria-label="field">
                <option>one</option>
              </select>
            )}
          </CreateWaveFlow>
        );

        pressEscapeOn(screen.getByLabelText("field"));

        expect(onBack).not.toHaveBeenCalled();
      }
    );

    it("still goes back when Escape comes from a non-field element", () => {
      const onBack = jest.fn();
      render(
        <CreateWaveFlow title="Test" onBack={onBack}>
          <button type="button">somewhere</button>
        </CreateWaveFlow>
      );

      pressEscapeOn(screen.getByRole("button", { name: "somewhere" }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("uses the latest onBack without re-binding the listener", () => {
      const firstOnBack = jest.fn();
      const secondOnBack = jest.fn();
      const { rerender } = render(
        <CreateWaveFlow title="Test" onBack={firstOnBack}>
          <span>child</span>
        </CreateWaveFlow>
      );

      rerender(
        <CreateWaveFlow title="Test" onBack={secondOnBack}>
          <span>child</span>
        </CreateWaveFlow>
      );
      pressEscapeOn();

      expect(firstOnBack).not.toHaveBeenCalled();
      expect(secondOnBack).toHaveBeenCalledTimes(1);
    });

    it("stops listening after unmount", () => {
      const onBack = jest.fn();
      const { unmount } = render(
        <CreateWaveFlow title="Test" onBack={onBack}>
          <span>child</span>
        </CreateWaveFlow>
      );

      unmount();
      pressEscapeOn();

      expect(onBack).not.toHaveBeenCalled();
    });
  });

  describe("scroll reset", () => {
    let rafSpy: jest.SpyInstance;
    let cancelSpy: jest.SpyInstance;
    let frames: Array<FrameRequestCallback>;

    beforeEach(() => {
      frames = [];
      rafSpy = jest
        .spyOn(globalThis, "requestAnimationFrame")
        .mockImplementation((callback: FrameRequestCallback) => {
          frames.push(callback);
          return frames.length;
        });
      cancelSpy = jest
        .spyOn(globalThis, "cancelAnimationFrame")
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      rafSpy.mockRestore();
      cancelSpy.mockRestore();
    });

    const runFrames = () => {
      act(() => {
        const pending = [...frames];
        frames = [];
        pending.forEach((frame) => frame(0));
      });
    };

    it("snaps its own scrollport back to the top on a step change", () => {
      const { rerender } = render(
        <CreateWaveFlow title="Test" onBack={() => {}} scrollResetKey="step-1">
          <span>child</span>
        </CreateWaveFlow>
      );
      runFrames();

      const region = scrollRegion();
      region.scrollTop = 240;

      rerender(
        <CreateWaveFlow title="Test" onBack={() => {}} scrollResetKey="step-2">
          <span>child</span>
        </CreateWaveFlow>
      );
      runFrames();

      expect(region.scrollTop).toBe(0);
    });

    it("does not reset the scrollport while the step is unchanged", () => {
      const { rerender } = render(
        <CreateWaveFlow title="Test" onBack={() => {}} scrollResetKey="step-1">
          <span>child</span>
        </CreateWaveFlow>
      );
      runFrames();

      const region = scrollRegion();
      region.scrollTop = 180;

      rerender(
        <CreateWaveFlow title="Test" onBack={() => {}} scrollResetKey="step-1">
          <span>a different child</span>
        </CreateWaveFlow>
      );
      runFrames();

      expect(region.scrollTop).toBe(180);
    });

    it("cancels a pending frame when the step changes again first", () => {
      const { rerender } = render(
        <CreateWaveFlow title="Test" onBack={() => {}} scrollResetKey="step-1">
          <span>child</span>
        </CreateWaveFlow>
      );

      rerender(
        <CreateWaveFlow title="Test" onBack={() => {}} scrollResetKey="step-2">
          <span>child</span>
        </CreateWaveFlow>
      );

      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});
