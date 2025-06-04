jest.mock("next/font/google", () => ({ Poppins: () => () => null }));
jest.mock("../../../components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper", () => ({ __esModule: true, default: (p: any) => <>{p.children}</> }));
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlockPickerTimeWindowSelect from "../../../components/block-picker/BlockPickerTimeWindowSelect";
import { BlockPickerTimeWindow } from "../../../pages/meme-blocks";

jest.mock("../../../components/block-picker/BlockPickerTimeWindowSelectList", () => (props: any) => (
  <button data-testid="option" onClick={() => props.setTimeWindow(BlockPickerTimeWindow.ONE_MINUTE)} />
));

jest.mock("framer-motion", () => ({ motion: { div: (p: any) => <div {...p} /> }, useAnimate: () => [jest.fn(), jest.fn()] }));
jest.mock("react-use", () => ({ useClickAway: jest.fn(), useKeyPressEvent: jest.fn() }));

test("opens and selects option", async () => {
  const setTimeWindow = jest.fn();
  render(<BlockPickerTimeWindowSelect timeWindow={BlockPickerTimeWindow.NONE} setTimeWindow={setTimeWindow} />);
  await userEvent.click(screen.getByRole("button"));
  await userEvent.click(screen.getByTestId("option"));
  expect(setTimeWindow).toHaveBeenCalledWith(BlockPickerTimeWindow.ONE_MINUTE);
});
