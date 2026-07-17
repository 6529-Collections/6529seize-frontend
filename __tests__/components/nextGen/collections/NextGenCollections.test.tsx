import NextGenCollections from "@/components/nextGen/collections/NextGenCollections";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const fetchUrl = jest.fn();

jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: any[]) => fetchUrl(...args),
}));

jest.mock(
  "@/components/nextGen/collections/NextGenCollectionPreview",
  () =>
    ({ collection }: any) => <div data-testid="preview">{collection.name}</div>
);

jest.mock(
  "@/components/utils/select/dropdown/FilterGridDropdown",
  () =>
    ({ items, onSelect, selectedValue, triggerAriaLabel }: any) => (
      <select
        aria-label={triggerAriaLabel}
        value={selectedValue ?? ""}
        onChange={(event) => onSelect(event.target.value || null)}
      >
        <option value="">All statuses</option>
        {items.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    )
);

jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <div data-testid="pagination">
    <button onClick={() => props.setPage(props.page + 1)}>next</button>
  </div>
));

beforeEach(() => {
  fetchUrl.mockReset();
  window.scrollTo = jest.fn();
});

it("fetches collections on mount and displays them", async () => {
  fetchUrl.mockResolvedValue({ count: 1, data: [{ id: 1, name: "A" }] });
  render(<NextGenCollections />);

  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(1));
  expect(fetchUrl).toHaveBeenCalledWith(
    "https://api.test.6529.io/api/nextgen/collections?page_size=25&page=1"
  );
  expect(await screen.findByText("A")).toBeInTheDocument();
});

it("shows message when no collections found", async () => {
  fetchUrl.mockResolvedValue({ count: 0, data: [] });
  render(<NextGenCollections />);
  await screen.findByText("No collections found");
});

it("filters by status and resets page", async () => {
  fetchUrl.mockResolvedValue({ count: 1, data: [{ id: 1, name: "A" }] });
  fetchUrl
    .mockResolvedValueOnce({ count: 1, data: [{ id: 1, name: "A" }] })
    .mockResolvedValueOnce({ count: 1, data: [{ id: 1, name: "A" }] })
    .mockResolvedValueOnce({ count: 1, data: [{ id: 2, name: "B" }] });

  render(<NextGenCollections />);
  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(1));

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: /status/i }),
    "LIVE"
  );

  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
  expect(fetchUrl).toHaveBeenLastCalledWith(
    "https://api.test.6529.io/api/nextgen/collections?page_size=25&page=1&status=LIVE"
  );
});

it("requests next page with pagination", async () => {
  fetchUrl.mockResolvedValue({ count: 26, data: [{ id: 1, name: "A" }] });
  fetchUrl
    .mockResolvedValueOnce({ count: 26, data: [{ id: 1, name: "A" }] })
    .mockResolvedValueOnce({ count: 26, data: [{ id: 1, name: "A" }] })
    .mockResolvedValueOnce({ count: 26, data: [{ id: 2, name: "B" }] });

  render(<NextGenCollections />);
  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(1));

  await userEvent.click(await screen.findByText("next"));

  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
  expect(fetchUrl).toHaveBeenLastCalledWith(
    "https://api.test.6529.io/api/nextgen/collections?page_size=25&page=2"
  );
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
});
