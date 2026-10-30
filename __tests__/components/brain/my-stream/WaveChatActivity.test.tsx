import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import WaveChatActivity from "@/components/brain/my-stream/WaveChatActivity";

afterEach(() => jest.restoreAllMocks());

it("lazily retains visited chat DOM and draft while pausing hidden effects", () => {
  // The shared CSS stub omits visibility properties. This component uses only
  // inline display state, so expose that real style declaration to DOM matchers.
  jest
    .spyOn(window, "getComputedStyle")
    .mockImplementation((element) => (element as HTMLElement).style);
  const initialize = jest.fn(() => "");
  const subscribe = jest.fn();
  const unsubscribe = jest.fn();
  function Chat() {
    const [draft, setDraft] = useState(initialize);
    useEffect(() => {
      subscribe();
      return unsubscribe;
    }, []);
    return (
      <input
        aria-label="Draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    );
  }
  const content = (active: boolean, wave = "wave-1") => (
    <WaveChatActivity key={wave} active={active} chat={<Chat />}>
      <h1>Leaderboard</h1>
    </WaveChatActivity>
  );
  const { rerender } = render(content(false));
  expect(initialize).not.toHaveBeenCalled();
  expect(subscribe).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
  rerender(content(true));
  const editor = screen.getByRole("textbox", { name: "Draft" });
  fireEvent.change(editor, { target: { value: "Keep this draft" } });
  expect(subscribe).toHaveBeenCalledTimes(1);
  rerender(content(false));
  expect(editor).not.toBeVisible();
  expect(
    screen.queryByRole("textbox", { name: "Draft" })
  ).not.toBeInTheDocument();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  rerender(content(true));
  expect(screen.getByRole("textbox", { name: "Draft" })).toBe(editor);
  expect(editor).toHaveValue("Keep this draft");
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(subscribe).toHaveBeenCalledTimes(2);
  rerender(content(false, "wave-2"));
  expect(editor).not.toBeInTheDocument();
  rerender(content(true, "wave-2"));
  expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("");
  expect(screen.getByRole("textbox", { name: "Draft" })).not.toBe(editor);
});
