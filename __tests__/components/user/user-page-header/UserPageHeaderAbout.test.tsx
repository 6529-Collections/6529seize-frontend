import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageHeaderAbout from "@/components/user/user-page-header/about/UserPageHeaderAbout";
import type { CicStatement } from "@/entities/IProfile";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";

jest.mock(
  "@/components/user/user-page-header/about/UserPageHeaderAboutStatement",
  () => (props: any) => (
    <div data-testid="statement">{JSON.stringify(props)}</div>
  )
);

jest.mock(
  "@/components/user/user-page-header/about/UserPageHeaderAboutEdit",
  () => (props: any) => (
    <button data-testid="edit" type="button" onClick={() => props.onClose()} />
  )
);

const createProfile = (handle: string): ApiIdentity => {
  const profile = new ApiIdentity();
  profile.handle = handle;
  return profile;
};

const profile = createProfile("alice");
const statement: CicStatement = {
  id: "statement-1",
  profile_id: "profile-1",
  statement_group: STATEMENT_GROUP.GENERAL,
  statement_type: STATEMENT_TYPE.BIO,
  statement_comment: null,
  statement_value: "Hello there",
  crated_at: new Date("2024-01-01T00:00:00.000Z"),
  updated_at: null,
};

describe("UserPageHeaderAbout", () => {
  it("opens edit view from the empty About add action", async () => {
    render(
      <UserPageHeaderAbout profile={profile} statement={null} canEdit={true} />
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Add About statement" })
    );
    expect(screen.getByTestId("edit")).toBeInTheDocument();
  });

  it("opens edit view from the statement edit action", async () => {
    render(
      <UserPageHeaderAbout
        profile={profile}
        statement={statement}
        canEdit={true}
      />
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Edit About statement" })
    );
    expect(screen.getByTestId("edit")).toBeInTheDocument();
  });

  it("keeps the inline statement edit action desktop-only", () => {
    render(
      <UserPageHeaderAbout
        profile={profile}
        statement={statement}
        canEdit={true}
      />
    );

    const editButton = screen.getByRole("button", {
      name: "Edit About statement",
    });
    expect(editButton).toHaveClass("tw-hidden", "sm:tw-block");
    expect(editButton).toHaveClass(
      "desktop-hover:group-hover:tw-pointer-events-auto",
      "desktop-hover:group-hover:tw-opacity-100"
    );
  });

  it("resets view when props change", () => {
    const { rerender } = render(
      <UserPageHeaderAbout profile={profile} statement={null} canEdit={true} />
    );
    rerender(
      <UserPageHeaderAbout
        profile={createProfile("bob")}
        statement={null}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("statement")).toBeInTheDocument();
  });
});
