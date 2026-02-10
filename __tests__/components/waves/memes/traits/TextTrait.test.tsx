import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { TextTrait } from "@/components/waves/memes/traits/TextTrait";

jest.mock("react-use", () => ({
  useDebounce: (fn: any, _ms: number, deps: any[]) => {
    const React = require("react");
    React.useEffect(fn, deps);
  },
}));

test("debounces text updates", async () => {
  const updateText = jest.fn();
  render(
    <TextTrait label="Label" field="title" traits={{ title: "" } as any} updateText={updateText} />
  );
  const input = screen.getByRole("textbox");
  await userEvent.type(input, "abc");
  expect(updateText).toHaveBeenCalledWith("title", "abc");
});

test("updates text on blur", async () => {
  const updateText = jest.fn();
  render(
    <TextTrait label="Label" field="title" traits={{ title: "hi" } as any} updateText={updateText} />
  );
  const input = screen.getByRole("textbox") as HTMLInputElement;
  await userEvent.clear(input);
  await userEvent.type(input, "bye");
  updateText.mockClear();
  act(() => {
    input.blur();
  });
  expect(updateText).toHaveBeenCalledWith("title", "bye");
});

test("syncs input when traits change", () => {
  const updateText = jest.fn();
  const { rerender } = render(
    <TextTrait label="Label" field="title" traits={{ title: "one" } as any} updateText={updateText} />
  );
  const input = screen.getByRole("textbox") as HTMLInputElement;
  expect(input.value).toBe("one");
  rerender(
    <TextTrait label="Label" field="title" traits={{ title: "two" } as any} updateText={updateText} />
  );
  expect(input.value).toBe("two");
});
