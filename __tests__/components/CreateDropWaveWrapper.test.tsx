import { render, screen } from "@testing-library/react";
import React from "react";
import { CreateDropWaveWrapperContext } from "@/components/waves/CreateDropWaveWrapper";

let mockIos = false;
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIos }),
}));

beforeEach(() => {
  (global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  mockIos = false;
});

describe("CreateDropWaveWrapper", () => {
  it("uses the layout viewport and keyboard inset for iOS max-height", () => {
    mockIos = true;
    const {
      CreateDropWaveWrapper,
    } = require("@/components/waves/CreateDropWaveWrapper");
    render(
      <CreateDropWaveWrapper context={CreateDropWaveWrapperContext.WAVE_CHAT}>
        <div>child</div>
      </CreateDropWaveWrapper>
    );
    const div = screen.getByText("child").parentElement as HTMLElement;
    expect(div.className).toContain(
      "tw-max-h-[calc(var(--layout-viewport-height)-var(--native-keyboard-inset-bottom,0px)-14.7rem)]"
    );
  });

  it("uses default classes when not ios", () => {
    const {
      CreateDropWaveWrapper,
    } = require("@/components/waves/CreateDropWaveWrapper");
    render(
      <CreateDropWaveWrapper>
        <span>ok</span>
      </CreateDropWaveWrapper>
    );
    const div = screen.getByText("ok").parentElement as HTMLElement;
    expect(div.className).toContain("tw-max-h-[calc(100vh-8.5rem)]");
  });

  it("registers its container as a composer dock while mounted", () => {
    const {
      CreateDropWaveWrapper,
    } = require("@/components/waves/CreateDropWaveWrapper");
    const {
      getWaveComposerDockElements,
    } = require("@/components/waves/WaveComposerDockVisibility");

    expect(getWaveComposerDockElements()).toEqual([]);

    const { unmount } = render(
      <CreateDropWaveWrapper>
        <span>ok</span>
      </CreateDropWaveWrapper>
    );
    const container = screen.getByText("ok").parentElement as HTMLElement;
    expect(getWaveComposerDockElements()).toEqual([container]);

    unmount();
    expect(getWaveComposerDockElements()).toEqual([]);
  });
});
