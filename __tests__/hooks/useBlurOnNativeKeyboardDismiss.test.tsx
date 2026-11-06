import { renderHook } from "@testing-library/react";
import { useBlurOnNativeKeyboardDismiss } from "@/hooks/useBlurOnNativeKeyboardDismiss";

let mockIsVisible = false;
jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: () => ({ isVisible: mockIsVisible }),
}));

it("blurs only after an enabled native keyboard has opened and closed", () => {
  const blur = jest.fn();
  const { rerender } = renderHook(
    ({ enabled }) => useBlurOnNativeKeyboardDismiss(blur, enabled),
    {
      initialProps: { enabled: true },
    }
  );
  expect(blur).not.toHaveBeenCalled();
  mockIsVisible = true;
  rerender({ enabled: true });
  expect(blur).not.toHaveBeenCalled();
  mockIsVisible = false;
  rerender({ enabled: true });
  expect(blur).toHaveBeenCalledTimes(1);
  mockIsVisible = true;
  rerender({ enabled: false });
  mockIsVisible = false;
  rerender({ enabled: false });
  expect(blur).toHaveBeenCalledTimes(1);
});
