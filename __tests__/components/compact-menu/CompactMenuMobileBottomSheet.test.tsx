import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";

jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    ({
      children,
      isOpen,
      title,
    }: {
      readonly children: ReactNode;
      readonly isOpen: boolean;
      readonly title: string;
    }) =>
      isOpen ? (
        <div role="dialog" aria-label={title}>
          {children}
        </div>
      ) : null
);

describe("CompactMenuMobileBottomSheet", () => {
  it("renders action icons supplied by the shared compact-menu model", async () => {
    const user = userEvent.setup();
    render(
      <CompactMenuMobileBottomSheet
        title="Profile actions"
        ariaLabel="Profile actions"
        trigger={<span>Open</span>}
        items={[
          {
            id: "mute",
            label: "Mute notifications",
            icon: <svg data-testid="mute-icon" aria-hidden="true" />,
          },
          {
            id: "block",
            label: "Block profile",
            icon: <svg data-testid="block-icon" aria-hidden="true" />,
          },
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Profile actions" }));

    expect(
      screen.getByRole("dialog", { name: "Profile actions" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("mute-icon")).toBeInTheDocument();
    expect(screen.getByTestId("block-icon")).toBeInTheDocument();
  });
});
