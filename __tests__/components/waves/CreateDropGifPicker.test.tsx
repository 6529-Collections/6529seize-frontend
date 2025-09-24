import { fireEvent, render, screen } from "@testing-library/react";
import CreateDropGifPicker from "../../../components/waves/CreateDropGifPicker";

jest.mock("gif-picker-react", () => ({
  __esModule: true,
  default: ({ onGifClick }: any) => (
    <button onClick={() => onGifClick({ url: "g" })} data-testid="picker" />
  ),
  Theme: { DARK: "dark" },
}));

type DialogProps = { isOpen: boolean; onClose: () => void; children: any };
jest.mock(
  "../../../components/mobile-wrapper-dialog/MobileWrapperDialog",
  () => (props: DialogProps) =>
    (
      <div data-testid="dialog">
        <button aria-label="Close panel" onClick={props.onClose}></button>
        {props.children}
      </div>
    )
);

describe("CreateDropGifPicker", () => {
  it("passes events to picker and dialog", () => {
    const onSelect = jest.fn();
    const setShow = jest.fn();
    const { publicEnv } = require("@/config/env");
    render(
      <CreateDropGifPicker
        tenorApiKey={publicEnv.TENOR_API_KEY}
        show={true}
        setShow={setShow}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByTestId("picker"));
    expect(onSelect).toHaveBeenCalledWith("g");

    fireEvent.click(screen.getByLabelText("Close panel"));
    expect(setShow).toHaveBeenCalledWith(false);
  });
});
