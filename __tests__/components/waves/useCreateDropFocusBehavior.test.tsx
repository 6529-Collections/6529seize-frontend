import { act, renderHook } from "@testing-library/react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { CreateDropInputHandles } from "@/components/waves/CreateDropInput";
import { useCreateDropFocusBehavior } from "@/components/waves/create-drop-content/useCreateDropFocusBehavior";
import {
  ActiveDropAction,
  type ActiveDropState,
} from "@/types/dropInteractionTypes";

jest.mock("@/hooks/useBlurOnNativeKeyboardDismiss", () => ({
  useBlurOnNativeKeyboardDismiss: jest.fn(),
}));

const reply: ActiveDropState = {
  action: ActiveDropAction.REPLY,
  drop: { id: "drop-1" } as ApiDrop,
  partId: 1,
};

function setup({
  isApp = true,
  activeDrop = null,
  focusOnInitialActiveDrop = false,
}: {
  isApp?: boolean;
  activeDrop?: ActiveDropState | null;
  focusOnInitialActiveDrop?: boolean;
} = {}) {
  const focus = jest.fn();
  const createDropInputRef = {
    current: {
      focus,
      blur: jest.fn(),
      clearEditorState: jest.fn(),
      setMarkdown: jest.fn(),
      expandMentionAliases: jest.fn(),
    } satisfies CreateDropInputHandles,
  };
  const hook = renderHook(
    ({ target }: { target: ActiveDropState | null }) =>
      useCreateDropFocusBehavior({
        activeDrop: target,
        isApp,
        focusOnInitialActiveDrop,
        createDropInputRef,
      }),
    { initialProps: { target: activeDrop } }
  );
  return { ...hook, focus };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("focuses a native reply at commit without a timer or animation frame", () => {
  const { rerender, focus } = setup();
  expect(focus).not.toHaveBeenCalled();
  rerender({ target: reply });
  expect(focus).toHaveBeenCalledTimes(1);
  act(() => jest.runAllTimers());
  expect(focus).toHaveBeenCalledTimes(1);
});

it("does not open the native keyboard for a restored reply on page load", () => {
  const { focus, rerender } = setup({ activeDrop: reply });
  expect(focus).not.toHaveBeenCalled();
  act(() => jest.runAllTimers());
  expect(focus).not.toHaveBeenCalled();
  rerender({ target: { ...reply, partId: 2 } });
  expect(focus).toHaveBeenCalledTimes(1);
});

it("keeps explicit initial focus limited to the initial reply", () => {
  const { focus, rerender } = setup({
    activeDrop: reply,
    focusOnInitialActiveDrop: true,
  });
  expect(focus).toHaveBeenCalledTimes(1);
  rerender({ target: { ...reply, partId: 2 } });
  expect(focus).toHaveBeenCalledTimes(1);
});

it("does not focus or schedule a stale focus when cancelling a native reply", () => {
  const { rerender, focus, unmount } = setup();
  rerender({ target: reply });
  focus.mockClear();
  rerender({ target: null });
  unmount();
  act(() => jest.runAllTimers());
  expect(focus).not.toHaveBeenCalled();
});

it("preserves desktop's delayed focus and cancels it when the reply is removed", () => {
  const { rerender, focus } = setup({ isApp: false });
  rerender({ target: reply });
  expect(focus).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(100));
  expect(focus).toHaveBeenCalledTimes(1);
  rerender({ target: { ...reply, partId: 2 } });
  rerender({ target: null });
  act(() => jest.runAllTimers());
  expect(focus).toHaveBeenCalledTimes(1);
});
