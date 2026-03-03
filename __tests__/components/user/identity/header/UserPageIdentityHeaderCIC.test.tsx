import { render, screen } from "@testing-library/react";
import UserPageIdentityHeaderCIC from "@/components/user/identity/header/UserPageIdentityHeaderCIC";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";

jest.mock(
  "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper",
  () => ({
    __esModule: true,
    default: () => <div data-testid="icon" />,
  })
);

jest.mock("@/components/common/OverlappingAvatars", () => ({
  __esModule: true,
  default: () => <div data-testid="raters-avatars" />,
}));

jest.mock("@/components/user/utils/user-cic-status/UserCICStatus", () => ({
  __esModule: true,
  default: ({ cic }: { cic: number }) => <div data-testid="status">{cic}</div>,
}));

const makeCicOverview = (
  totalCic: number,
  contributorCount: number
): ApiCicOverview =>
  ({
    total_cic: totalCic,
    authenticated_user_contribution: null,
    contributor_count: contributorCount,
    contributors: {
      data: [
        {
          contribution: 500,
          profile: {
            id: "1",
            handle: "bob",
            pfp: null,
            primary_address: "0x123",
          },
        },
      ],
      page: 1,
      next: false,
    },
  }) as unknown as ApiCicOverview;

describe("UserPageIdentityHeaderCIC", () => {
  const baseProfile: ApiIdentity = {
    cic: 1000,
    handle: "alice",
  } as ApiIdentity;

  it("displays NIC and status info from cicOverview", () => {
    const overview = makeCicOverview(1000, 2);
    render(
      <UserPageIdentityHeaderCIC profile={baseProfile} cicOverview={overview} />
    );
    expect(screen.getByText("NIC")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByTestId("raters-avatars")).toBeInTheDocument();
    expect(screen.getByText("2 raters")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("1000");
  });

  it("updates when cicOverview prop changes", () => {
    const overview1 = makeCicOverview(1000, 2);
    const overview2 = makeCicOverview(2000, 3);
    const { rerender } = render(
      <UserPageIdentityHeaderCIC
        profile={baseProfile}
        cicOverview={overview1}
      />
    );
    rerender(
      <UserPageIdentityHeaderCIC
        profile={{ cic: 2000, handle: "alice" } as ApiIdentity}
        cicOverview={overview2}
      />
    );
    expect(screen.getByText("2,000")).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("2000");
  });
});
