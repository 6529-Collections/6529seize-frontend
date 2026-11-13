import { render } from "@testing-library/react";
import { useRef } from "react";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";
import { dismissAndroidBackLayer } from "@/services/capacitor/android-back-layers";

let mockPlatform = "android";
jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: {
    isNativePlatform: () => mockPlatform !== "web",
    getPlatform: () => mockPlatform,
  },
}));

function Layer({ enabled, onBack }: { enabled: boolean; onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useAndroidBackLayer(enabled, ref, onBack);
  return <div ref={ref}>Layer</div>;
}

beforeEach(() => {
  mockPlatform = "android";
});

it("uses the latest callback and releases a closed layer", () => {
  const initialBack = jest.fn();
  const nextBack = jest.fn();
  const view = render(<Layer enabled onBack={initialBack} />);
  view.rerender(<Layer enabled onBack={nextBack} />);
  expect(dismissAndroidBackLayer()).toBe(true);
  expect(nextBack).toHaveBeenCalledTimes(1);
  expect(initialBack).not.toHaveBeenCalled();
  view.rerender(<Layer enabled={false} onBack={nextBack} />);
  expect(dismissAndroidBackLayer()).toBe(false);
});

it("releases an unmounted layer", () => {
  const onBack = jest.fn();
  const view = render(<Layer enabled onBack={onBack} />);
  view.unmount();
  expect(dismissAndroidBackLayer()).toBe(false);
  expect(onBack).not.toHaveBeenCalled();
});

it.each(["web", "ios"])("does not register a %s layer", (platform) => {
  mockPlatform = platform;
  render(<Layer enabled onBack={jest.fn()} />);
  expect(dismissAndroidBackLayer()).toBe(false);
});
