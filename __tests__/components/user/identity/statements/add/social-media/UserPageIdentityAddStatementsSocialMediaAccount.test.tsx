import { render } from "@testing-library/react";
import { act } from "@testing-library/react";
import type { ComponentProps } from "react";
import UserPageIdentityAddStatementsSocialMediaAccount from "@/components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccount";
import type UserPageIdentityAddStatementsSocialMediaAccountItems from "@/components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccountItems";
import type UserPageIdentityAddStatementsForm from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_TYPE, STATEMENT_GROUP } from "@/helpers/Types";

type ItemsProps = ComponentProps<
  typeof UserPageIdentityAddStatementsSocialMediaAccountItems
>;
type FormProps = ComponentProps<typeof UserPageIdentityAddStatementsForm>;
let itemsProps: ItemsProps;
let formProps: FormProps;

jest.mock(
  "@/components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccountItems",
  () => (props: ItemsProps) => {
    itemsProps = props;
    return <div data-testid="items" />;
  }
);

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm",
  () => (props: FormProps) => {
    formProps = props;
    return <div data-testid="form" />;
  }
);

describe("UserPageIdentityAddStatementsSocialMediaAccount", () => {
  const profile = { id: "p1" } as ApiIdentity;
  const onClose = jest.fn();

  it("passes props and updates type", () => {
    render(
      <UserPageIdentityAddStatementsSocialMediaAccount
        profile={profile}
        onClose={onClose}
      />
    );

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.X);
    expect(typeof itemsProps.setSocialType).toBe("function");

    expect(formProps.group).toBe(STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.X);
    expect(formProps.profile).toBe(profile);

    act(() => {
      itemsProps.setSocialType(STATEMENT_TYPE.REDDIT);
    });

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.REDDIT);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.REDDIT);
  });
});
