import { render } from "@testing-library/react";
import { act } from "@testing-library/react";
import type { ComponentProps } from "react";
import UserPageIdentityAddStatementsContact from "@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContact";
import type UserPageIdentityAddStatementsContactItems from "@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContactItems";
import type UserPageIdentityAddStatementsForm from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_TYPE, STATEMENT_GROUP } from "@/helpers/Types";

type ItemsProps = ComponentProps<
  typeof UserPageIdentityAddStatementsContactItems
>;
type FormProps = ComponentProps<typeof UserPageIdentityAddStatementsForm>;
let itemsProps: ItemsProps;
let formProps: FormProps;

jest.mock(
  "@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContactItems",
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

describe("UserPageIdentityAddStatementsContact", () => {
  const profile = { id: "p1" } as ApiIdentity;
  const onClose = jest.fn();

  it("passes props and updates active type", () => {
    render(
      <UserPageIdentityAddStatementsContact
        profile={profile}
        onClose={onClose}
      />
    );

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.DISCORD);
    expect(typeof itemsProps.setContactType).toBe("function");

    expect(formProps.group).toBe(STATEMENT_GROUP.CONTACT);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.DISCORD);
    expect(formProps.profile).toBe(profile);

    act(() => {
      itemsProps.setContactType(STATEMENT_TYPE.TELEGRAM);
    });

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.TELEGRAM);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.TELEGRAM);
  });
});
