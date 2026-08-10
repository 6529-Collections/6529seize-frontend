import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UserPageHeaderPfpWrapper from "@/components/user/user-page-header/pfp/UserPageHeaderPfpWrapper";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/components/utils/icons/PencilIcon", () => ({
  __esModule: true,
  default: () => <span data-testid="pencil" />,
  PencilIconSize: { SMALL: "SMALL", MEDIUM: "MEDIUM" },
}));
jest.mock(
  "@/components/user/user-page-header/pfp/UserPageHeaderEditPfp",
  () => (props: any) => (
    <button data-testid="edit" type="button" onClick={props.onClose} />
  )
);

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

const profile = new ApiIdentity();

describe("UserPageHeaderPfpWrapper", () => {
  it("opens and closes edit modal when button clicked", async () => {
    render(
      <UserPageHeaderPfpWrapper
        profile={profile}
        canEdit={true}
        profileLabel="Alice"
      >
        <span data-testid="child" />
      </UserPageHeaderPfpWrapper>
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Edit Alice's profile picture" })
    );
    expect(screen.getByTestId("edit")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("edit"));
    expect(screen.queryByTestId("edit")).toBeNull();
  });

  it("shows a bottom-right pencil badge on touch-first devices", () => {
    render(
      <UserPageHeaderPfpWrapper
        profile={profile}
        canEdit={true}
        profileLabel="Alice"
      >
        <span data-testid="child" />
      </UserPageHeaderPfpWrapper>
    );

    const pencilBadge = screen.getByTestId("pencil").parentElement;
    const pictureOverlay = pencilBadge?.parentElement;

    expect(pictureOverlay).toHaveClass("touch-only:tw-bg-transparent");
    expect(pictureOverlay).toHaveClass("touch-only:tw-opacity-100");
    expect(pencilBadge).toHaveClass(
      "touch-only:-tw-bottom-1",
      "touch-only:-tw-right-1"
    );
    expect(pencilBadge).toHaveClass("touch-only:tw-size-6");
  });

  it("does not render a disabled button when picture is read-only", () => {
    render(
      <UserPageHeaderPfpWrapper
        profile={profile}
        canEdit={false}
        profileLabel="Alice"
      >
        <span data-testid="child" />
      </UserPageHeaderPfpWrapper>
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
