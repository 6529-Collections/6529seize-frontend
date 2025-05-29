import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropMetadata from "../../components/waves/drops/WaveDropMetadata";

jest.mock("../../hooks/isMobileDevice", () => () => false);

describe("WaveDropMetadata", () => {
  const metadata = [
    { data_key: "a", data_value: "1" },
    { data_key: "b", data_value: "2" },
    { data_key: "c", data_value: "3" },
  ];

  it("shows show all button and toggles", async () => {
    const user = userEvent.setup();
    render(<WaveDropMetadata metadata={metadata as any} />);
    expect(screen.getByText("Show all")).toBeInTheDocument();
    await user.click(screen.getByText("Show all"));
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });
});
