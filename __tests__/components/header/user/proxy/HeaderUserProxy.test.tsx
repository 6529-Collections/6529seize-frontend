import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import HeaderUserProxy from "../../../../../components/header/user/proxy/HeaderUserProxy";

let clickAwayCb: () => void;
let keyPressCb: () => void;

jest.mock("react-use", () => ({
  useClickAway: (_ref: any, cb: () => void) => {
    clickAwayCb = cb;
  },
  useKeyPressEvent: (_key: string, cb: () => void) => {
    keyPressCb = cb;
  },
}));

const dropdownMock = jest.fn();
jest.mock(
  "../../../../../components/header/user/proxy/HeaderUserProxyDropdown",
  () => (props: any) => {
    dropdownMock(props);
    return <div data-testid="dropdown" />;
  },
);

const profile = { handle: "alice" } as any;

describe("HeaderUserProxy", () => {
  beforeEach(() => dropdownMock.mockClear());

  it("toggles dropdown when button clicked", () => {
    render(<HeaderUserProxy profile={profile} />);
    const btn = screen.getByRole("button", { name: /choose proxy/i });
    expect(dropdownMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );

    fireEvent.click(btn);
    expect(dropdownMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: true }),
    );

    fireEvent.click(btn);
    expect(dropdownMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
  });

  it("closes when escape pressed and when clicking away", () => {
    render(<HeaderUserProxy profile={profile} />);
    const btn = screen.getByRole("button", { name: /choose proxy/i });

    fireEvent.click(btn);
    expect(dropdownMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: true }),
    );

    act(() => {
      keyPressCb();
    });
    expect(dropdownMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );

    fireEvent.click(btn);
    expect(dropdownMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: true }),
    );

    act(() => {
      clickAwayCb();
    });
    expect(dropdownMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
  });
});
