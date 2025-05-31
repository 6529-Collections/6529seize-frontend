import { render, screen } from "@testing-library/react";
import CommonTimeAgo from "../../../components/utils/CommonTimeAgo";

jest.mock("../../../helpers/Helpers", () => ({
  getTimeAgo: jest.fn(),
  getTimeAgoShort: jest.fn(),
}));

const helpers = jest.requireMock("../../../helpers/Helpers");

describe("CommonTimeAgo", () => {
  it("uses long format by default", () => {
    helpers.getTimeAgo.mockReturnValue("long");
    render(<CommonTimeAgo timestamp={1} />);
    expect(helpers.getTimeAgo).toHaveBeenCalledWith(1);
    const span = screen.getByText("long");
    expect(span).toHaveClass(
      "tw-whitespace-nowrap tw-font-normal tw-text-iron-500 tw-text-sm sm:tw-text-base"
    );
  });

  it("uses short format when short prop set", () => {
    helpers.getTimeAgoShort.mockReturnValue("short");
    render(<CommonTimeAgo timestamp={2} short className="extra" />);
    expect(helpers.getTimeAgoShort).toHaveBeenCalledWith(2);
    const span = screen.getByText("short");
    expect(span).toHaveClass(
      "tw-whitespace-nowrap tw-font-normal tw-text-iron-500 extra"
    );
  });
});
