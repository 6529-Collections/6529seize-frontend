import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { StrictMode, useState } from "react";
import { useMobileFormHistory } from "@/components/mobile-navigation/useMobileFormHistory";

function Overlay({
  label,
  close,
}: {
  readonly label: string;
  readonly close: () => void;
}) {
  useMobileFormHistory(true, close);
  return <button onClick={close}>{label}</button>;
}

function Harness() {
  const [outer, setOuter] = useState(true);
  const [inner, setInner] = useState(false);
  return (
    <>
      {outer && <Overlay label="Outer" close={() => setOuter(false)} />}
      <button onClick={() => setInner(true)}>Open inner</button>
      {inner && <Overlay label="Inner" close={() => setInner(false)} />}
    </>
  );
}

it("uses one Back after Strict Mode replays setup", async () => {
  window.history.replaceState({ original: true }, "", "/waves/wave");
  render(
    <StrictMode>
      <Harness />
    </StrictMode>
  );
  await act(async () => {
    await Promise.resolve();
  });
  window.history.back();
  await waitFor(() => expect(screen.queryByText("Outer")).toBeNull());
  await waitFor(() => expect(window.history.state).toEqual({ original: true }));
});

it("closes the innermost overlay before its containing form", async () => {
  window.history.replaceState({ original: true }, "", "/waves/wave");
  render(<Harness />);
  fireEvent.click(screen.getByText("Open inner"));
  window.history.back();
  await waitFor(() => expect(screen.queryByText("Inner")).toBeNull());
  expect(screen.getByText("Outer")).toBeVisible();
  await waitFor(() => expect(window.history.state.mobileForm).toBeDefined());
  window.history.back();
  await waitFor(() => expect(screen.queryByText("Outer")).toBeNull());
  await waitFor(() => expect(window.history.state).toEqual({ original: true }));
});
