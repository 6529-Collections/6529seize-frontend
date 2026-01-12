import ProfileActivityLogsFilterList from "@/components/profile-activity/filter/ProfileActivityLogsFilterList";
import { ProfileActivityLogType } from "@/types/enums";
import { render, screen } from "@testing-library/react";

jest.mock(
  "@/components/profile-activity/filter/ProfileActivityLogsFilterListItem",
  () => (props: any) => <li data-testid="item" data-item={props.itemType}></li>
);

describe("ProfileActivityLogsFilterList", () => {
  it("renders list items for options", () => {
    const options = [
      ProfileActivityLogType.RATING_EDIT,
      ProfileActivityLogType.PFP_EDIT,
    ];
    render(
      <ProfileActivityLogsFilterList
        selected={[]}
        options={options}
        setSelected={jest.fn()}
        user="alice"
      />
    );
    expect(
      screen.getAllByTestId("item").map((el) => el.getAttribute("data-item"))
    ).toEqual(options);
  });
});
