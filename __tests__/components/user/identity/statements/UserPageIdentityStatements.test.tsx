import UserPageIdentityStatements from "@/components/user/identity/statements/UserPageIdentityStatements";
import { STATEMENT_GROUP } from "@/helpers/Types";
import { useQuery } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { useParams } from "next/navigation";

jest.mock("next/navigation", () => ({ useParams: jest.fn() }));

let socialProps: any, contactProps: any, nftProps: any, verifyProps: any;

jest.mock(
  "@/components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddresses",
  () => () => <div data-testid="consolidated" />
);
jest.mock(
  "@/components/user/identity/statements/header/UserPageIdentityAddStatementsHeader",
  () => () => <div data-testid="header" />
);
jest.mock(
  "@/components/user/identity/statements/social-media-accounts/UserPageIdentityStatementsSocialMediaAccounts",
  () => (props: any) => {
    socialProps = props;
    return <div data-testid="social" />;
  }
);
jest.mock(
  "@/components/user/identity/statements/contacts/UserPageIdentityStatementsContacts",
  () => (props: any) => {
    contactProps = props;
    return <div data-testid="contact" />;
  }
);
jest.mock(
  "@/components/user/identity/statements/social-media-verification-posts/UserPageIdentityStatementsSocialMediaVerificationPosts",
  () => (props: any) => {
    verifyProps = props;
    return <div data-testid="verify" />;
  }
);
jest.mock(
  "@/components/user/identity/statements/nft-accounts/UserPageIdentityStatementsNFTAccounts",
  () => (props: any) => {
    nftProps = props;
    return <div data-testid="nft" />;
  }
);

jest.mock("@tanstack/react-query");
(useParams as jest.Mock).mockReturnValue({ user: "alice" });

const useQueryMock = useQuery as jest.Mock;

describe("UserPageIdentityStatements", () => {
  const profile = { id: "p1" } as any;
  const statements = [
    {
      id: "1",
      statement_group: STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT,
      crated_at: new Date("2023-01-01").toISOString(),
    },
    {
      id: "2",
      statement_group: STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT,
      crated_at: new Date("2024-01-01").toISOString(),
    },
    {
      id: "3",
      statement_group: STATEMENT_GROUP.CONTACT,
      crated_at: new Date("2024-05-01").toISOString(),
    },
    {
      id: "4",
      statement_group: STATEMENT_GROUP.NFT_ACCOUNTS,
      crated_at: new Date("2022-01-01").toISOString(),
    },
    {
      id: "5",
      statement_group: STATEMENT_GROUP.SOCIAL_MEDIA_VERIFICATION_POST,
      crated_at: new Date("2024-06-01").toISOString(),
    },
  ] as any;

  beforeEach(() => {
    useQueryMock.mockReturnValue({ isLoading: false, data: statements });
  });

  it("sorts and passes statements to children", () => {
    render(<UserPageIdentityStatements profile={profile} />);
    expect(socialProps.statements.map((s: any) => s.id)).toEqual(["2", "1"]);
    expect(contactProps.statements[0].id).toBe("3");
    expect(nftProps.statements[0].id).toBe("4");
    expect(verifyProps.statements[0].id).toBe("5");
  });
});
