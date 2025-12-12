import SeasonsDropdown from "@/components/seasons-dropdown/SeasonsDropdown";
import { commonApiFetch } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/api/common-api");

const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const mockSeasons = [
  {
    id: 1,
    start_index: 1,
    end_index: 100,
    count: 100,
    name: "Season 1",
    display: "SZN1",
  },
  {
    id: 2,
    start_index: 101,
    end_index: 200,
    count: 100,
    name: "Season 2",
    display: "SZN2",
  },
  {
    id: 3,
    start_index: 201,
    end_index: 300,
    count: 100,
    name: "Season 3",
    display: "SZN3",
  },
];

it("displays selected season in toggle button when closed", async () => {
  mockCommonApiFetch.mockResolvedValue(mockSeasons);
  const setSelected = jest.fn();

  render(
    <SeasonsDropdown selectedSeason={2} setSelectedSeason={setSelected} />
  );

  await waitFor(() => {
    expect(screen.getByText("SZN: SZN2")).toBeInTheDocument();
  });

  expect(screen.queryByText("All")).not.toBeInTheDocument();
  expect(screen.queryByText("SZN1")).not.toBeInTheDocument();
});

it("opens dropdown and allows season selection", async () => {
  mockCommonApiFetch.mockResolvedValue(mockSeasons);
  const setSelected = jest.fn();
  const user = userEvent.setup();

  render(
    <SeasonsDropdown selectedSeason={2} setSelectedSeason={setSelected} />
  );

  await waitFor(() => {
    expect(screen.getByText("SZN: SZN2")).toBeInTheDocument();
  });

  const toggleButton = screen.getByText("SZN: SZN2");
  await user.click(toggleButton);

  await waitFor(() => {
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  expect(screen.getByText("SZN1")).toBeInTheDocument();
  expect(screen.getByText("SZN3")).toBeInTheDocument();

  const szn3Button = screen.getByText("SZN3");
  await user.click(szn3Button);
  expect(setSelected).toHaveBeenCalledWith(3);
});

it('displays "All" in toggle button when selectedSeason is 0', async () => {
  mockCommonApiFetch.mockResolvedValue(mockSeasons);
  const setSelected = jest.fn();

  render(
    <SeasonsDropdown selectedSeason={0} setSelectedSeason={setSelected} />
  );

  await waitFor(() => {
    expect(screen.getByText("SZN: All")).toBeInTheDocument();
  });
});

it('shows "All" as selected in dropdown when opened', async () => {
  mockCommonApiFetch.mockResolvedValue(mockSeasons);
  const setSelected = jest.fn();
  const user = userEvent.setup();

  render(
    <SeasonsDropdown selectedSeason={0} setSelectedSeason={setSelected} />
  );

  await waitFor(() => {
    expect(screen.getByText("SZN: All")).toBeInTheDocument();
  });

  const toggleButton = screen.getByText("SZN: All");
  await user.click(toggleButton);

  await waitFor(() => {
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  const allButton = screen.getByText("All");
  expect(allButton).toHaveClass("selected");
});
