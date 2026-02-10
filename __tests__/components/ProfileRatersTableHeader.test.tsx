import ProfileRatersTableHeader from "@/components/user/utils/raters-table/ProfileRatersTableHeader";
import { SortDirection } from "@/entities/ISort";
import {
  ProfileRatersParamsOrderBy,
  ProfileRatersTableType,
} from "@/types/enums";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ProfileRatersTableHeader", () => {
  it("shows correct title based on table type", () => {
    const { rerender } = render(
      <table>
        <ProfileRatersTableHeader
          type={ProfileRatersTableType.CIC_RECEIVED}
          sortDirection={SortDirection.ASC}
          sortOrderBy={ProfileRatersParamsOrderBy.RATING}
          isLoading={false}
          onSortTypeClick={jest.fn()}
        />
      </table>
    );
    expect(screen.getByText("Total NIC")).toBeInTheDocument();

    rerender(
      <table>
        <ProfileRatersTableHeader
          type={ProfileRatersTableType.REP_GIVEN}
          sortDirection={SortDirection.ASC}
          sortOrderBy={ProfileRatersParamsOrderBy.RATING}
          isLoading={false}
          onSortTypeClick={jest.fn()}
        />
      </table>
    );
    expect(screen.getByText("Total Rep")).toBeInTheDocument();
  });

  it("invokes onSortTypeClick when sortable column clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <table>
        <ProfileRatersTableHeader
          type={ProfileRatersTableType.CIC_RECEIVED}
          sortDirection={SortDirection.ASC}
          sortOrderBy={ProfileRatersParamsOrderBy.RATING}
          isLoading={false}
          onSortTypeClick={onClick}
        />
      </table>
    );

    const sortable = screen.getAllByRole("columnheader")[1];
    await user.click(sortable);
    expect(onClick).toHaveBeenCalledWith(ProfileRatersParamsOrderBy.RATING);
  });
});
