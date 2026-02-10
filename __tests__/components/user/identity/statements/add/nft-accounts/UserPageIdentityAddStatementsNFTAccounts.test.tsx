import { render } from "@testing-library/react";
import React from "react";
import { act } from "@testing-library/react";
import UserPageIdentityAddStatementsNFTAccounts from "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccounts";
import { STATEMENT_TYPE, STATEMENT_GROUP } from "@/helpers/Types";

let headerProps: any;
let itemsProps: any;
let formProps: any;

jest.mock(
  "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccountHeader",
  () => (props: any) => {
    headerProps = props;
    return <div data-testid="header" />;
  }
);

jest.mock(
  "@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccountItems",
  () => (props: any) => {
    itemsProps = props;
    return <div data-testid="items" />;
  }
);

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm",
  () => (props: any) => {
    formProps = props;
    return <div data-testid="form" />;
  }
);

describe("UserPageIdentityAddStatementsNFTAccounts", () => {
  const profile = { query: "foo" } as any;
  const onClose = jest.fn();

  beforeEach(() => {
    headerProps = undefined;
    itemsProps = undefined;
    formProps = undefined;
  });

  it("passes initial props to children", () => {
    render(
      <UserPageIdentityAddStatementsNFTAccounts onClose={onClose} profile={profile} />
    );

    expect(headerProps.onClose).toBe(onClose);
    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.SUPER_RARE);
    expect(typeof itemsProps.setType).toBe("function");

    expect(formProps.activeType).toBe(STATEMENT_TYPE.SUPER_RARE);
    expect(formProps.group).toBe(STATEMENT_GROUP.NFT_ACCOUNTS);
    expect(formProps.profile).toBe(profile);
    expect(formProps.onClose).toBe(onClose);
  });

  it("updates active type when setType called", () => {
    render(
      <UserPageIdentityAddStatementsNFTAccounts onClose={onClose} profile={profile} />
    );

    act(() => {
      itemsProps.setType(STATEMENT_TYPE.FOUNDATION);
    });

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.FOUNDATION);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.FOUNDATION);
  });
});

