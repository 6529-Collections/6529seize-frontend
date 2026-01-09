import { render, screen } from "@testing-library/react";
import CommunityMembersTableRow from "@/components/community/members-table/CommunityMembersTableRow";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";

jest.mock("@/helpers/Helpers", () => ({
  formatNumberWithCommasOrDash: (n: number) => `#${n}`,
  formatLargeNumber: (n: number) => `${n}M`,
  getTimeAgoShort: () => "2h",
}));

jest.mock("@/helpers/AllowlistToolHelpers", () => ({
  isEthereumAddress: (val: string) => val.startsWith("0x"),
}));

jest.mock("@/helpers/image.helpers", () => ({
  ImageScale: { W_AUTO_H_50: "AUTOx50" },
  getScaledImageUri: (url: string) => `scaled-${url}`,
}));

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="level" />,
  UserCICAndLevelSize: { MEDIUM: "MEDIUM" },
}));

jest.mock("@/components/user/utils/user-cic-type/UserCICTypeIcon", () => ({
  __esModule: true,
  default: () => <div data-testid="cic-icon" />,
}));

jest.mock("react-tooltip", () => ({
  Tooltip: () => null,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const baseMember: ApiCommunityMemberOverview = {
  display: "Alice",
  detail_view_key: "alice",
  level: 1,
  tdh: 10,
  tdh_rate: 0,
  xtdh: 5,
  xtdh_rate: 0,
  combined_tdh: 10,
  combined_tdh_rate: 0,
  rep: 5,
  cic: 2,
  pfp: "pfp.png",
  last_activity: 123,
  wallet: "0x123",
};

describe("CommunityMembersTableRow", () => {
  it("renders profile member info", () => {
    render(
      <table>
        <tbody>
          <CommunityMembersTableRow member={baseMember} rank={1} />
        </tbody>
      </table>
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/alice");
    expect(screen.getByRole("link")).toHaveTextContent("Alice");
    expect(screen.getByText("10M")).toBeInTheDocument();
    expect(screen.getByText("5M")).toBeInTheDocument();
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByTestId("level")).toBeInTheDocument();
    expect(screen.getByTestId("cic-icon")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();
  });

  it("renders address member with correct href", () => {
    const member = { ...baseMember, detail_view_key: "0xabc", display: "0xabc" };
    render(
      <table>
        <tbody>
          <CommunityMembersTableRow member={member} rank={2} />
        </tbody>
      </table>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/0xabc");
  });
});
