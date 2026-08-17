import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import UserPageIdentityAddStatementsSocialMediaPosts from "@/components/user/identity/statements/add/social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPosts";
import type UserPageIdentityAddStatementsForm from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

type FormProps = ComponentProps<typeof UserPageIdentityAddStatementsForm>;
let formProps: FormProps;

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm",
  () => ({
    __esModule: true,
    default: (props: FormProps) => {
      formProps = props;
      return <div data-testid="form" />;
    },
  })
);

test("passes props to form", () => {
  const profile = { handle: "a" } as ApiIdentity;
  const onClose = jest.fn();
  render(
    <UserPageIdentityAddStatementsSocialMediaPosts
      profile={profile}
      onClose={onClose}
    />
  );
  expect(screen.getByTestId("form")).toBeInTheDocument();
  expect(formProps.profile).toBe(profile);
  expect(formProps.activeType).toBe("LINK");
  expect(formProps.group).toBe("SOCIAL_MEDIA_VERIFICATION_POST");
});
