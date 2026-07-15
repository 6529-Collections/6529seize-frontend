import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageHeaderAbout from "@/components/user/user-page-header/about/UserPageHeaderAbout";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

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

const profile: ApiIdentity = { handle: "alice" } as any;

describe("UserPageHeaderAbout", () => {
  it("opens edit view from the empty About add action", async () => {
    render(
      <UserPageHeaderAbout profile={profile} statement={null} canEdit={true} />
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Add About statement" })
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "About" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("edit")).toBeInTheDocument();
  });

  it("opens edit view from the statement edit action", async () => {
    render(
      <UserPageHeaderAbout
        profile={profile}
        statement={{ statement_value: "Hello there" } as any}
        canEdit={true}
      />
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Edit About statement" })
    );
    expect(screen.getByTestId("edit")).toBeInTheDocument();
  });

  it("resets view when props change", () => {
    const { rerender } = render(
      <UserPageHeaderAbout profile={profile} statement={null} canEdit={true} />
    );
    rerender(
      <UserPageHeaderAbout
        profile={{ handle: "bob" } as any}
        statement={null}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("statement")).toBeInTheDocument();
  });
});
