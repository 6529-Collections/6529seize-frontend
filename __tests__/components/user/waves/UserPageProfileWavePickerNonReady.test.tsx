import { fireEvent, render, screen } from "@testing-library/react";
import UserPageProfileWavePickerNonReady from "@/components/user/waves/UserPageProfileWavePickerNonReady";

describe("UserPageProfileWavePickerNonReady", () => {
  it("links directly to Identity when the owner has no profile", () => {
    render(
      <UserPageProfileWavePickerNonReady
        state={{ kind: "missing_profile" }}
        variant="panel"
        profileHref="/0x123"
        onCreateProfileCuration={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(
      screen.getByRole("link", { name: "Go to Identity" })
    ).toHaveAttribute("href", "/0x123");
  });

  it("offers guided setup before advanced Wave setup", () => {
    const onCreateProfileCuration = jest.fn();
    render(
      <UserPageProfileWavePickerNonReady
        state={{ kind: "no_public_waves", hasCreatedWaves: false }}
        variant="panel"
        profileHref="/alice"
        onCreateProfileCuration={onCreateProfileCuration}
        onRetry={jest.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Create Curation" })
    );

    expect(onCreateProfileCuration).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: "Advanced Wave setup" })
    ).toHaveAttribute("href", "/waves?create=wave");
  });
});
