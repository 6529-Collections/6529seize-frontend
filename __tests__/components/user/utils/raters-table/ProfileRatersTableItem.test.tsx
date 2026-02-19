import ProfileRatersTableItem from "@/components/user/utils/raters-table/ProfileRatersTableItem";
import { render, screen } from "@testing-library/react";

let cicProps: any;
jest.mock("@/components/user/utils/UserCICAndLevel", () => (props: any) => {
  cicProps = props;
  return <div data-testid="cic" />;
});

describe("ProfileRatersTableItem", () => {
  const baseRating: any = {
    handle: "bob",
    rating: 5,
    last_modified: new Date("2020-01-01").toISOString(),
    level: 3,
    cic: 10,
  };

  it("shows positive rating and rep link", () => {
    render(
      <table>
        <tbody>
          <ProfileRatersTableItem
            rating={baseRating}
          />
        </tbody>
      </table>
    );
    const link = screen.getByText("bob").closest("a")!;
    expect(link).toHaveAttribute("href", "/bob/rep");
    expect(screen.getByText("+5")).toBeInTheDocument();
    expect(cicProps.level).toBe(3);
  });

  it("shows negative rating without plus sign", () => {
    const rating = { ...baseRating, rating: -2 };
    render(
      <table>
        <tbody>
          <ProfileRatersTableItem
            rating={rating}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText("-2")).toBeInTheDocument();
  });
});
