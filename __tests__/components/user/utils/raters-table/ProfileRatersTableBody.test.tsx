import ProfileRatersTableBody from "@/components/user/utils/raters-table/ProfileRatersTableBody";
import { ProfileRatersTableType } from "@/types/enums";
import { render } from "@testing-library/react";

let itemProps: any[] = [];
jest.mock(
  "@/components/user/utils/raters-table/ProfileRatersTableItem",
  () => (props: any) => {
    itemProps.push(props);
    return <tr data-testid="item" />;
  }
);
jest.mock("@/helpers/AllowlistToolHelpers", () => ({
  getRandomObjectId: () => "id",
}));

describe("ProfileRatersTableBody", () => {
  beforeEach(() => {
    itemProps = [];
  });
  it("renders a row for each rating", () => {
    const ratings = [
      { rating: 1, handle: "a", last_modified: "2020", level: 1, cic: 1 },
      { rating: -2, handle: "b", last_modified: "2021", level: 2, cic: 2 },
    ] as any[];
    const { getAllByTestId } = render(
      <table>
        <ProfileRatersTableBody
          ratings={ratings}
          type={ProfileRatersTableType.CIC_RECEIVED}
        />
      </table>
    );
    expect(getAllByTestId("item")).toHaveLength(2);
    expect(itemProps[0].rating).toEqual(ratings[0]);
    expect(itemProps[1].rating).toEqual(ratings[1]);
  });
});
