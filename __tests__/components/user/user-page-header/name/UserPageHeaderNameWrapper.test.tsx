import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UserPageHeaderNameWrapper from "@/components/user/user-page-header/name/UserPageHeaderNameWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/components/utils/icons/PencilIcon", () => ({
  __esModule: true,
  default: () => <span data-testid="pencil" />,
  PencilIconSize: { SMALL: "SMALL", MEDIUM: "MEDIUM" },
}));
jest.mock(
  "@/components/utils/animation/CommonAnimationWrapper",
  () =>
    ({ children }: any) => <div>{children}</div>
);
jest.mock(
  "@/components/utils/animation/CommonAnimationOpacity",
  () =>
    ({ children, onClicked }: any) => (
      <button data-testid="opacity" type="button" onClick={onClicked}>
        {children}
      </button>
    )
);

jest.mock(
  "@/components/user/user-page-header/name/UserPageHeaderEditName",
  () => (props: any) => (
    <button data-testid="edit" type="button" onClick={props.onClose} />
  )
);

describe("UserPageHeaderNameWrapper", () => {
  it("opens and closes edit modal when button clicked", async () => {
    render(
      <UserPageHeaderNameWrapper
        profile={{} as ApiIdentity}
        canEdit={true}
        profileLabel="Alice"
      >
        <span data-testid="child" />
      </UserPageHeaderNameWrapper>
    );

    expect(
      screen.getByTestId("pencil").parentElement?.parentElement
    ).toHaveClass(
      "group-focus-within:tw-block",
      "desktop-hover:group-hover:tw-block",
      "touch-only:tw-block"
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Edit Alice's profile name" })
    );
    expect(screen.getByTestId("edit")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("edit"));
    expect(screen.queryByTestId("edit")).toBeNull();
  });

  it("does not render a disabled button when name is read-only", () => {
    render(
      <UserPageHeaderNameWrapper
        profile={{} as ApiIdentity}
        canEdit={false}
        profileLabel="Alice"
      >
        <span data-testid="child" />
      </UserPageHeaderNameWrapper>
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
