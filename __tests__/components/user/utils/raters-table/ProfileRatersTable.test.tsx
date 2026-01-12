import ProfileRatersTable from "@/components/user/utils/raters-table/ProfileRatersTable";
import { SortDirection } from "@/entities/ISort";
import {
  ProfileRatersParamsOrderBy,
  ProfileRatersTableType,
} from "@/types/enums";
import { render, screen } from "@testing-library/react";

let headerProps: any;
let bodyProps: any;
let paginationProps: any;
jest.mock(
  "@/components/user/utils/raters-table/ProfileRatersTableHeader",
  () => (props: any) => {
    headerProps = props;
    return <thead data-testid="header" />;
  }
);
jest.mock(
  "@/components/user/utils/raters-table/ProfileRatersTableBody",
  () => (props: any) => {
    bodyProps = props;
    return <tbody data-testid="body" />;
  }
);
jest.mock(
  "@/components/utils/table/paginator/CommonTablePagination",
  () => (props: any) => {
    paginationProps = props;
    return <div data-testid="pagination" />;
  }
);

describe("ProfileRatersTable", () => {
  const ratings = [
    {
      rating: 1,
      handle: "h",
      last_modified: new Date().toISOString(),
      level: 1,
      cic: 1,
    },
  ] as any[];

  it("renders table with pagination", () => {
    render(
      <ProfileRatersTable
        ratings={ratings}
        type={ProfileRatersTableType.CIC_RECEIVED}
        order={SortDirection.ASC}
        orderBy={ProfileRatersParamsOrderBy.RATING}
        loading={false}
        totalPages={2}
        currentPage={1}
        setCurrentPage={jest.fn()}
        onSortTypeClick={jest.fn()}
        noRatingsMessage="none"
      />
    );
    expect(headerProps.type).toBe(ProfileRatersTableType.CIC_RECEIVED);
    expect(bodyProps.ratings).toEqual(ratings);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("shows no ratings message when empty", () => {
    render(
      <ProfileRatersTable
        ratings={[]}
        type={ProfileRatersTableType.CIC_RECEIVED}
        order={SortDirection.ASC}
        orderBy={ProfileRatersParamsOrderBy.RATING}
        loading={false}
        totalPages={1}
        currentPage={1}
        setCurrentPage={jest.fn()}
        onSortTypeClick={jest.fn()}
        noRatingsMessage="empty"
      />
    );
    expect(screen.getByText("empty")).toBeInTheDocument();
  });
});
