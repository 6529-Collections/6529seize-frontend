import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import IdentitySearch from "@/components/utils/input/identity/IdentitySearch";
import { useQuery } from "@tanstack/react-query";

let receivedProps: any;

jest.mock(
  "@/components/utils/input/profile-search/CommonProfileSearchItems",
  () => (props: any) => {
    receivedProps = props;
    return <div data-testid="items" />;
  }
);

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));

describe("IdentitySearch", () => {
  const setIdentity = jest.fn();

  beforeEach(() => {
    receivedProps = undefined;
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          handle: "user",
          display: "User",
          wallet: "0x1",
          primary_wallet: "0x1",
          pfp: "avatar.png",
          profile_id: "profile-1",
        },
      ],
    });
  });

  it("opens the dropdown after typing and selects the profile identity", () => {
    render(<IdentitySearch identity={null} setIdentity={setIdentity} />);

    const input = screen.getByRole("combobox", { name: "Identity" });
    fireEvent.focus(input);
    expect(receivedProps.open).toBe(false);

    fireEvent.change(input, { target: { value: "a" } });
    expect(receivedProps.open).toBe(false);

    fireEvent.change(input, { target: { value: "abc" } });
    expect(receivedProps.open).toBe(true);

    receivedProps.onProfileSelect({
      handle: "user",
      display: "User",
      wallet: "0x1",
      primary_wallet: "0x1",
      pfp: "avatar.png",
      profile_id: "profile-1",
    });

    expect(setIdentity).toHaveBeenCalledWith("0x1");
  });

  it("returns full selection metadata when a profile is selected", () => {
    const onSelectionChange = jest.fn();

    render(
      <IdentitySearch
        identity={null}
        setIdentity={setIdentity}
        onSelectionChange={onSelectionChange}
      />
    );

    receivedProps.onProfileSelect({
      handle: "user",
      display: "User",
      wallet: "0x1",
      primary_wallet: "0x1",
      pfp: "avatar.png",
      profile_id: "profile-1",
    });

    expect(onSelectionChange).toHaveBeenCalledWith({
      value: "0x1",
      label: "user",
      secondaryLabel: "0x1",
      avatarUrl: "avatar.png",
      profileId: "profile-1",
    });
  });

  it("keeps the selected profile label after the identity prop updates from the local selection", () => {
    const { rerender } = render(
      <IdentitySearch identity={null} setIdentity={setIdentity} />
    );

    receivedProps.onProfileSelect({
      handle: "user",
      display: "User",
      wallet: "0x1",
      primary_wallet: "0x1",
      pfp: "avatar.png",
      profile_id: "profile-1",
    });

    rerender(<IdentitySearch identity="0x1" setIdentity={setIdentity} />);

    expect(screen.getByRole("combobox", { name: "Identity" })).toHaveValue(
      "user"
    );
  });

  it("falls back to the handle when display is an empty string", () => {
    const onSelectionChange = jest.fn();

    render(
      <IdentitySearch
        identity={null}
        setIdentity={setIdentity}
        onSelectionChange={onSelectionChange}
      />
    );

    receivedProps.onProfileSelect({
      handle: "user",
      display: "",
      wallet: "0x1",
      primary_wallet: "0x1",
      pfp: "avatar.png",
      profile_id: "profile-1",
    });

    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "user",
        secondaryLabel: "0x1",
      })
    );
  });

  it("falls back to the primary address when no handle exists", () => {
    const onSelectionChange = jest.fn();

    render(
      <IdentitySearch
        identity={null}
        setIdentity={setIdentity}
        onSelectionChange={onSelectionChange}
      />
    );

    receivedProps.onProfileSelect({
      handle: null,
      display: "User",
      wallet: "0x2",
      primary_wallet: "0x1",
      pfp: "avatar.png",
      profile_id: "profile-1",
    });

    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "0x1",
      })
    );
  });

  it("uses the selected display value in the input", () => {
    render(
      <IdentitySearch
        identity="0x1"
        selectedDisplayValue="User"
        setIdentity={setIdentity}
      />
    );

    expect(screen.getByRole("combobox", { name: "Identity" })).toHaveValue(
      "User"
    );
  });

  it("keeps the selected profile label when the parent rerenders with identity and display value", () => {
    const { rerender } = render(
      <IdentitySearch identity={null} setIdentity={setIdentity} />
    );

    receivedProps.onProfileSelect({
      handle: "user",
      display: "User",
      wallet: "0x1",
      primary_wallet: "0x1",
      pfp: "avatar.png",
      profile_id: "profile-1",
    });

    rerender(
      <IdentitySearch
        identity="0x1"
        selectedDisplayValue="User"
        setIdentity={setIdentity}
      />
    );

    expect(screen.getByRole("combobox", { name: "Identity" })).toHaveValue(
      "User"
    );
  });

  it("hides the clear button when clearable is false", () => {
    render(
      <IdentitySearch
        identity="0x1"
        selectedDisplayValue="User"
        clearable={false}
        setIdentity={setIdentity}
      />
    );

    expect(screen.queryByLabelText("Clear identity")).not.toBeInTheDocument();
  });

  it("replaces a stale local draft when the controlled identity display changes externally", () => {
    const { rerender } = render(
      <IdentitySearch identity={null} setIdentity={setIdentity} />
    );

    const input = screen.getByRole("combobox", { name: "Identity" });

    fireEvent.change(input, { target: { value: "draft" } });
    expect(input).toHaveValue("draft");

    rerender(
      <IdentitySearch
        identity="0x2"
        selectedDisplayValue="Other User"
        setIdentity={setIdentity}
      />
    );

    expect(input).toHaveValue("Other User");
  });

  it("clears identity when the clear button is clicked", () => {
    const { rerender } = render(
      <IdentitySearch identity="bob" setIdentity={setIdentity} />
    );

    fireEvent.click(screen.getByLabelText("Clear identity"));

    expect(setIdentity).toHaveBeenCalledWith(null);

    rerender(<IdentitySearch identity={null} setIdentity={setIdentity} />);

    expect(screen.getByRole("combobox", { name: "Identity" })).toHaveValue("");
  });
});
