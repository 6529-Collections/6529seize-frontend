import { render, screen } from "@testing-library/react";
import CommunityDownloadsTeam from "@/components/community-downloads/CommunityDownloadsTeam";
import { TitleProvider } from "@/contexts/TitleContext";

jest.mock("@/components/community-downloads/CommunityDownloadsHelpers", () => ({
  DownloadsLayout: ({ children }: any) => <div>{children}</div>,
  DownloadsTable: ({ data, renderRow }: any) => (
    <div>
      {data.map((item: any, idx: number) => (
        <div key={idx} data-testid="row">
          {renderRow(item)}
        </div>
      ))}
    </div>
  ),
}));

describe("CommunityDownloadsTeam", () => {
  it("lists static downloads", () => {
    render(
      <TitleProvider>
        <CommunityDownloadsTeam />
      </TitleProvider>
    );
    const rows = screen.getAllByTestId("row");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Wed, May 10, 2023");
    expect(rows[1]).toHaveTextContent("Thu, Mar 2, 2023");
    expect(rows[2]).toHaveTextContent("Thu, Apr 11, 2024");
    expect(screen.queryByText("Nothing here yet")).not.toBeInTheDocument();
  });
});
