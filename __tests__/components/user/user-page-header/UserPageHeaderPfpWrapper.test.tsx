import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UserPageHeaderPfpWrapper from "@/components/user/user-page-header/pfp/UserPageHeaderPfpWrapper";

jest.mock("@/components/utils/icons/PencilIcon", () => () => (
  <span data-testid="pencil" />
));
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

describe("UserPageHeaderPfpWrapper", () => {
  it("opens and closes edit modal when button clicked", async () => {
    render(
      <UserPageHeaderPfpWrapper
        profile={{} as any}
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

  it("does not render a disabled button when picture is read-only", () => {
    render(
      <UserPageHeaderPfpWrapper
        profile={{} as any}
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
