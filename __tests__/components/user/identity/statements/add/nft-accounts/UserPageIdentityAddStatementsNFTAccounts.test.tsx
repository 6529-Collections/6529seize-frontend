import { render } from "@testing-library/react";
import { act } from "@testing-library/react";
import type { ComponentProps } from "react";
import UserPageIdentityAddStatementsNFTAccounts from "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccounts";
import type UserPageIdentityAddStatementsNFTAccountItems from "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccountItems";
import type UserPageIdentityAddStatementsForm from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_TYPE, STATEMENT_GROUP } from "@/helpers/Types";

type ItemsProps = ComponentProps<
  typeof UserPageIdentityAddStatementsNFTAccountItems
>;
type FormProps = ComponentProps<typeof UserPageIdentityAddStatementsForm>;
let itemsProps: ItemsProps;
let formProps: FormProps;

jest.mock(
  "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccountItems",
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

describe("UserPageIdentityAddStatementsNFTAccounts", () => {
  const profile = { query: "foo" } as ApiIdentity;
  const onClose = jest.fn();

  it("passes initial props to children", () => {
    render(
      <UserPageIdentityAddStatementsNFTAccounts
        onClose={onClose}
        profile={profile}
      />
    );

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.SUPER_RARE);
    expect(typeof itemsProps.setType).toBe("function");

    expect(formProps.activeType).toBe(STATEMENT_TYPE.SUPER_RARE);
    expect(formProps.group).toBe(STATEMENT_GROUP.NFT_ACCOUNTS);
    expect(formProps.profile).toBe(profile);
    expect(formProps.onClose).toBe(onClose);
  });

  it("updates active type when setType called", () => {
    render(
      <UserPageIdentityAddStatementsNFTAccounts
        onClose={onClose}
        profile={profile}
      />
    );

    act(() => {
      itemsProps.setType(STATEMENT_TYPE.FOUNDATION);
    });

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.FOUNDATION);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.FOUNDATION);
  });

  it("supports the custom Other link type", () => {
    render(
      <UserPageIdentityAddStatementsNFTAccounts
        onClose={onClose}
        profile={profile}
      />
    );

    act(() => {
      itemsProps.setType(STATEMENT_TYPE.LINK);
    });

    expect(formProps.activeType).toBe(STATEMENT_TYPE.LINK);
    expect(formProps.group).toBe(STATEMENT_GROUP.NFT_ACCOUNTS);
  });
});
